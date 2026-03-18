import React from 'react';

/**
 * TopicIndicator - Display current topic and explanation style as badges
 * Props: 
 *   - topic: string - Current topic (e.g., "Recursion")
 *   - style: string - Explanation style (e.g., "Beginner")
 */
const TopicIndicator = ({ topic, style }) => {
  if (!topic && !style) {
    return null;
  }

  const getStyleEmoji = (s) => {
    const emojiMap = {
      beginner: '🎯',
      analogy: '💡',
      'step-by-step': '📝',
      'example-based': '📚',
      advanced: '🚀',
    };
    return emojiMap[s] || '✨';
  };

  return (
    <div className="flex justify-center gap-3 py-4 animate-fadeIn">
      {topic && (
        <div className="px-4 py-2 rounded-full bg-indigo-500 text-white text-sm font-medium shadow-sm transition-all duration-300 hover:shadow-md">
          📚 {topic}
        </div>
      )}
      {style && (
        <div className="px-4 py-2 rounded-full bg-indigo-500 text-white text-sm font-medium shadow-sm transition-all duration-300 hover:shadow-md">
          {getStyleEmoji(style)} {style.charAt(0).toUpperCase() + style.slice(1)}
        </div>
      )}
    </div>
  );
};

export default TopicIndicator;
