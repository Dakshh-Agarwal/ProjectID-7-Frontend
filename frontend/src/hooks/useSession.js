import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'concept_explainer_history';

/**
 * Custom React hook for managing session state and conversation history
 * Uses sessionStorage to persist conversation data during the session
 */
export const useSession = () => {
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [explanationStyle, setExplanationStyle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize state from sessionStorage on mount
  useEffect(() => {
    const loadSessionData = () => {
      try {
        const storedHistory = sessionStorage.getItem(STORAGE_KEY);
        const storedTopic = sessionStorage.getItem('concept_explainer_topic');
        const storedStyle = sessionStorage.getItem('concept_explainer_style');

        if (storedHistory) {
          setConversationHistory(JSON.parse(storedHistory));
        }
        if (storedTopic) {
          setCurrentTopic(storedTopic);
        }
        if (storedStyle) {
          setExplanationStyle(storedStyle);
        }
      } catch (error) {
        console.error('Error loading session data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessionData();
  }, []);

  /**
   * Add a message to the conversation history
   * @param {string} role - "user" or "assistant"
   * @param {string} content - The message content
   * @param {string} type - Message type: "explanation", "check_question", "evaluation", "clarification"
   * @param {object|null} visualization - Optional visualization object
   */
  const addMessage = useCallback((role, content, type = 'explanation', visualization = null) => {
    const newMessage = {
      role,
      content,
      type,
      visualization,
      timestamp: new Date().toISOString(),
    };

    setConversationHistory((prevHistory) => {
      const updatedHistory = [...prevHistory, newMessage];
      // Persist to sessionStorage
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
      } catch (error) {
        console.error('Error saving conversation history:', error);
      }
      return updatedHistory;
    });
  }, []);

  /**
   * Clear all conversation history from sessionStorage
   */
  const clearHistory = useCallback(() => {
    setConversationHistory([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing conversation history:', error);
    }
  }, []);

  /**
   * Update the current topic and persist to sessionStorage
   * @param {string} topic - The new topic
   */
  const updateCurrentTopic = useCallback((topic) => {
    setCurrentTopic(topic);
    try {
      if (topic) {
        sessionStorage.setItem('concept_explainer_topic', topic);
      } else {
        sessionStorage.removeItem('concept_explainer_topic');
      }
    } catch (error) {
      console.error('Error saving current topic:', error);
    }
  }, []);

  /**
   * Update the explanation style and persist to sessionStorage
   * @param {string} style - The new style (beginner, analogy, step-by-step, example-based, advanced)
   */
  const updateExplanationStyle = useCallback((style) => {
    setExplanationStyle(style);
    try {
      if (style) {
        sessionStorage.setItem('concept_explainer_style', style);
      } else {
        sessionStorage.removeItem('concept_explainer_style');
      }
    } catch (error) {
      console.error('Error saving explanation style:', error);
    }
  }, []);

  /**
   * Reset session to initial state
   */
  const resetSession = useCallback(() => {
    clearHistory();
    updateCurrentTopic(null);
    updateExplanationStyle(null);
  }, [clearHistory, updateCurrentTopic, updateExplanationStyle]);

  /**
   * Get the last message from conversation history
   */
  const getLastMessage = useCallback(() => {
    return conversationHistory.length > 0 ? conversationHistory[conversationHistory.length - 1] : null;
  }, [conversationHistory]);

  /**
   * Get conversation history in format suitable for API calls
   * Filters out visualization data, keeps only role and content
   */
  const getAPIFormattedHistory = useCallback(() => {
    return conversationHistory.map(({ role, content }) => ({
      role,
      content,
    }));
  }, [conversationHistory]);

  return {
    // State
    conversationHistory,
    currentTopic,
    explanationStyle,
    isLoading,

    // History management
    addMessage,
    clearHistory,
    getLastMessage,
    getAPIFormattedHistory,

    // Topic management
    setCurrentTopic: updateCurrentTopic,

    // Style management
    setExplanationStyle: updateExplanationStyle,

    // Session management
    resetSession,
  };
};

export default useSession;
