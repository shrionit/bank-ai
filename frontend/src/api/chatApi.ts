export type MessageType = "text" | "list";
export type MessageSender = "user" | "assistant";

export interface ListItem {
  title: string;
  desc: string;
}

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  type: MessageType;
  text: string;
  timestamp: string;
  listTitle?: string;
  listItems?: ListItem[];
}

export interface ChatApiTextDetails {
  type: "text";
  text: string;
}

export interface ChatApiListDetails {
  type: "list";
  title: string;
  items: ListItem[];
}

export interface ChatApiResponse {
  uniq_id: string;
  sessionId: string;
  speech: string;
  details: ChatApiTextDetails | ChatApiListDetails;
}

export interface ChatApiSendResult {
  message: ChatMessage;
  sessionId: string;
}

const INITIAL_DUMMY_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    sender: "assistant",
    type: "text",
    text: "Hello! Welcome to Bank AI. I'm your intelligent financial assistant for DBS Bank Singapore.",
    timestamp: "10:00 AM",
  },
];

function formatTimestamp(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeResponse(payload: ChatApiResponse): ChatMessage {
  const text =
    payload.details?.type === "text"
      ? payload.details.text
      : payload.speech;

  if (payload.details?.type === "list") {
    return {
      id: crypto.randomUUID(),
      sender: "assistant",
      type: "list",
      text: payload.speech,
      listTitle: payload.details.title,
      listItems: payload.details.items.map((item) => ({
        title: item.title,
        desc: item.desc,
      })),
      timestamp: formatTimestamp(),
    };
  }

  return {
    id: crypto.randomUUID(),
    sender: "assistant",
    type: "text",
    text: text || payload.speech || "",
    timestamp: formatTimestamp(),
  };
}

export const chatApi = {
  async getInitialHistory(): Promise<ChatMessage[]> {
    return [...INITIAL_DUMMY_MESSAGES];
  },

  async sendMessage(
    messageText: string,
    sessionId?: string
  ): Promise<ChatApiSendResult> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (sessionId) {
      headers["x-session-id"] = sessionId;
    }

    const response = await fetch("/api/chat", {
      method: "POST",
      headers,
      body: JSON.stringify({ text: messageText }),
    });

    if (!response.ok) {
      throw new Error(`Chat API request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as ChatApiResponse;

    if (!payload.sessionId) {
      throw new Error("Chat API response did not include a sessionId");
    }

    return {
      message: normalizeResponse(payload),
      sessionId: payload.sessionId,
    };
  },
};
