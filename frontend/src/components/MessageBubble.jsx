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
      <div className="flex justify-end mb-4 animate-slideRight">
        <div
          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl rounded-br-sm text-white shadow-md transition-all duration-300 ${typeStyles.bg}`}
        >
          <p className="text-sm lg:text-base leading-relaxed">{content}</p>
        </div>
      </div>
    );
  }

  // Assistant message with different type styles
  if (type === 'check_question') {
    return (
      <div className="flex gap-3 mb-4 animate-slideLeft">
        <div className="flex-shrink-0 text-2xl">🧠</div>
        <div className={`flex-1 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm transition-all duration-300 ${typeStyles.bg} ${typeStyles.border}`}>
          <p className={`text-xs font-semibold mb-2 ${typeStyles.labelColor}`}>{typeStyles.label}</p>
          <p className="text-sm lg:text-base text-gray-900 leading-relaxed">{content}</p>
        </div>
      </div>
    );
  }

  // Regular assistant message
  return (
    <div className="flex gap-3 mb-4 animate-slideLeft">
      <div className="flex-shrink-0 text-2xl">🧠</div>
      <div className="flex-1">
        <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white shadow-sm transition-all duration-300 hover:shadow-md">
          <p className="text-sm lg:text-base text-gray-800 leading-relaxed">{content}</p>
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
