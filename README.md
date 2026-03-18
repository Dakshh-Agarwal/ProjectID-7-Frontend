# AI Powered Concept Explainer

An intelligent, AI-powered concept explanation system that helps students understand complex topics through interactive conversations, visualizations, and tailored learning styles.

## Tech Stack

- **Frontend**: ReactJS + Tailwind CSS
- **Backend**: Python FastAPI
- **LLM**: Google Gemini Flash (1.5)
- **Real-time**: Server-Sent Events (SSE) for streaming responses
- **Storage**: sessionStorage for conversation persistence

## Features

- 🎯 **Intent Detection**: Automatically detects learning style (beginner, analogy, step-by-step, example-based, advanced)
- 📚 **Smart Explanations**: Generates clear, accurate explanations tailored to learning preferences
- 🎨 **Visualizations**: Auto-generates React components or ASCII diagrams when helpful
- 💬 **Real-time Streaming**: Conversations stream in real-time for better UX
- ✅ **Understanding Checks**: Generates targeted questions to test comprehension
- 🔄 **Error Correction**: Identifies misconceptions and provides targeted re-explanations

## Project Structure

```
concept-explainer/
├── backend/
│   ├── main.py              # FastAPI server with streaming endpoint
│   ├── prompts.py           # 4 modular prompt functions (intent, explain, check, evaluate)
│   ├── requirements.txt      # Python dependencies
│   ├── .env                 # Environment variables (GEMINI_KEY)
│   └── .env.example         # Example environment file
└── frontend/
    ├── src/
    │   ├── App.jsx          # Main app component
    │   ├── index.css        # Global styles with Tailwind
    │   ├── components/
    │   │   ├── ChatWindow.jsx           # Message display with auto-scroll
    │   │   ├── MessageBubble.jsx        # Individual message styling
    │   │   ├── InputBar.jsx             # Input field with send/skip
    │   │   ├── TopicIndicator.jsx       # Topic & style badges
    │   │   └── VisualizationRenderer.jsx # Render visualizations
    │   ├── hooks/
    │   │   └── useSession.js            # Session state management
    │   └── utils/
    │       └── streamParser.js          # SSE stream parsing
    └── package.json
```

## Setup Instructions

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Add your Gemini API key to .env
# Edit .env and add: GEMINI_KEY=your_actual_key_here

# Run backend server on port 8000
uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run frontend dev server on port 3000
npm start
```

**Backend runs on**: http://localhost:8000  
**Frontend runs on**: http://localhost:3000

## API Endpoints

### POST /chat
Streams concept explanations with real-time responses

**Request**:
```json
{
  "user_input": "Explain recursion",
  "conversation_history": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ],
  "current_topic": "Recursion",
  "explanation_style": "beginner"
}
```

**Response**: Server-Sent Events stream with chunks:
```
data: {"content": "text chunk..."}
data: {"content": "more text..."}
```

### GET /health
Health check endpoint

### GET /state
Get current application state (topic, style)

### POST /state
Update application state

### POST /reset
Reset conversation and state

## Architecture Decisions

### 1. Google Gemini Flash for LLM
- Fast, reliable generations perfect for concept explanations
- Strong at code generation for React visualization components
- Cost-effective streaming responses

### 2. sessionStorage for Persistence
- Fits single-session concept learning workflow
- Fast, client-side storage
- Automatic cleanup when tab closes
- Future: Redis for multi-device persistence

### 3. Single Streaming Endpoint
- `/chat` handles all explanation types
- Modular prompt system on backend
- Intent detection → explanation → checks → evaluation all flow through one endpoint

### 4. Modular Prompt System
Four independent prompt functions in `prompts.py`:
- `intent_detector_prompt()` - Detects clarity & learning style
- `explainer_prompt()` - Explains with optional visualization
- `understanding_check_prompt()` - Creates comprehension questions
- `evaluator_prompt()` - Evaluates answers & provides feedback

### 5. Frontend Renders LLM-Generated Code
- Gemini generates valid React components as strings
- Frontend safely displays (no eval, just JSX rendering)
- Fallback to text diagrams for non-interactive concepts

## Component Breakdown

### Backend (Python FastAPI)
- **main.py**: Server setup, CORS, streaming logic, state management
- **prompts.py**: JSON-returning prompt templates designed for Gemini

### Frontend (React + Tailwind)
- **App.jsx**: Main component with header, chat window, input
- **ChatWindow.jsx**: Scrollable message display with typing indicator
- **MessageBubble.jsx**: Styled messages (user right, assistant left)
- **InputBar.jsx**: Frosted glass input with send/skip buttons
- **TopicIndicator.jsx**: Pill-shaped badges for topic & style
- **VisualizationRenderer.jsx**: Renders React components or diagrams
- **useSession.js**: Custom hook for conversation state & persistence
- **streamParser.js**: Parses SSE stream from backend
- **index.css**: Global styles, animations, Tailwind configuration

## Future Improvements

### Short-term
1. **Redis Backend**: Replace sessionStorage with Redis for multi-device persistence
2. **User Authentication**: Track learning progress per user
3. **Learning History**: Save past conversations and revisit topics

### Medium-term
4. **Multi-language Support**: Backend prompts in multiple languages
5. **Advanced Visualizations**: Interactive D3.js diagrams, animations
6. **Code Sandboxing**: Safely execute generated React components
7. **Mobile Responsive**: Optimize for mobile learning

### Long-term
8. **Spaced Repetition**: Integrate SRS algorithm for better retention
9. **Adaptive Difficulty**: Auto-adjust complexity based on performance
10. **Social Features**: Share explanations, collaborative learning

## Security Considerations

### Environment Variables
```bash
# CRITICAL: Never commit .env file
# Always use .env.example as template
git add .env.example
git ignore .env
```

### LLM-Generated Code Risk ⚠️
The system generates React components from LLM output. Current implementation:
- ✅ Safe: Displays code in `<pre>` tags (no execution)
- ⚠️ Risk: If frontend executes LLM-generated code, sandboxing is required
- 🔒 Recommended for production: Use iframes or Web Workers to isolate execution

### API Security
- CORS restricted to `localhost:3000` in development
- Update for production deployment
- API key stored in environment variables (never hardcoded)

## Development Notes

### Running Both Servers

**Terminal 1 - Backend**:
```bash
cd backend
uvicorn main:app --reload
# Backend at http://localhost:8000
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm start
# Frontend at http://localhost:3000
```

### Debugging

**Backend Logs**: Shows streaming responses, API errors  
**Frontend Console**: Shows stream parsing, component renders  
**Network Tab**: Inspect SSE stream chunks

## Contributing

This is an active learning project. Contributions welcome for:
- Additional prompt improvements
- UI/UX enhancements
- Performance optimizations
- Security hardening

## License

MIT License - feel free to use and modify

---

**Built with 💙 for better concept learning**
