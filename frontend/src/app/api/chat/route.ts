import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  toUIMessageStream,
} from 'ai';
import { agentTools } from '@/lib/ai/tools';
import { buildSystemPrompt, describePage } from '@/lib/ai/system';
import { checkRateLimit, clientIp } from '@/lib/ai/rate-limit';
import { CATEGORY_HUE } from '@/lib/agent-state';
import type { AgentStatus, AgentUIMessage, ChatRequestBody } from '@/lib/ai/types';

export const maxDuration = 60;

/**
 * Model routing. Claude 5 is the target; the Gateway falls back down the list
 * when a model is unavailable (e.g. the free tier restricts Claude 5 until the
 * account has paid credits). Override per environment without a deploy.
 */
const MODELS = {
  fast: process.env.AGENT_MODEL_FAST ?? 'anthropic/claude-sonnet-5',
  deep: process.env.AGENT_MODEL_DEEP ?? 'anthropic/claude-opus-5',
};
const FALLBACKS = {
  fast: (process.env.AGENT_MODEL_FAST_FALLBACKS ?? 'anthropic/claude-sonnet-4.6,anthropic/claude-haiku-4.5').split(',').filter(Boolean),
  deep: (process.env.AGENT_MODEL_DEEP_FALLBACKS ?? 'anthropic/claude-opus-4.6,anthropic/claude-sonnet-4.6').split(',').filter(Boolean),
};

function friendlyError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (/free tier|paid credits|RestrictedModels/i.test(msg))
    return 'The AI Gateway account is on the free tier, which restricts this model. Add credits to the Vercel AI Gateway to enable it.';
  if (/rate.?limit/i.test(msg)) return 'The model is rate-limited right now. Try again in a moment.';
  if (/context|too long/i.test(msg)) return 'That conversation got too long — start a fresh one.';
  return 'The agent hit an error. Try again in a moment.';
}

const MAX_TEXT_CHARS = 6000;
const MAX_FILE_BYTES = 6 * 1024 * 1024;

function validate(body: ChatRequestBody): string | null {
  if (!Array.isArray(body.messages) || body.messages.length === 0) return 'No messages.';
  if (body.messages.length > 60) return 'Conversation too long — start a new one.';
  const last = body.messages[body.messages.length - 1];
  let fileBytes = 0;
  for (const part of last.parts ?? []) {
    if (part.type === 'text' && part.text.length > MAX_TEXT_CHARS) return 'Message too long.';
    if (part.type === 'file') {
      if (!part.mediaType.startsWith('image/')) return 'Only images can be attached.';
      fileBytes += Math.ceil((part.url.length * 3) / 4);
    }
  }
  if (fileBytes > MAX_FILE_BYTES) return 'Attachments too large (6 MB max).';
  return null;
}

export async function POST(req: Request) {
  if (!process.env.AI_GATEWAY_API_KEY) {
    return Response.json({ error: 'AI_GATEWAY_API_KEY is not configured.' }, { status: 500 });
  }

  const limit = checkRateLimit(clientIp(req));
  if (!limit.ok) {
    return Response.json(
      { error: 'Easy — that is a lot of questions. Try again in a few minutes.' },
      { status: 429, headers: { 'retry-after': String(limit.retryAfterSec) } }
    );
  }

  const body = (await req.json()) as ChatRequestBody;
  const invalid = validate(body);
  if (invalid) return Response.json({ error: invalid }, { status: 400 });

  const deep = body.deep === true;
  const model = deep ? MODELS.deep : MODELS.fast;
  const fallbacks = deep ? FALLBACKS.deep : FALLBACKS.fast;
  const system = await buildSystemPrompt(body.context, deep);

  const modelMessages = await convertToModelMessages(body.messages);

  // The system prompt carries the page context, but a long conversation's
  // prior can drown a change at the tail of it. Pin the current page to the
  // latest user turn as well, where the model looks first.
  if (body.context) {
    const note = `[Visitor is on the ${describePage(body.context)}]`;
    for (let i = modelMessages.length - 1; i >= 0; i--) {
      const m = modelMessages[i];
      if (m.role !== 'user') continue;
      if (typeof m.content === 'string') m.content = `${note}\n${m.content}`;
      else m.content = [{ type: 'text', text: note }, ...m.content];
      break;
    }
  }

  const stream = createUIMessageStream<AgentUIMessage>({
    originalMessages: body.messages,
    execute: ({ writer }) => {
      const status = (data: AgentStatus) => writer.write({ type: 'data-status', data, transient: true });

      status({ mood: 'thinking' });

      const result = streamText({
        model,
        // AI SDK 7: system text goes in `instructions`, never in `messages`.
        instructions: system,
        messages: modelMessages,
        tools: agentTools,
        stopWhen: stepCountIs(8),
        providerOptions: {
          gateway: { models: fallbacks },
          ...(deep ? { anthropic: { thinking: { type: 'enabled', budgetTokens: 6000 } } } : {}),
        },
        onChunk: ({ chunk }) => {
          // Narrate tool activity to the client so the field reacts before results land.
          if (chunk.type === 'tool-input-start') {
            switch (chunk.toolName) {
              case 'webSearch':
                status({ mood: 'searching', label: 'Searching the web', ripple: true });
                break;
              case 'searchPosts':
              case 'listPosts':
                status({ mood: 'reading', label: 'Searching the blog' });
                break;
              case 'readPost':
                status({ mood: 'reading', label: 'Reading a post' });
                break;
              case 'getResume':
                status({ mood: 'reading', label: 'Opening the résumé', hue: CATEGORY_HUE.resume });
                break;
              case 'extractEvent':
                status({ mood: 'acting', label: 'Reading the poster' });
                break;
              case 'navigate':
              case 'highlight':
                status({ mood: 'acting', label: 'Moving the page' });
                break;
            }
          } else if (chunk.type === 'tool-result' && chunk.toolName === 'readPost') {
            const category = (chunk.output as { category?: string } | undefined)?.category;
            if (category) status({ mood: 'reading', hue: CATEGORY_HUE[category] ?? CATEGORY_HUE.default });
          } else if (chunk.type === 'text-delta') {
            // Only flip once per response; cheap enough to send repeatedly but noisy.
          }
        },
      });

      writer.merge(
        toUIMessageStream({
          stream: result.stream,
          tools: agentTools,
          sendReasoning: true,
          sendSources: true,
          sendStart: true,
          onError: (error) => {
            console.error('[chat:model]', error);
            return friendlyError(error);
          },
          messageMetadata: ({ part }) =>
            part.type === 'start' ? { model, createdAt: Date.now() } : undefined,
        })
      );
    },
    onError: (error) => {
      console.error('[chat]', error);
      return friendlyError(error);
    },
  });

  return createUIMessageStreamResponse({ stream });
}
