import React from 'react';

/**
 * MessageBubble - Display chat messages with different styles based on role and type
 * Props:
 *   - role: "user" | "assistant"
 *   - content: string - Message content
 *   - type: "explanation" | "check_question" | "evaluation" | "clarification"
 *   - visualization: object | null - Optional visualization data
 */
const MessageBubble = ({ role, content, type = 'explanation', visualization = null }) => {
  const isUser = role === 'user';

  // Determine styling based on message type
  const getTypeStyles = () => {
    switch (type) {
      case 'check_question':
        return {
          bg: 'bg-yellow-50',
          border: 'border-l-4 border-yellow-300',
          label: 'Quick Check 🎯',
          labelColor: 'text-yellow-700',
        };
      case 'evaluation':
        // This will be further determined by correctness
        return {
          bg: 'bg-blue-50',
          border: 'border-l-4 border-blue-300',
          label: 'Evaluation',
          labelColor: 'text-blue-700',
        };
      default:
        return {
          bg: isUser ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' : 'bg-white',
          border: '',
          label: null,
          labelColor: '',
        };
    }
  };

  const typeStyles = getTypeStyles();

  // User message styles
  if (isUser) {
    return (
      <div className="user-row animate-slideRight">
        <div className="user-bubble">
          <p className="text-sm lg:text-base leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    );
  }

  // Assistant message with different type styles
  if (type === 'check_question') {
    return (
      <div className="assistant-row animate-slideLeft">
        <div className="assistant-avatar">AI</div>
        <div className={`assistant-bubble ${typeStyles.bg} ${typeStyles.border}`}>
          <p className={`text-xs font-semibold mb-2 ${typeStyles.labelColor}`}>{typeStyles.label}</p>
          <p className="text-sm lg:text-base text-slate-900 leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    );
  }

  // Regular assistant message
  return (
    <div className="assistant-row animate-slideLeft">
      <div className="assistant-avatar">AI</div>
      <div className="flex-1 min-w-0">
        <div className="assistant-bubble">
          <p className="text-sm lg:text-base text-slate-800 leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
        {visualization && (
          <div className="mt-3">
            {/* Visualization will be rendered by VisualizationRenderer */}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
