import type { InferUITools, UIMessage } from 'ai';
import type { PageContext } from '@/lib/agent-state';
import type { agentTools } from './tools';

/** Transient status the server streams while working — drives the field. */
export interface AgentStatus {
  mood: 'thinking' | 'searching' | 'reading' | 'acting' | 'streaming' | 'idle';
  label?: string;
  /** Palette hue to drift toward (e.g. a post's category colour). */
  hue?: number;
  /** Trigger a ripple in the field. */
  ripple?: boolean;
}

export type AgentDataParts = {
  status: AgentStatus;
};

export interface AgentMessageMetadata {
  model?: string;
  createdAt?: number;
}

export type AgentTools = InferUITools<typeof agentTools>;

export type AgentUIMessage = UIMessage<AgentMessageMetadata, AgentDataParts, AgentTools>;

/** What the client sends alongside the messages. */
export interface ChatRequestBody {
  id?: string;
  messages: AgentUIMessage[];
  context?: PageContext;
  deep?: boolean;
}
