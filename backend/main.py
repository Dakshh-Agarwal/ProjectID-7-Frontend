import os
import json
from typing import Optional, List, Dict
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai
from prompts import (
    get_system_prompt,
    intent_detector_prompt,
    explainer_prompt,
    understanding_check_prompt,
    evaluator_prompt
)

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="AI Concept Explainer", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Google Gemini API
api_key = os.getenv("GEMINI_KEY")
if not api_key:
    raise ValueError("GEMINI_KEY environment variable is not set")

genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-1.5-flash")

# In-memory state store
state_store = {
    "current_topic": None,
    "explanation_style": None,
}

# Pydantic models
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    user_input: str
    conversation_history: List[Message]
    current_topic: Optional[str] = None
    explanation_style: Optional[str] = None

# Helper function to determine which prompt to use
def determine_prompt_module(messages: List[Dict], conversation_history: List[Message]) -> str:
    """
    Determine which prompt module to use based on conversation flow
    Flow: intent_detector → explainer → understanding_check → evaluator
    """
    history_len = len(conversation_history)
    
    # First message: detect intent and style
    if history_len == 0:
        return intent_detector_prompt(
            messages[-1]["content"] if messages else "",
            []
        )
    
    # Check if last assistant message was a check question
    if history_len >= 2 and conversation_history[-1]["role"] == "assistant":
        last_content = conversation_history[-1].get("content", "")
        if "question" in last_content.lower() and "understand" in last_content.lower():
            # Student is answering a check question, evaluate it
            return evaluator_prompt(
                state_store.get("current_topic", "Unknown"),
                last_content,
                messages[-1]["content"] if messages else ""
            )
    
    # After explanation requested: generate explanation
    if history_len >= 1:
        return explainer_prompt(
            state_store.get("current_topic", "Unknown"),
            state_store.get("explanation_style", "beginner"),
            conversation_history
        )
    
    # Default: use general system prompt
    return get_system_prompt(
        topic=state_store.get("current_topic"),
        style=state_store.get("explanation_style")
    )

# Helper function to generate stream
async def generate_stream(messages: List[Dict], system_prompt: str):
    """Generate streaming response from Google Gemini API"""
    try:
        # Prepare the conversation content for Gemini API
        # Convert messages to Gemini format
        contents = [{"role": msg["role"], "parts": [msg["content"]]} for msg in messages]

        # Stream from Gemini with proper system parameter
        response = model.generate_content(
            contents=contents,
            system_instruction=system_prompt,
            stream=True
        )

        # Yield chunks as Server-Sent Events
        for chunk in response:
            if chunk.text:
                # Yield data in Server-Sent Events format
                yield f"data: {json.dumps({'content': chunk.text})}\n\n"

    except Exception as e:
        error_msg = str(e)
        yield f"data: {json.dumps({'error': error_msg})}\n\n"

# Routes
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "AI Concept Explainer"}

@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Main chat endpoint that streams concept explanations
    Routes to appropriate prompt module based on conversation flow
    """
    try:
        # Update state store if new topic or style provided
        if request.current_topic:
            state_store["current_topic"] = request.current_topic
        if request.explanation_style:
            state_store["explanation_style"] = request.explanation_style

        # Prepare messages for Gemini
        messages = [
            {"role": msg.role, "content": msg.content}
            for msg in request.conversation_history
        ]
        # Add current user input
        messages.append({"role": "user", "content": request.user_input})

        # Determine which prompt module to use based on conversation flow
        system_prompt = determine_prompt_module(messages, list(request.conversation_history))

        # Stream the response
        return StreamingResponse(
            generate_stream(messages, system_prompt),
            media_type="text/event-stream"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/state")
async def get_state():
    """Get current state"""
    return state_store

@app.post("/state")
async def update_state(data: Dict):
    """Update state"""
    if "current_topic" in data:
        state_store["current_topic"] = data["current_topic"]
    if "explanation_style" in data:
        state_store["explanation_style"] = data["explanation_style"]
    return state_store

@app.post("/reset")
async def reset():
    """Reset state"""
    state_store["current_topic"] = None
    state_store["explanation_style"] = None
    return {"message": "State reset successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
