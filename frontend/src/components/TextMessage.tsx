interface TextMessageProps {
  text: string;
  isUser: boolean;
}

export default function TextMessage({ text, isUser }: TextMessageProps) {
  return (
    <div
      className={`text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap break-words ${
        isUser ? "text-white" : "text-zinc-100"
      }`}
    >
      {text}
    </div>
  );
}
