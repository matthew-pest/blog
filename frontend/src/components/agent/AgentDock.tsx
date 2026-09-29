'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Brain, Paperclip, Sparkles, Ticket, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgentStore } from '@/lib/agent-state';
import type { AgentUIMessage } from '@/lib/ai/types';
import { highlightPassage } from './highlight';
import { MessageParts } from './MessageParts';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input';
import { Attachment, AttachmentPreview, AttachmentRemove, Attachments } from '@/components/ai-elements/attachments';

/** Attach + poster shortcut; lives inside PromptInput so it can open the file dialog. */
function DockTools({ onPoster }: { onPoster: () => void }) {
  const { openFileDialog } = usePromptInputAttachments();
  return (
    <PromptInputTools className="gap-1">
      <PromptInputButton onClick={openFileDialog} tooltip="Attach a poster or image" className="text-muted-foreground">
        <Paperclip className="size-4" />
      </PromptInputButton>
      <PromptInputButton onClick={onPoster} className="gap-1.5 px-2 text-xs text-muted-foreground">
        <Ticket className="size-3.5" /> Poster → Event
      </PromptInputButton>
    </PromptInputTools>
  );
}

/** Thumbnails for files queued in the prompt (posters, mostly). */
function DockAttachments() {
  const { files, remove } = usePromptInputAttachments();
  if (files.length === 0) return null;
  return (
    <Attachments variant="grid" className="ml-0 px-3 pt-3">
      {files.map((f) => (
        <Attachment key={f.id} data={f} onRemove={() => remove(f.id)} className="size-16">
          <AttachmentPreview />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  );
}
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import { Shimmer } from '@/components/ai-elements/shimmer';

/**
 * The agent dock: a ⌘K panel that floats over every page. It talks to
 * /api/chat, fulfils the agent's client tools (navigate, highlight), and
 * writes the conversation's mood into the shared store so the field reacts.
 */
export default function AgentDock({ lang }: { lang: string }) {
  const router = useRouter();
  const open = useAgentStore((s) => s.dockOpen);
  const setOpen = useAgentStore((s) => s.setDockOpen);
  const toggle = useAgentStore((s) => s.toggleDock);
  const deep = useAgentStore((s) => s.deep);
  const setDeep = useAgentStore((s) => s.setDeep);
  const draft = useAgentStore((s) => s.draft);
  const setDraft = useAgentStore((s) => s.setDraft);
  const page = useAgentStore((s) => s.page);
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [text, setText] = useState('');

  const transport = useMemo(
    () =>
      new DefaultChatTransport<AgentUIMessage>({
        api: '/api/chat',
        prepareSendMessagesRequest: ({ id, messages }) => ({
          body: {
            id,
            messages,
            context: useAgentStore.getState().page,
            deep: useAgentStore.getState().deep,
          },
        }),
      }),
    []
  );

  const { messages, sendMessage, status, error, addToolOutput, stop, clearError } = useChat<AgentUIMessage>({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onData: (part) => {
      if (part.type !== 'data-status') return;
      const s = useAgentStore.getState();
      s.setMood(part.data.mood);
      if (part.data.hue != null) s.setHue(part.data.hue);
      if (part.data.ripple) s.ripple([0.5, 0.35]);
      setStatusLabel(part.data.label ?? null);
    },
    onToolCall: ({ toolCall }) => {
      if (toolCall.dynamic) return;
      const s = useAgentStore.getState();
      if (toolCall.toolName === 'navigate') {
        const { path } = toolCall.input as { path: string };
        const safe = path.startsWith('/') ? path : `/${lang}${path.startsWith('/') ? '' : '/'}${path}`;
        s.setMood('acting');
        router.push(safe);
        addToolOutput({ tool: 'navigate', toolCallId: toolCall.toolCallId, output: { ok: true, path: safe } });
      } else if (toolCall.toolName === 'setBackground') {
        const { variant } = toolCall.input as { variant: 'grain' | 'contour' };
        s.setMood('acting');
        s.setFieldVariant(variant);
        addToolOutput({ tool: 'setBackground', toolCallId: toolCall.toolCallId, output: { ok: true, variant } });
      } else if (toolCall.toolName === 'highlight') {
        const { text } = toolCall.input as { text: string };
        s.setMood('acting');
        // The page may still be arriving after a navigate; retry briefly.
        let attempts = 0;
        const tryHighlight = () => {
          const found = highlightPassage(text);
          if (found || attempts++ > 8) {
            s.setHighlight(found ? text : null);
            const page = useAgentStore.getState().page;
            addToolOutput({
              tool: 'highlight',
              toolCallId: toolCall.toolCallId,
              output: found
                ? { ok: true }
                : {
                    ok: false,
                    reason: 'Passage not found on the current page. Do not retry; navigate to the right page first or tell the visitor.',
                    currentPage: `${page.kind}${page.title ? ` "${page.title}"` : ''} at ${page.path}`,
                  },
            });
          } else {
            window.setTimeout(tryHighlight, 250);
          }
        };
        tryHighlight();
      }
    },
    onError: () => useAgentStore.getState().setMood('error'),
  });

  // Mirror the request lifecycle into the field's mood.
  useEffect(() => {
    const s = useAgentStore.getState();
    if (status === 'submitted') s.setMood('thinking');
    else if (status === 'streaming') s.setMood('streaming');
    else if (status === 'ready') {
      s.setMood(open ? 'listening' : 'idle');
      setStatusLabel(null);
    } else if (status === 'error') s.setMood('error');
  }, [status, open]);

  // ⌘K / Ctrl+K toggles; Esc closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'Escape' && useAgentStore.getState().dockOpen) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, setOpen]);

  // Accept drafts handed over from buttons elsewhere on the site.
  useEffect(() => {
    if (draft) {
      setText(draft);
      setDraft(null);
    }
  }, [draft, setDraft]);

  const submit = useCallback(
    (message: PromptInputMessage) => {
      const body = message.text.trim();
      if (!body && message.files.length === 0) return;
      clearError();
      sendMessage({ text: body || 'Here is a poster.', files: message.files });
      setText('');
    },
    [sendMessage, clearError]
  );

  const suggestions = useMemo(() => {
    const s: string[] = [];
    if (page.kind === 'post') s.push('Summarize this post in three lines', 'Show me the most surprising claim here');
    if (page.selection) s.push('Explain the text I selected');
    s.push(
      'What has Matt written about quantum computing?',
      'Is Matt a fit for a Principal AI Architect role? Cite the résumé.',
      'What is Telekinetik?',
      'What changed in the MCP spec this year?'
    );
    return s.slice(0, 5);
  }, [page.kind, page.selection]);

  const busy = status === 'submitted' || status === 'streaming';
  const panelRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={toggle}
        aria-label="Ask the site"
        className={cn(
          'no-print fixed bottom-5 left-1/2 z-40 -translate-x-1/2 items-center gap-2 rounded-full pl-3 pr-4 text-sm transition-all duration-500 glass',
          open ? 'pointer-events-none translate-y-6 opacity-0' : 'flex h-11 opacity-100 hover:border-glow/40'
        )}
      >
        <span className={cn('relative grid size-6 place-items-center rounded-full bg-glow/15', busy && 'pulse-ring')}>
          <Sparkles className="size-3.5 text-glow" />
        </span>
        <span>Ask the site</span>
        <span className="kbd">⌘K</span>
      </button>

      {/* Panel */}
      <div
        ref={panelRef}
        data-agent-dock
        role="dialog"
        aria-label="Site agent"
        aria-hidden={!open}
        className={cn(
          'no-print fixed z-50 flex flex-col overflow-hidden glass-strong transition-all duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)]',
          'inset-x-2 bottom-2 h-[78dvh] rounded-3xl sm:inset-x-auto sm:right-4 sm:top-[4.6rem] sm:bottom-4 sm:h-auto sm:w-[430px]',
          open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
        )}
      >
        <header className="flex items-center justify-between border-b hairline px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className={cn('relative grid size-7 place-items-center rounded-full bg-glow/15', busy && 'pulse-ring')}>
              <Sparkles className="size-3.5 text-glow" />
            </span>
            <div>
              <p className="text-sm font-medium leading-none">Site agent</p>
              <p className="mt-1 text-[0.7rem] text-muted-foreground">
                {statusLabel ? <Shimmer as="span">{statusLabel}</Shimmer> : deep ? 'Claude Opus · deep mode' : 'Claude via Vercel AI Gateway'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setDeep(!deep)}
              title="Think harder (Claude Opus 5)"
              className={cn(
                'flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs transition-colors',
                deep ? 'border-glow/60 bg-glow/15 text-foreground' : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              <Brain className="size-3.5" />
              Deep
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </header>

        <Conversation className="flex-1">
          <ConversationContent className="gap-5 px-4 py-4">
            {messages.length === 0 && (
              <div className="rise flex h-full flex-col justify-end gap-3 pb-2">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  I read the posts, open the résumé, search the web, and move the page as I go. Attach a poster and I’ll
                  turn it into an event.
                </p>
                <Suggestions className="[&_[data-radix-scroll-area-viewport]]:pb-1">
                  {suggestions.map((s) => (
                    <Suggestion key={s} suggestion={s} onClick={(v) => submit({ text: v, files: [] })} className="rounded-full text-xs" />
                  ))}
                </Suggestions>
              </div>
            )}
            {messages.map((m) => (
              <Message key={m.id} from={m.role}>
                <MessageContent className={cn(m.role === 'assistant' && 'w-full bg-transparent px-0 py-0')}>
                  <MessageParts message={m} lang={lang} isLast={m.id === messages[messages.length - 1]?.id} status={status} />
                </MessageContent>
              </Message>
            ))}
            {error && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error.message}
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t hairline p-2">
          <PromptInput
            onSubmit={submit}
            accept="image/*"
            multiple
            maxFiles={3}
            maxFileSize={5 * 1024 * 1024}
            className="rounded-2xl border-border/70 bg-background/40"
          >
            <DockAttachments />
            <PromptInputBody>
              <PromptInputTextarea
                value={text}
                onChange={(e) => setText(e.currentTarget.value)}
                placeholder={page.kind === 'post' ? 'Ask about this post…' : 'Ask about the writing, the work, or the world…'}
                className="min-h-[44px] text-sm"
              />
            </PromptInputBody>
            <PromptInputFooter>
              <DockTools onPoster={() => setDraft('I want to turn a poster into a structured event. What do you need?')} />
              <PromptInputSubmit status={status} onStop={stop} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </>
  );
}
