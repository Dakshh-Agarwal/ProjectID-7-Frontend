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
    <div className="flex items-center gap-2 animate-fadeIn flex-wrap justify-end">
      {topic && (
        <div className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
          Topic: {topic}
        </div>
      )}
      {style && (
        <div className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
          Style: {getStyleEmoji(style)} {style.charAt(0).toUpperCase() + style.slice(1)}
        </div>
      )}
    </div>
  );
};

export default TopicIndicator;
