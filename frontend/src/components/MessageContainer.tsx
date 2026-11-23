import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import type { ChatMessage } from "../api/chatApi";
import Message from "./Message";

interface MessageContainerProps {
  messages: ChatMessage[];
  playingId?: string | null;
  onPlayTTS?: (text: string, messageId: string) => void;
  onStopTTS?: () => void;
  isProcessing?: boolean;
}

export default function MessageContainer({
  messages,
  playingId,
  onPlayTTS,
  onStopTTS,
  isProcessing = false,
}: MessageContainerProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isProcessing]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
      <div className="mx-auto max-w-3xl space-y-3">
        {messages.map((msg) => (
          <Message
            key={msg.id}
            message={msg}
            isPlaying={playingId === msg.id}
            onPlayTTS={onPlayTTS}
            onStopTTS={onStopTTS}
          />
        ))}

        {isProcessing && (
          <div className="flex items-center gap-2 py-2 text-xs text-blue-400 animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Processing your request...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
