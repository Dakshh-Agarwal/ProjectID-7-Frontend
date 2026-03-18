import { useState, useEffect } from "react";
import ChatWindow from "./components/ChatWindow";
import InputBar from "./components/InputBar";
import "./App.css";

function App() {
  const STORAGE_KEY = "concept_explainer_history";
  
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

  const sendMessage = async (userInput) => {
    if (!userInput.trim()) return;

    // Add user message
    const userMessage = { role: "user", content: userInput };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_input: userInput,
          conversation_history: [...messages, userMessage],
          is_skip: false,
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullText += chunk;

        // Update the last message with accumulated text
        setMessages((prev) => {
          const newMessages = [...prev];
          if (newMessages[newMessages.length - 1]?.role === "assistant") {
            newMessages[newMessages.length - 1].content = fullText;
          } else {
            newMessages.push({
              role: "assistant",
              content: fullText,
              type: "explanation",
            });
          }
          return newMessages;
        });
      }

      // After stream ends, check for check question marker
      if (fullText.includes("|||CHECK|||")) {
        const parts = fullText.split("|||CHECK|||");
        const explanation = parts[0].trim();
        const checkPart = parts[1].split("|||END|||")[0].trim();

        setMessages((prev) => {
          const newMessages = [...prev];
          // Replace the last message with just the explanation
          newMessages[newMessages.length - 1] = {
            role: "assistant",
            content: explanation,
            type: "explanation",
          };
          // Add the check question
          newMessages.push({
            role: "assistant",
            content: checkPart,
            type: "check_question",
          });
          return newMessages;
        });

        setShowSkip(true);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const skipQuestion = async () => {
    setShowSkip(false);
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_input: "",
          conversation_history: messages,
          is_skip: true,
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value);
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: fullText, type: "explanation" },
      ]);
    } catch (error) {
      console.error("Error:", error);
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
        const response = await fetch("http://localhost:8000/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_input: userInput,
            conversation_history: [...messages, userMessage],
            is_skip: false,
          }),
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value);
        }

        // Parse the evaluation response
        try {
          const evaluation = JSON.parse(
            fullText.replace(/```json/g, "").replace(/```/g, "").trim()
          );

          const messageType = evaluation.correct
            ? "evaluation_correct"
            : "evaluation_wrong";

          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: fullText, type: messageType },
          ]);
        } catch {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: fullText, type: "explanation" },
          ]);
        }

        setShowSkip(false);
      } catch (error) {
        console.error("Error:", error);
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
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 flex items-center justify-between">
        <span className="text-white font-semibold text-lg">🧠 ConceptAI</span>
        <div className="flex items-center gap-3">
          {currentTopic && (
            <>
              <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">
                {currentTopic}
              </span>
              {explanationStyle && (
                <span className="bg-white/20 text-white text-xs px-3 py-1 rounded-full">
                  {explanationStyle}
                </span>
              )}
            </>
          )}
          <button
            onClick={clearHistory}
            className="text-white/60 hover:text-white text-xs transition-colors"
          >
            Clear
          </button>
        </div>
      </header>

      {/* Chat Window */}
      <ChatWindow messages={messages} isLoading={isLoading} />

      {/* Input Bar */}
      <div className="h-20" />
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
