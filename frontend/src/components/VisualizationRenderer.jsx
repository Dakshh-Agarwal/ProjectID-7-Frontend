import React, { useState } from 'react';

/**
 * VisualizationRenderer - Display visualizations (React components or diagrams)
 * Props:
 *   - visualization: object - { needed, type, code, message }
 */
const VisualizationRenderer = ({ visualization }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [componentError, setComponentError] = useState(null);

  if (!visualization || !visualization.needed) {
    return null;
  }

  const { type, code, message } = visualization;

  // Render React component visualization
  if (type === 'react_component' && code) {
    return (
      <div className="mt-4 animate-fadeIn">
        <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Visualization</span>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 rounded-full bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {componentError ? (
              <div className="text-slate-500 italic flex items-center gap-2">
                <span>🎨</span>
                <span>Unable to render visualization</span>
              </div>
            ) : (
              <div className={`transition-all duration-300 ${isPlaying ? 'opacity-100' : 'opacity-50'}`}>
                <pre className="bg-white rounded-lg p-4 text-xs font-mono text-gray-700 overflow-x-auto border border-slate-200">
                  {code}
                </pre>
              </div>
            )}
            {message && <p className="text-xs text-slate-600 mt-3 italic">{message}</p>}
          </div>
        </div>
      </div>
    );
  }

  // Render text diagram visualization
  if (type === 'diagram' && code) {
    return (
      <div className="mt-4 animate-fadeIn">
        <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Visualization</span>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 rounded-full bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className={`transition-all duration-300 ${isPlaying ? 'opacity-100' : 'opacity-50'}`}>
              <pre className="bg-white rounded-lg p-4 text-xs font-mono text-gray-700 overflow-x-auto border border-slate-200">
                {code}
              </pre>
            </div>
            {message && <p className="text-xs text-slate-600 mt-3 italic">{message}</p>}
          </div>
        </div>
      </div>
    );
  }

  // No visualization
  if (!type || type === 'none') {
    return null;
  }

  // Error state
  return (
    <div className="mt-4 animate-fadeIn">
      <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="text-slate-500 italic flex items-center gap-2">
          <span>🎨</span>
          <span>{message || 'This concept cannot be visualized'}</span>
        </div>
      </div>
    </div>
  );
};

export default VisualizationRenderer;
