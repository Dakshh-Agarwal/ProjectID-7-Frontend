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
        <div className="text-center max-w-xl">
          <div className="text-5xl mb-5 animate-fadeIn">🧠</div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">
            Ask me any concept
          </h2>
          <p className="text-base text-slate-500">
            I can explain with examples, steps, and visual representations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-scroll-area scrollbar-thin">
      <div className="chat-scroll-inner space-y-4">
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
        <div className="assistant-row">
          <div className="assistant-avatar">AI</div>
          <div className="assistant-bubble inline-flex items-center gap-2 px-4 py-3">
            <span
              className="w-2 h-2 rounded-full bg-slate-500 animate-bounceDot"
              style={{ animationDelay: '0ms' }}
            ></span>
            <span
              className="w-2 h-2 rounded-full bg-slate-500 animate-bounceDot"
              style={{ animationDelay: '150ms' }}
            ></span>
            <span
              className="w-2 h-2 rounded-full bg-slate-500 animate-bounceDot"
              style={{ animationDelay: '300ms' }}
            ></span>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;
