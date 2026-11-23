import { Landmark, RotateCcw } from "lucide-react";

interface ChatHeaderProps {
  onReset: () => void;
}

export default function ChatHeader({ onReset }: ChatHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800 bg-[#252525] px-4 md:px-6">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Landmark className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-sm md:text-base font-semibold leading-tight m-0 text-zinc-100">
            Bank AI Chat
          </h1>
          <p className="text-[11px] text-zinc-400 m-0">
            Cartesia Voice STT & TTS Enabled
          </p>
        </div>
      </div>

      <button
        onClick={onReset}
        title="Reset chat to dummy history"
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-700/80 transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Reset History</span>
      </button>
    </header>
  );
}
