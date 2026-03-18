import React, { useState } from 'react';
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
    addMessage,
    getAPIFormattedHistory,
    setCurrentTopic,
    setExplanationStyle,
  } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [currentStreamingContent, setCurrentStreamingContent] = useState('');

  const extractTopicFromInput = (input) => {
    const raw = (input || '').trim().toLowerCase();
    if (!raw) return null;

    const greetings = new Set(['hi', 'hello', 'hey', 'yo', 'hii', 'heyy']);
    if (greetings.has(raw)) return null;

    let text = raw;
    const prefixes = ['explain me', 'explain', 'tell me about', 'what is', 'describe', 'teach me'];
    for (const prefix of prefixes) {
      if (text.startsWith(prefix)) {
        text = text.slice(prefix.length).trim();
        break;
      }
    }

    const stopWords = new Set(['me', 'please', 'about', 'the', 'a', 'an']);
    const cleaned = text
      .split(' ')
      .filter(Boolean)
      .filter((word) => !stopWords.has(word))
      .join(' ')
      .trim();

    if (!cleaned || greetings.has(cleaned)) return null;
    return cleaned;
  };

  // Handle message send
  const handleSendMessage = async (userInput) => {
    if (!userInput.trim()) return;

    // Add user message to history
    addMessage('user', userInput, 'explanation', null);

    const detectedTopic = extractTopicFromInput(userInput);
    if (detectedTopic) {
      setCurrentTopic(detectedTopic);
    }

    // Start loading
    setIsLoading(true);
    setCurrentStreamingContent('');

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
          // Try to parse response as JSON (from intent detector)
          let messageType = 'explanation';
          let displayContent = fullResponse;
          
          try {
            const parsed = JSON.parse(fullResponse);
            
            // If this looks like intent detector response
            if (parsed.style !== undefined) {
              messageType = 'intent_detection';
              // Extract detected style and set it
              if (parsed.style && parsed.style !== 'null') {
                setExplanationStyle(parsed.style);
              }
              // Show user-friendly message instead of raw JSON
              displayContent = parsed.clarifying_question || 
                              `I'll explain this in a ${parsed.style} style. What would you like to learn about?`;
            }
            // If this looks like explainer response
            else if (parsed.explanation !== undefined) {
              messageType = 'explanation';
              displayContent = parsed.explanation;
            }
            // If this looks like check question response
            else if (parsed.question !== undefined) {
              messageType = 'check_question';
              setShowSkip(true);
              displayContent = parsed.question;
            }
            // If this looks like evaluator response
            else if (parsed.correct !== undefined) {
              messageType = 'evaluation';
              setShowSkip(false);
              displayContent = parsed.correct 
                ? "Great! You understood correctly!" 
                : (parsed.re_explanation || "Let me clarify that for you.");
            }
          } catch {
            // If not JSON, check content for message type
            if (fullResponse.toLowerCase().includes('question') && 
                fullResponse.toLowerCase().includes('correct') === false) {
              messageType = 'check_question';
              setShowSkip(true);
            } else if (fullResponse.toLowerCase().includes('correct') || 
                       fullResponse.toLowerCase().includes('misconception')) {
              messageType = 'evaluation';
              setShowSkip(false);
            } else {
              setShowSkip(false);
            }
            displayContent = fullResponse;
          }
          
          // Add assistant message to history
          addMessage('assistant', displayContent, messageType, null);
          setCurrentStreamingContent('');
          setIsLoading(false);
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
    <div className="h-screen bg-app text-slate-900 flex flex-col">
      <header className="app-topbar">
        <div className="app-topbar-inner">
          <div className="app-brand">
            <span className="app-brand-dot" aria-hidden="true"></span>
            <h1 className="app-title">ConceptAI</h1>
          </div>
          <TopicIndicator topic={currentTopic} style={explanationStyle} />
        </div>
      </header>

      <main className="app-main">
        <ChatWindow messages={displayMessages} isLoading={isLoading} />
      </main>

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
