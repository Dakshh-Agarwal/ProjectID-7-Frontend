import { useState } from "react";

export default function InputBar({ onSend, onSkip, isLoading, showSkip }) {
  const [text, setText] = useState("");

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isLoading && text.trim()) {
      onSend(text);
      setText("");
    }
  };

  const handleSend = () => {
    if (text.trim() && !isLoading) {
      onSend(text);
      setText("");
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-100 px-4 py-3">
      <div className="flex items-center gap-2 max-w-3xl mx-auto">
        <input
          type="text"
          placeholder="Ask me anything..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:bg-gray-50"
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="flex gap-1">
            <span className="dot text-2xl text-indigo-600">•</span>
            <span className="dot text-2xl text-indigo-600">•</span>
            <span className="dot text-2xl text-indigo-600">•</span>
          </div>
        ) : (
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-4 py-2 text-sm transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        )}

        {showSkip && !isLoading && (
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-gray-600 text-sm transition-all duration-300"
          >
            Skip →
          </button>
        )}
      </div>
    </div>
  );
}
