import React, { useState, useEffect } from 'react';

/**
 * VisualizationRenderer - Display visualizations (React components or diagrams)
 * With proper error boundaries and fallback rendering
 * Props:
 *   - visualization: object - { needed, type, code, message }
 */
const VisualizationRenderer = ({ visualization }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [componentError, setComponentError] = useState(null);

  // Reset error state when visualization changes
  useEffect(() => {
    setComponentError(null);
  }, [visualization]);

  if (!visualization || !visualization.needed) {
    return null;
  }

  const { type, code, message } = visualization;

  // Safe renderer wrapper
  const renderVisualizationCode = (codeStr) => {
    try {
      if (!codeStr) {
        throw new Error('No code provided');
      }
      
      return (
        <pre className="bg-white rounded-lg p-4 text-xs font-mono text-gray-700 overflow-x-auto border border-slate-200">
          {codeStr}
        </pre>
      );
    } catch (error) {
      setComponentError(error.message);
      return (
        <div className="text-slate-500 italic flex items-center gap-2">
          <span>🎨</span>
          <span>Unable to render visualization</span>
        </div>
      );
    }
  };

  // Render React component visualization
  if (type === 'react_component' && code) {
    return (
      <div className="mt-4 animate-fadeIn">
        <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">React Component</span>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 rounded-full bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600 transition-all duration-300 hover:scale-105 active:scale-95"
              title={isPlaying ? 'Pause visualization' : 'Resume visualization'}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {componentError ? (
              <div className="text-slate-500 italic flex items-center gap-2">
                <span>⚠️</span>
                <span>{componentError || 'Unable to render visualization'}</span>
              </div>
            ) : (
              <div className={`transition-all duration-300 ${isPlaying ? 'opacity-100' : 'opacity-50'}`}>
                {renderVisualizationCode(code)}
              </div>
            )}
            {message && !componentError && (
              <p className="text-xs text-slate-600 mt-3 italic">💡 {message}</p>
            )}
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
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Diagram</span>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 rounded-full bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600 transition-all duration-300 hover:scale-105 active:scale-95"
              title={isPlaying ? 'Pause visualization' : 'Resume visualization'}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {componentError ? (
              <div className="text-slate-500 italic flex items-center gap-2">
                <span>⚠️</span>
                <span>{componentError || 'Unable to render diagram'}</span>
              </div>
            ) : (
              <div className={`transition-all duration-300 ${isPlaying ? 'opacity-100' : 'opacity-50'}`}>
                {renderVisualizationCode(code)}
              </div>
            )}
            {message && !componentError && (
              <p className="text-xs text-slate-600 mt-3 italic">💡 {message}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // No visualization
  if (!type || type === 'none') {
    return null;
  }

  // Error state for unknown type
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
