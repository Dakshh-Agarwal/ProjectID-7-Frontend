import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

/**
 * ChatWindow - Display conversation messages with auto-scroll
 * Props:
 *   - messages: array - Conversation messages
 *   - isLoading: boolean - Show typing indicator
 */
const ChatWindow = ({ messages = [], isLoading = false }) => {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Empty state
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-7xl mb-6 animate-fadeIn">🧠</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            What would you like to understand today?
          </h2>
          <p className="text-lg text-gray-500">
            Ask anything — I'll explain it clearly
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-thin scrollbar-thumb-indigo-400 scrollbar-track-slate-100">
      {/* Messages */}
      {messages.map((msg, idx) => (
        <MessageBubble
          key={idx}
          role={msg.role}
          content={msg.content}
          type={msg.type || 'explanation'}
          visualization={msg.visualization || null}
        />
      ))}

      {/* Typing indicator */}
      {isLoading && (
        <div className="flex gap-3 mb-4">
          <div className="flex-shrink-0 text-2xl">🧠</div>
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-bl-sm bg-white shadow-sm">
            <span
              className="w-2 h-2 rounded-full bg-indigo-500 animate-bounceDot"
              style={{ animationDelay: '0ms' }}
            ></span>
            <span
              className="w-2 h-2 rounded-full bg-indigo-500 animate-bounceDot"
              style={{ animationDelay: '150ms' }}
            ></span>
            <span
              className="w-2 h-2 rounded-full bg-indigo-500 animate-bounceDot"
              style={{ animationDelay: '300ms' }}
            ></span>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatWindow;
