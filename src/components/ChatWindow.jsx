import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

export default function ChatWindow({ messages, isLoading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4 max-w-3xl mx-auto w-full">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-6xl mb-4">🧠</div>
          <h2 className="text-xl font-semibold text-gray-700">
            What would you like to understand today?
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Ask anything — I will explain it clearly
          </p>
        </div>
      ) : (
        <>
          {messages.map((msg, idx) => (
            <MessageBubble
              key={idx}
              role={msg.role}
              content={msg.content}
              type={msg.type}
            />
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-1 slide-left">
                <span className="dot text-2xl text-indigo-600">•</span>
                <span className="dot text-2xl text-indigo-600">•</span>
                <span className="dot text-2xl text-indigo-600">•</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </>
      )}
    </div>
  );
}
