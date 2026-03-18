/**
 * Stream parser utility for handling Server-Sent Events (SSE) from the backend
 * Handles real-time concept explanation streaming
 */

/**
 * Sends a chat request to the backend and streams the response
 * @param {Object} options - Options object
 * @param {string} options.userInput - The user's input/question
 * @param {Array} options.history - Conversation history (role, content pairs)
 * @param {string|null} options.currentTopic - Current topic being discussed
 * @param {string|null} options.explanationStyle - Preferred explanation style
 * @param {Function} options.onChunk - Callback for each text chunk received
 * @param {Function} options.onDone - Callback when stream completes with full response
 * @param {Function} [options.onError] - Optional error callback
 * @returns {Promise<string>} - Full response text when complete
 */
export async function streamChat({
  userInput,
  history = [],
  currentTopic = null,
  explanationStyle = null,
  onChunk,
  onDone,
  onError = null,
}) {
  try {
    // Validate required parameters
    if (!userInput) {
      throw new Error('User input is required');
    }

    if (typeof onChunk !== 'function') {
      throw new Error('onChunk callback must be a function');
    }

    if (typeof onDone !== 'function') {
      throw new Error('onDone callback must be a function');
    }

    // Build request payload
    const payload = {
      user_input: userInput,
      conversation_history: history,
      current_topic: currentTopic,
      explanation_style: explanationStyle,
    };

    // Send POST request to backend
    const response = await fetch('http://localhost:8000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Check if response is ok
    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `HTTP ${response.status}: ${response.statusText}`
        );
      } catch (parseError) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    // Get the response body as a reader
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let buffer = '';

    // Read stream in chunks
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // Stream complete - process any remaining buffer
        if (buffer.trim()) {
          const chunk = parseSSEChunk(buffer);
          if (chunk) {
            fullResponse += chunk.content || '';
          }
        }
        break;
      }

      // Decode chunk and add to buffer
      const text = decoder.decode(value, { stream: true });
      buffer += text;

      // Process complete SSE messages in buffer
      const lines = buffer.split('\n');

      // Keep the last potentially incomplete line in buffer
      buffer = lines[lines.length - 1];

      // Process all complete lines
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];

        if (line.startsWith('data: ')) {
          const chunk = parseSSEChunk(line);

          if (chunk) {
            // Check for errors
            if (chunk.error) {
              throw new Error(chunk.error);
            }

            // Accumulate response
            if (chunk.content) {
              fullResponse += chunk.content;
              // Call onChunk callback for real-time display
              onChunk(chunk.content);
            }
          }
        }
      }
    }

    // Call onDone with complete response
    onDone(fullResponse);

    return fullResponse;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Call error callback if provided
    if (typeof onError === 'function') {
      onError(errorMessage);
    } else {
      console.error('Stream chat error:', errorMessage);
    }

    throw error;
  }
}

/**
 * Parse a Server-Sent Events (SSE) line
 * Format: data: {json}
 * @param {string} line - SSE formatted line
 * @returns {Object|null} - Parsed data object or null if invalid
 */
function parseSSEChunk(line) {
  try {
    if (!line.startsWith('data: ')) {
      return null;
    }

    const jsonStr = line.slice(6); // Remove 'data: ' prefix
    const data = JSON.parse(jsonStr);

    return data;
  } catch (error) {
    console.error('Error parsing SSE chunk:', error);
    return null;
  }
}

/**
 * Alternative function for handling streaming with AbortController
 * Allows cancellation of ongoing requests
 * @param {Object} options - Same as streamChat
 * @param {AbortSignal} [options.signal] - Optional abort signal for cancellation
 * @returns {Promise<string>} - Full response text when complete
 */
export async function streamChatWithCancel({
  userInput,
  history = [],
  currentTopic = null,
  explanationStyle = null,
  onChunk,
  onDone,
  onError = null,
  signal = null,
}) {
  try {
    // Validate required parameters
    if (!userInput) {
      throw new Error('User input is required');
    }

    if (typeof onChunk !== 'function') {
      throw new Error('onChunk callback must be a function');
    }

    if (typeof onDone !== 'function') {
      throw new Error('onDone callback must be a function');
    }

    // Build request payload
    const payload = {
      user_input: userInput,
      conversation_history: history,
      current_topic: currentTopic,
      explanation_style: explanationStyle,
    };

    // Send POST request with optional abort signal
    const response = await fetch('http://localhost:8000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        if (buffer.trim()) {
          const chunk = parseSSEChunk(buffer);
          if (chunk) {
            fullResponse += chunk.content || '';
          }
        }
        break;
      }

      const text = decoder.decode(value, { stream: true });
      buffer += text;

      const lines = buffer.split('\n');
      buffer = lines[lines.length - 1];

      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];

        if (line.startsWith('data: ')) {
          const chunk = parseSSEChunk(line);

          if (chunk) {
            if (chunk.error) {
              throw new Error(chunk.error);
            }

            if (chunk.content) {
              fullResponse += chunk.content;
              onChunk(chunk.content);
            }
          }
        }
      }
    }

    onDone(fullResponse);
    return fullResponse;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      if (typeof onError === 'function') {
        onError('Stream was cancelled');
      }
    } else {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (typeof onError === 'function') {
        onError(errorMessage);
      } else {
        console.error('Stream chat error:', errorMessage);
      }
    }

    throw error;
  }
}

export default streamChat;
