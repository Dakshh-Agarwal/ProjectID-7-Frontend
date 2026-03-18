import React, { useState, useRef, useEffect } from 'react';

/**
 * InputBar - Chat input with send and skip buttons
 * Props:
 *   - onSend: (message) => void - Callback when message is sent
 *   - onSkip: () => void - Callback when skip is clicked
 *   - isLoading: boolean - Shows loading state
 *   - showSkip: boolean - Show skip button
 */
const InputBar = ({ onSend, onSkip, isLoading = false, showSkip = false }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
      // Re-focus input after sending
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 backdrop-blur-sm bg-white/80 border-t border-slate-200 transition-all duration-300">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          {/* Input field */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about this concept..."
              disabled={isLoading}
              className="w-full px-5 py-3 rounded-full shadow-sm border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 outline-none transition-all duration-300 bg-white text-gray-900 placeholder-gray-500 disabled:bg-slate-100 disabled:text-gray-500"
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-full bg-indigo-500 text-white hover:bg-indigo-600 disabled:bg-slate-300 transition-all duration-300 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-sm"
            title="Send message (Enter)"
          >
            {isLoading ? (
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }}>
                </span>
                <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }}>
                </span>
                <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }}>
                </span>
              </div>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7m0 0l-7 7m7-7H6"
                />
              </svg>
            )}
          </button>

          {/* Skip button */}
          {showSkip && (
            <button
              onClick={onSkip}
              disabled={isLoading}
              className="px-4 py-3 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed animate-fadeIn"
              title="Skip to next question"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InputBar;
