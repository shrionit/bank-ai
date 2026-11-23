import type { ListItem } from "../api/chatApi";

interface ListMessageProps {
  text?: string;
  listTitle?: string;
  listItems?: ListItem[];
  isUser: boolean;
}

export default function ListMessage({
  text,
  listTitle,
  listItems,
  isUser,
}: ListMessageProps) {
  return (
    <div className="space-y-2.5">
      {text && (
        <p
          className={`text-sm md:text-[15px] leading-relaxed ${
            isUser ? "text-white" : "text-zinc-100"
          }`}
        >
          {text}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-900/90 shadow-xs">
        {listTitle && (
          <div className="border-b border-zinc-800 bg-zinc-800/60 px-3.5 py-2.5">
            <h4 className="text-sm font-semibold text-zinc-100">
              {listTitle}
            </h4>
          </div>
        )}

        <div className="divide-y divide-zinc-800/80">
          {listItems?.map((item, index) => {
            return (
              <div
                key={`${item.title}-${index}`}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-zinc-800/40 transition-colors"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-100">
                    {item.title}
                  </p>
                </div>
                <span className="max-w-[55%] text-right text-sm font-semibold text-zinc-100 break-words">
                  {item.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
