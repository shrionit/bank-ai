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
  listItems?: ListItem[];
  listTitle?: string;
}
