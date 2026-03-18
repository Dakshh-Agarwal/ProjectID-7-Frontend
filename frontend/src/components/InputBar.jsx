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
    <div className="composer-shell">
      <div className="composer-inner">
        <div className="composer-wrap">
          {/* Input field */}
          <div className="flex-1 relative min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message ConceptAI"
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 outline-none transition-all duration-200 bg-white text-slate-900 placeholder-slate-500 disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300 transition-all duration-200 active:scale-95 disabled:cursor-not-allowed"
            title="Send message (Enter)"
          >
            {isLoading ? (
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-white animate-bounceDot" style={{ animationDelay: '0ms' }}>
                </span>
                <span className="w-2 h-2 rounded-full bg-white animate-bounceDot" style={{ animationDelay: '150ms' }}>
                </span>
                <span className="w-2 h-2 rounded-full bg-white animate-bounceDot" style={{ animationDelay: '300ms' }}>
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
              className="px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
