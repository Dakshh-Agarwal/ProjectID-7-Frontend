import { useState, useEffect } from "react";
import ChatWindow from "./components/ChatWindow";
import InputBar from "./components/InputBar";
import "./App.css";

function App() {
  const STORAGE_KEY = "concept_explainer_history";
  const API_URL = process.env.REACT_APP_API_URL || "https://projectid-7-backend.onrender.com/chat";
  
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [currentTopic, setCurrentTopic] = useState(() => {
    const saved = sessionStorage.getItem("current_topic");
    return saved || null;
  });
  const [explanationStyle, setExplanationStyle] = useState(() => {
    const saved = sessionStorage.getItem("explanation_style");
    return saved || null;
  });

  // Save messages to sessionStorage whenever they change
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  // Save topic and style to sessionStorage
  useEffect(() => {
    if (currentTopic) {
      sessionStorage.setItem("current_topic", currentTopic);
    }
  }, [currentTopic]);

  useEffect(() => {
    if (explanationStyle) {
      sessionStorage.setItem("explanation_style", explanationStyle);
    }
  }, [explanationStyle]);

  const addAssistantMessage = (content, type = "explanation") => {
    setMessages((prev) => [...prev, { role: "assistant", content, type }]);
  };

  const sendMessage = async (userInput) => {
    if (!userInput.trim()) return;

    // Add user message
    const userMessage = { role: "user", content: userInput };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_input: userInput,
          conversation_history: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          is_skip: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }

      if (!response.body) {
        const text = await response.text();
        if (text?.trim()) {
          addAssistantMessage(text.trim(), "explanation");
        } else {
          addAssistantMessage("I could not get a response from the server.", "explanation");
        }
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullText += chunk;
        const snapshotText = fullText;

        // Update the last message with accumulated text
        setMessages((prev) => {
          const newMessages = [...prev];
          if (newMessages[newMessages.length - 1]?.role === "assistant") {
            newMessages[newMessages.length - 1].content = snapshotText;
          } else {
            newMessages.push({
              role: "assistant",
              content: snapshotText,
              type: "explanation",
            });
          }
          return newMessages;
        });
      }

      // After stream ends, check for check question marker
      if (fullText.includes("|||CHECK|||")) {
        const parts = fullText.split("|||CHECK|||");
        const explanation = (parts[0] || "").trim();
        const checkQuestion = (parts[1] || "").replace("|||END|||", "").trim();

        setMessages((prev) => {
          const newMessages = [...prev];
          // Replace the last message with just the explanation
          newMessages[newMessages.length - 1] = {
            role: "assistant",
            content: explanation,
            type: "explanation",
          };
          return newMessages;
        });

        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: checkQuestion,
              type: "check_question",
            },
          ]);
          setShowSkip(true);
        }, 500);
      } else {
        setMessages((prev) => {
          const newMessages = [...prev];
          if (newMessages[newMessages.length - 1]?.role === "assistant") {
            newMessages[newMessages.length - 1] = {
              role: "assistant",
              content: fullText.trim(),
              type: "explanation",
            };
          }
          return newMessages;
        });

        if (!fullText.trim()) {
          addAssistantMessage("I did not receive any content from the backend.", "explanation");
        }
      }
    } catch (error) {
      console.error("Error:", error);
      addAssistantMessage(
        `Request failed: ${error?.message || "Unknown error"}. Check backend server and API key.`,
        "evaluation_wrong"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const skipQuestion = async () => {
    setShowSkip(false);
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_input: "",
          conversation_history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          is_skip: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }

      if (!response.body) {
        const text = await response.text();
        addAssistantMessage(text?.trim() || "No response received.", "explanation");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value);
      }

      addAssistantMessage(fullText || "No response received.", "explanation");
    } catch (error) {
      console.error("Error:", error);
      addAssistantMessage(
        `Skip failed: ${error?.message || "Unknown error"}`,
        "evaluation_wrong"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (userInput) => {
    if (showSkip) {
      // Awaiting answer - evaluate student answer
      if (!userInput.trim()) return;

      const userMessage = { role: "user", content: userInput };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_input: userInput,
            conversation_history: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            is_skip: false,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Request failed with status ${response.status}`);
        }

        const fullText = (await response.text()).trim();
        const lower = fullText.toLowerCase();
        const isCorrect = lower.includes("got it") || lower.includes("great job") || lower.includes("correct");
        const isWrong = lower.includes("revisit") || lower.includes("not quite") || !isCorrect;
        const messageType = isWrong ? "evaluation_wrong" : "evaluation_correct";

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: fullText || "No response received.",
            type: messageType,
          },
        ]);

        setShowSkip(false);
      } catch (error) {
        console.error("Error:", error);
        addAssistantMessage(
          `Evaluation failed: ${error?.message || "Unknown error"}`,
          "evaluation_wrong"
        );
      } finally {
        setIsLoading(false);
      }
    } else {
      // Normal message send
      await sendMessage(userInput);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    setCurrentTopic(null);
    setExplanationStyle(null);
    setShowSkip(false);
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem("current_topic");
    sessionStorage.removeItem("explanation_style");
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="header">
        <span className="header-title">🧠 ConceptAI</span>
        <div className="header-right">
          {currentTopic && (
            <>
              <span className="pill">
                {currentTopic}
              </span>
              {explanationStyle && (
                <span className="pill">
                  {explanationStyle}
                </span>
              )}
            </>
          )}
          <button
            onClick={clearHistory}
            className="clear-btn"
          >
            Clear
          </button>
        </div>
      </header>

      {/* Chat Window */}
      <ChatWindow messages={messages} isLoading={isLoading} />

      {/* Input Bar */}
      <div className="app-bottom-spacer" />
      <InputBar
        onSend={handleSend}
        onSkip={skipQuestion}
        isLoading={isLoading}
        showSkip={showSkip}
      />
    </div>
  );
}

export default App;
