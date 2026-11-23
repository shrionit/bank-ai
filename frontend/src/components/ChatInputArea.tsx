import { useRef, useEffect } from "react";
import { Mic, MicOff, Send } from "lucide-react";
import AudioVisualizer from "./AudioVisualizer";

interface ChatInputAreaProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  isListening: boolean;
  isSpeaking: boolean;
  isPlaying?: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  analyser: AnalyserNode | null;
  disabled?: boolean;
}

export default function ChatInputArea({
  input,
  setInput,
  onSend,
  isListening,
  isSpeaking,
  isPlaying = false,
  onStartListening,
  onStopListening,
  analyser,
  disabled = false,
}: ChatInputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        onSend();
      }
    }
  };

  const handleToggleListening = () => {
    if (isListening) {
      onStopListening();
    } else {
      onStartListening();
    }
  };

  return (
    <div className="w-full bg-[#1f1f1f] border-t border-zinc-800 p-3 md:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-xl border border-zinc-700 bg-zinc-900/95 p-3 shadow-md focus-within:border-blue-500">
          {/* Row 1: Textarea Input */}
          <div className="w-full">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={
                isListening
                  ? "Listening to voice... Speak now"
                  : "Type a message or press the microphone to talk..."
              }
              className="w-full resize-none bg-transparent px-2 py-1 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden disabled:opacity-50"
            />
          </div>

          {/* Row 2: Audio Visualizer with Listening Button on the Right */}
          <div className="mt-2 flex items-center justify-between border-t border-zinc-800/90 pt-2.5 gap-3">
            {/* Visualizer & Status */}
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-800 text-[11px] font-medium shrink-0">
                {isListening ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                    <span className="text-rose-400">
                      {isSpeaking ? "Voice detected" : "Listening..."}
                    </span>
                  </>
                ) : isPlaying ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400">Speaking...</span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                    <span className="text-zinc-400">Audio Ready</span>
                  </>
                )}
              </div>

              {/* Audio Visualizer Canvas */}
              <div className="hidden sm:block">
                <AudioVisualizer
                  analyser={analyser}
                  width={180}
                  height={28}
                  barCount={24}
                  className={
                    isListening
                      ? "text-rose-400"
                      : isPlaying
                      ? "text-emerald-400"
                      : "text-zinc-600"
                  }
                />
              </div>
            </div>

            {/* Button to start or stop listening on the right, plus send button */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleToggleListening}
                title={isListening ? "Stop listening" : "Start listening"}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isListening
                    ? "bg-rose-600 text-white hover:bg-rose-700 animate-pulse ring-2 ring-rose-500/40"
                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-blue-400" />
                    <span>Speak</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onSend}
                disabled={!input.trim() || disabled}
                title="Send message"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white transition-all hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
