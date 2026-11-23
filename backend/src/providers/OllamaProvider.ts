import type {
  AIProvider,
  BankAIResponse,
  AIMessage,
  GenerateOptions,
  DetailMessage,
  ListItemType,
  ToolExecutable,
} from "./AIProvider.js";
import { DEFAULT_BANK_SYSTEM_PROMPT } from "./AIProvider.js";

export interface OllamaConfig {
  think?: boolean;
  model?: string;
  baseUrl?: string;
}

export class OllamaProvider implements AIProvider {
  private readonly config: {
    think: boolean;
    model: string;
    baseUrl: string;
  };

  constructor(config: OllamaConfig = { think: false }) {
    this.config = {
      think: config.think ?? false,
      model: config.model || process.env.OLLAMA_MODEL || "qwen3:8b",
      baseUrl: (config.baseUrl || process.env.OLLAMA_URL || "http://localhost:11434").replace(/\/+$/, ""),
    };
  }

  /**
   * Generates a structured BankAIResponse from a single prompt string.
   */
  async generateResponse(prompt: string, options?: GenerateOptions): Promise<BankAIResponse> {
    const messages: AIMessage[] = [{ role: "user", content: prompt }];
    return this.chat(messages, options);
  }

  /**
   * Chat completion with history and tool execution support.
   */
  async chat(messages: AIMessage[], options?: GenerateOptions): Promise<BankAIResponse> {
    const thinkEnabled = options?.think ?? this.config.think;
    const systemPrompt = options?.systemPrompt || DEFAULT_BANK_SYSTEM_PROMPT;
    const tools = options?.tools || [];

    // Ensure system prompt is present
    const conversation: AIMessage[] = [];
    if (!messages.some((m) => m.role === "system")) {
      conversation.push({ role: "system", content: systemPrompt });
    }
    conversation.push(...messages);

    // If tools are provided, handle tool execution loop
    if (tools.length > 0) {
      return this.chatWithTools(conversation, tools, thinkEnabled, options?.temperature);
    }

    return this.executeOllamaChat(conversation, thinkEnabled, options?.temperature);
  }

  /**
   * Tool execution loop with Ollama.
   */
  private async chatWithTools(
    conversation: AIMessage[],
    tools: ToolExecutable[],
    thinkEnabled: boolean,
    temperature?: number
  ): Promise<BankAIResponse> {
    const toolDefinitions = tools.map((t) => t.definition);
    const toolHandlerMap = new Map<string, (args: any) => Promise<unknown> | unknown>();
    for (const t of tools) {
      toolHandlerMap.set(t.definition.function.name, t.handler);
    }

    const toolResultsMap: Record<string, any> = {};

    const maxSteps = 4;
    for (let step = 0; step < maxSteps; step++) {
      const payload: Record<string, unknown> = {
        model: this.config.model,
        messages: conversation,
        stream: false,
        tools: toolDefinitions,
        options: {
          temperature: temperature ?? 0.7,
        },
      };

      if (typeof thinkEnabled === "boolean") {
        payload.think = thinkEnabled;
      }

      try {
        const response = await fetch(`${this.config.baseUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Ollama HTTP error ${response.status}: ${errorText}`);
        }

        const data = (await response.json()) as {
          message?: {
            role?: string;
            content?: string;
            thinking?: string;
            tool_calls?: Array<{
              function: {
                name: string;
                arguments: Record<string, any>;
              };
            }>;
          };
        };

        const assistantMsg = data.message;
        const toolCalls = assistantMsg?.tool_calls;

        if (toolCalls && toolCalls.length > 0) {
          console.log(
            `[AIProvider] (Step ${step + 1}) Model invoked ${toolCalls.length} tool(s):`,
            toolCalls.map((t) => t.function.name).join(", ")
          );

          conversation.push({
            role: "assistant",
            content: assistantMsg?.content || "",
            tool_calls: toolCalls,
          });

          for (const call of toolCalls) {
            const fnName = call.function.name;
            const fnArgs = call.function.arguments || {};
            const handler = toolHandlerMap.get(fnName);

            let toolResult: unknown;
            if (handler) {
              try {
                toolResult = await handler(fnArgs);
              } catch (err: any) {
                toolResult = { error: `Failed to execute ${fnName}: ${err.message}` };
              }
            } else {
              toolResult = { error: `Tool ${fnName} not recognized` };
            }

            toolResultsMap[fnName] = toolResult;

            conversation.push({
              role: "tool",
              content: JSON.stringify(toolResult),
            });
          }

          // Continue loop to allow model to call another tool or formulate response with tool results
          continue;
        }

        // If tools were executed in previous steps, ensure response conforms to JSON schema via executeOllamaChat
        if (step > 0) {
          return this.executeOllamaChat(conversation, thinkEnabled, temperature, toolResultsMap);
        }

        // If no tool calls were made at all, parse direct content
        const parsed = this.parseStructuredResponse(
          assistantMsg?.content || "",
          assistantMsg?.thinking,
          thinkEnabled
        );
        parsed.conversation = conversation;
        return parsed;
      } catch (error: any) {
        return {
          speech: "I encountered an issue retrieving that information. Please try again.",
          details: {
            type: "text",
            text: `Error processing request: ${error.message}`,
          },
          raw: { error: error.message },
          toolResults: toolResultsMap,
          conversation,
        };
      }
    }

    // Fallback if max steps reached
    return this.executeOllamaChat(conversation, thinkEnabled, temperature, toolResultsMap);
  }

  /**
   * Direct Ollama chat call expecting structured JSON.
   */
  private async executeOllamaChat(
    conversation: AIMessage[],
    thinkEnabled: boolean,
    temperature?: number,
    toolResults?: Record<string, any>
  ): Promise<BankAIResponse> {
    const payload: Record<string, unknown> = {
      model: this.config.model,
      messages: conversation,
      stream: false,
      format: "json",
      options: {
        temperature: temperature ?? 0.7,
      },
    };

    if (typeof thinkEnabled === "boolean") {
      payload.think = thinkEnabled;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama HTTP error ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as {
        message?: {
          role?: string;
          content?: string;
          thinking?: string;
        };
      };

      const rawContent = data.message?.content || "";
      const directThinking = data.message?.thinking;

      const structured = this.parseStructuredResponse(rawContent, directThinking, thinkEnabled);
      if (toolResults) {
        structured.toolResults = toolResults;
      }
      structured.conversation = conversation;
      return structured;
    } catch (error: any) {
      return {
        speech: "I encountered an error connecting to the AI model.",
        details: {
          type: "text",
          text: `Error: ${error.message}`,
        },
        raw: { error: error.message },
        toolResults,
        conversation,
      };
    }
  }

  /**
   * Enforces that the output satisfies BankAIResponse with speech and details.
   */
  private parseStructuredResponse(
    rawContent: string,
    directThinking?: string,
    thinkEnabled: boolean = false
  ): BankAIResponse {
    let thinking: string | undefined = directThinking;
    let cleanText = rawContent;

    // Extract <think>...</think> if present
    const thinkMatch = rawContent.match(/<think>([\s\S]*?)<\/think>/i);
    if (thinkMatch) {
      if (!thinking) {
        thinking = thinkMatch[1].trim();
      }
      cleanText = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    }

    // Remove markdown code blocks
    cleanText = cleanText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      const firstBrace = cleanText.indexOf("{");
      const lastBrace = cleanText.lastIndexOf("}");

      let jsonString = cleanText;
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonString = cleanText.substring(firstBrace, lastBrace + 1);
      }

      const parsed = JSON.parse(jsonString);

      // Validate or construct speech
      const speech = typeof parsed.speech === "string" && parsed.speech.trim()
        ? parsed.speech.trim()
        : this.generateSpeechFallback(parsed);

      // Validate or construct details
      const details = this.normalizeDetails(parsed.details || parsed);

      const response: BankAIResponse = {
        speech,
        details,
        raw: parsed,
      };

      if (thinkEnabled && thinking) {
        response.thinking = thinking;
      }

      return response;
    } catch {
      // Fallback if model output is not valid JSON
      const fallbackSpeech = this.cleanForSpeech(cleanText);
      const fallbackResponse: BankAIResponse = {
        speech:
          fallbackSpeech ||
          (thinking ? this.cleanForSpeech(thinking) : "Here is the requested bank information."),
        details: {
          type: "text",
          text: cleanText || thinking || rawContent || "How can I assist you with DBS banking today?",
        },
        raw: { rawContent },
      };

      if (thinkEnabled && thinking) {
        fallbackResponse.thinking = thinking;
      }

      return fallbackResponse;
    }
  }

  /**
   * Normalizes details to ensure type is "text" | "list" and items are string | {title, desc}.
   */
  private normalizeDetails(details: any): DetailMessage {
    if (!details || typeof details !== "object") {
      return { type: "text", text: String(details || "") };
    }

    if (details.type === "list" && Array.isArray(details.items)) {
      const normalizedItems: ListItemType[] = details.items.map((item: any) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          return {
            title: String(item.title || item.name || "Item"),
            desc: String(item.desc || item.description || item.subtitle || ""),
          };
        }
        return String(item);
      });

      return {
        type: "list",
        title: details.title ? String(details.title) : undefined,
        items: normalizedItems,
      };
    }

    // Default to text detail
    const textContent = details.text || details.content || details.message || JSON.stringify(details, null, 2);
    return {
      type: "text",
      text: typeof textContent === "string" ? textContent : JSON.stringify(textContent),
    };
  }

  private generateSpeechFallback(parsed: any): string {
    if (parsed.details?.text) {
      return this.cleanForSpeech(parsed.details.text);
    }
    if (parsed.details?.title) {
      return `Here are the details for ${parsed.details.title}.`;
    }
    if (parsed.text) {
      return this.cleanForSpeech(parsed.text);
    }
    return "Here is the banking information you requested.";
  }

  private cleanForSpeech(text: string): string {
    // Strip markdown formatting, URLs, code fences
    const clean = text
      .replace(/https?:\/\/\S+/g, "")
      .replace(/[*_#`~[\]]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Take first 1-2 sentences
    const sentences = clean.match(/[^.!?]+[.!?]+/g);
    if (sentences && sentences.length > 0) {
      return sentences.slice(0, 2).join(" ").trim();
    }
    return clean.slice(0, 160).trim();
  }
}
