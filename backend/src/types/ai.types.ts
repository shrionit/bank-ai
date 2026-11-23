export type ListItemType = string | { title: string; desc: string };

export interface TextDetailMessage {
  type: "text";
  text: string;
}

export interface ListDetailMessage {
  type: "list";
  title?: string;
  items: ListItemType[];
}

export type DetailMessage = TextDetailMessage | ListDetailMessage;

/**
 * Enforced response structure for all bank AI outputs.
 * - speech: Read aloud via TTS on the UI.
 * - details: Displayed in the chat UI history as either text or structured list.
 */
export interface BankAIResponse {
  speech: string;
  details: DetailMessage;
  thinking?: string;
  raw?: unknown;
  toolResults?: Record<string, any>;
  conversation?: AIMessage[];
}

export interface ToolFunctionParameter {
  type: string;
  description?: string;
  enum?: string[];
  items?: Record<string, unknown>;
  properties?: Record<string, unknown>;
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, ToolFunctionParameter>;
      required?: string[];
    };
  };
}

export interface ToolCall {
  id?: string;
  function: {
    name: string;
    arguments: Record<string, any>;
  };
}

export interface ToolExecutable {
  definition: ToolDefinition;
  handler: (args: any) => Promise<unknown> | unknown;
}

export interface AIMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: Array<{
    id?: string;
    function: {
      name: string;
      arguments: Record<string, any>;
    };
  }>;
}

export interface GenerateOptions {
  systemPrompt?: string;
  temperature?: number;
  think?: boolean;
  tools?: ToolExecutable[];
}
