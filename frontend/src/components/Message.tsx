import { Bot, User, Volume2, VolumeX } from "lucide-react";
import type { ChatMessage } from "../api/chatApi";
import TextMessage from "./TextMessage";
import ListMessage from "./ListMessage";

interface MessageProps {
  message: ChatMessage;
  isPlaying?: boolean;
  onPlayTTS?: (text: string, messageId: string) => void;
  onStopTTS?: () => void;
}

export default function Message({
  message,
  isPlaying = false,
  onPlayTTS,
  onStopTTS,
}: MessageProps) {
  const isUser = message.sender === "user";

  const handleAudioToggle = () => {
    if (isPlaying) {
      onStopTTS?.();
    } else {
      const speechText =
        message.text || message.listTitle || "Here are your details";
      onPlayTTS?.(speechText, message.id);
    }
  };

  return (
    <div
      className={`flex w-full gap-3 py-2.5 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div className="flex shrink-0 items-start pt-1">
        {isUser ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs">
            <User className="w-4 h-4" />
          </div>
        ) : (
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
            <Bot className="w-4 h-4" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-zinc-900" />
          </div>
        )}
      </div>

      {/* Message Bubble Block */}
      <div
        className={`flex flex-col min-w-0 max-w-[85%] sm:max-w-[75%] md:max-w-[70%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`flex items-center gap-2 px-1 mb-1 text-[11px] text-zinc-400 font-medium ${
            isUser ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <span>{isUser ? "You" : "Bank AI"}</span>
          <span>•</span>
          <span>{message.timestamp}</span>
        </div>

        <div
          className={`relative rounded-2xl p-3.5 shadow-sm ${
            isUser
              ? "rounded-tr-xs bg-blue-600 text-white"
              : "rounded-tl-xs border border-zinc-700/80 bg-zinc-800/90 text-zinc-100"
          }`}
        >
          {message.type === "text" && (
            <TextMessage text={message.text || ""} isUser={isUser} />
          )}

          {message.type === "list" && (
            <ListMessage
              text={message.text}
              listTitle={message.listTitle}
              listItems={message.listItems}
              isUser={isUser}
            />
          )}
        </div>

        {/* TTS Read Aloud Control for Assistant */}
        {!isUser && onPlayTTS && (
          <div className="mt-1 flex items-center gap-1.5 px-1">
            <button
              onClick={handleAudioToggle}
              title={isPlaying ? "Stop audio" : "Listen via Cartesia TTS"}
              className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] transition-colors ${
                isPlaying
                  ? "bg-emerald-950/80 text-emerald-300 font-medium"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80"
              }`}
            >
              {isPlaying ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                  <span>Speaking...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Listen</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
