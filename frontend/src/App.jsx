import React, { useState, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';
import TopicIndicator from './components/TopicIndicator';
import useSession from './hooks/useSession';
import { streamChat } from './utils/streamParser';

/**
 * Main App Component
 * Full-stack concept explainer with streaming responses
 */
function App() {
  const {
    conversationHistory,
    currentTopic,
    explanationStyle,
    isLoading: sessionLoading,
    addMessage,
    setCurrentTopic,
    setExplanationStyle,
    getAPIFormattedHistory,
  } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [currentStreamingContent, setCurrentStreamingContent] = useState('');

  // Handle message send
  const handleSendMessage = async (userInput) => {
    if (!userInput.trim()) return;

    // Add user message to history
    addMessage('user', userInput, 'explanation', null);

    // Start loading
    setIsLoading(true);
    setCurrentStreamingContent('');
    setShowSkip(true);

    try {
      // Get formatted history for API call
      const historyForAPI = getAPIFormattedHistory();

      // Stream response from backend
      await streamChat({
        userInput,
        history: historyForAPI,
        currentTopic,
        explanationStyle,
        onChunk: (chunk) => {
          setCurrentStreamingContent((prev) => prev + chunk);
        },
        onDone: (fullResponse) => {
          // Add assistant message to history
          addMessage('assistant', fullResponse, 'explanation', null);
          setCurrentStreamingContent('');
          setIsLoading(false);
          setShowSkip(false);
        },
        onError: (error) => {
          console.error('Stream error:', error);
          addMessage(
            'assistant',
            `Sorry, I encountered an error: ${error}. Please try again.`,
            'explanation',
            null
          );
          setIsLoading(false);
          setShowSkip(false);
        },
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      setShowSkip(false);
    }
  };

  // Handle skip
  const handleSkip = () => {
    setIsLoading(false);
    setCurrentStreamingContent('');
    setShowSkip(false);
  };

  // Display messages with current streaming content
  const displayMessages = [
    ...conversationHistory,
    ...(currentStreamingContent
      ? [
          {
            role: 'assistant',
            content: currentStreamingContent,
            type: 'explanation',
            visualization: null,
          },
        ]
      : []),
  ];

  return (
    <div className="h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col max-w-4xl mx-auto">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md transition-all duration-300">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🧠</span>
              <h1 className="text-2xl font-bold">ConceptAI</h1>
            </div>
          </div>

          {/* Topic and Style Indicators */}
          <TopicIndicator topic={currentTopic} style={explanationStyle} />
        </div>
      </header>

      {/* Chat Window */}
      <ChatWindow messages={displayMessages} isLoading={isLoading} />

      {/* Input Bar */}
      <InputBar
        onSend={handleSendMessage}
        onSkip={handleSkip}
        isLoading={isLoading}
        showSkip={showSkip}
      />
    </div>
  );
}

export default App;
