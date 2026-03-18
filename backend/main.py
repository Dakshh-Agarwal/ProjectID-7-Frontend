import os
import json
from typing import Optional, List, Dict
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
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
app = FastAPI(title="AI Concept Explainer", version="2.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:8001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini API
api_key = os.getenv("GEMINI_API_KEY")

if api_key:
    genai.configure(api_key=api_key)
# We will check if it's configured later inside chat/endpoints


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


GREETINGS = {
    "hi", "hello", "hey", "yo", "sup", "hola", "namaste", "hii", "heyy"
}


def is_greeting_input(user_input: str) -> bool:
    text = (user_input or "").strip().lower()
    return text in GREETINGS


def extract_topic_from_input(user_input: str) -> Optional[str]:
    text = (user_input or "").strip().lower()
    if not text:
        return None

    if is_greeting_input(text):
        return None

    prefixes = [
        "explain me", "explain", "tell me about", "what is", "how does", "describe", "teach me"
    ]
    for prefix in prefixes:
        if text.startswith(prefix):
            text = text[len(prefix):].strip()
            break

    stop_words = {"me", "please", "about", "the", "a", "an"}
    tokens = [tok for tok in text.split() if tok not in stop_words]
    if not tokens:
        return None

    candidate = " ".join(tokens)
    if candidate in GREETINGS:
        return None

    return candidate.capitalize()

# Helper function to determine conversation state
def detect_conversation_state(messages: List[Dict], user_input: str, conversation_history: List[Message]) -> str:
    """
    Detect which of the 4 states the conversation is in:
    STATE 1 - New concept input: First turn or new question about different topic
    STATE 2 - User answering check question: Last assistant message was a check question
    STATE 3 - Follow up question: User asking deeper question about same topic
    STATE 4 - Skip: User sends "skip"
    """
    
    # STATE 4: Skip command
    if user_input.strip().lower() in ["skip", "skip this", "never mind", "next"]:
        return "skip"
    
    # If no history, it's STATE 1
    if len(conversation_history) == 0:
        return "new_concept"
    
    # Check if last assistant message contains a check question
    # We look for messages with "question" in them that are part of understanding check
    if len(conversation_history) >= 2:
        last_assistant_msg = None
        for msg in reversed(conversation_history):
            if msg.role == "assistant":
                last_assistant_msg = msg.content
                break
        
        # If last assistant message looks like an understanding check question
        if last_assistant_msg and "question" in last_assistant_msg.lower():
            # Check if it's JSON with "question" field (understanding_check or evaluator output)
            try:
                parsed = json.loads(last_assistant_msg)
                if "question" in parsed or "check_question" in parsed:
                    return "answering_check"
            except:
                pass
    
    # STATE 3: Follow up question about same topic (or STATE 1 if new topic)
    # If we reach here and have history, it's a follow up
    return "follow_up"


# Helper function to generate stream with new state-based logic
async def generate_stream(state: str, messages: List[Dict], system_prompt: str, context: Dict):
    """
    Generate streaming response using Google Gemini API.
    
    Args:
        state: One of 'new_concept', 'answering_check', 'follow_up', 'skip'
        messages: Full message conversation
        system_prompt: System instruction
        context: Dict with topic, style, explanation text, etc.
    """
    try:
        # Convert messages to Gemini format
        # Gemini expects 'user' and 'model' roles. 
        # For simplicity, we can pass the system prompt and conversation as a single combined conversation or set system_instruction on the model.
        
        # Determine the model and set system instructions
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=system_prompt,
        )
        
        gemini_messages = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            gemini_messages.append({"role": role, "parts": [msg["content"]]})
        
        # Stream from Gemini API
        response = model.generate_content(
            gemini_messages,
            stream=True,
            generation_config=genai.types.GenerationConfig(temperature=0.7)
        )

        # Yield chunks as Server-Sent Events
        for chunk in response:
            if chunk.text:
                # Yield data in Server-Sent Events format
                yield f"data: {json.dumps({'content': chunk.text})}\n\n"

    except Exception as e:
        error_msg = str(e)
        print(f"API Error in generate_stream: {error_msg}")
        yield f"data: {json.dumps({'error': error_msg})}\n\n"
    except Exception as e:
        import traceback
        error_msg = str(e)
        traceback_str = traceback.format_exc()
        print(f"Error in generate_stream: {error_msg}")
        print(f"Traceback: {traceback_str}")
        yield f"data: {json.dumps({'error': error_msg})}\n\n"


async def collect_response(messages: List[Dict], system_prompt: str) -> str:
    """Collect full response from Gemini (non-streaming)"""
    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=system_prompt,
        )
        
        gemini_messages = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            gemini_messages.append({"role": role, "parts": [msg["content"]]})
            
        response = model.generate_content(
            gemini_messages,
            generation_config=genai.types.GenerationConfig(temperature=0.7)
        )
        
        return response.text if response.text else ""
    except Exception as e:
        error_msg = str(e)
        print(f"API Error in collect_response: {error_msg}")
        # Return a graceful fallback for rate limit errors
        if "429" in error_msg or "rate_limit" in error_msg.lower():
            return json.dumps({
                "error": "API rate limit exceeded. Please try again later.",
                "is_clear": False,
                "clarification_needed": True,
                "clarification_question": "API rate limit exceeded. Please try again in a moment."
            })
        return ""
    except Exception as e:
        error_msg = str(e)
        print(f"Error in collect_response: {error_msg}")
        return ""


@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Main chat endpoint implementing 4-state conversation flow:
    STATE 1 - New concept input: Intent → (if clear) Explanation + Check
    STATE 2 - Answering check: Evaluator
    STATE 3 - Follow up: Explanation  
    STATE 4 - Skip: Return skip message
    """
    if not api_key:
        async def NoKeyStream():
            result = {"error": "GEMINI_API_KEY environment variable is not set. Please add it to your .env file."}
            yield f"data: {json.dumps(result)}\n\n"
        return StreamingResponse(NoKeyStream(), media_type="text/event-stream")

    try:
        # Update state store if new topic or style provided
        if request.current_topic:
            state_store["current_topic"] = request.current_topic
        if request.explanation_style:
            state_store["explanation_style"] = request.explanation_style

        # Auto-extract topic from user input
        if not state_store.get("current_topic") and not is_greeting_input(request.user_input):
            extracted_topic = extract_topic_from_input(request.user_input)
            if extracted_topic:
                state_store["current_topic"] = extracted_topic

        # Prepare messages
        history_dicts = [{"role": msg.role, "content": msg.content} for msg in request.conversation_history]
        messages = history_dicts + [{"role": "user", "content": request.user_input}]
        state = detect_conversation_state(messages, request.user_input, request.conversation_history)

        # STATE 4: Skip command
        if state == "skip":
            async def skip_stream():
                result = {"type": "skip", "message": "No problem! Feel free to ask anything else."}
                yield f"data: {json.dumps(result)}\n\n"
            
            return StreamingResponse(skip_stream(), media_type="text/event-stream")

        # STATE 2: User answering check question
        if state == "answering_check":
            # Find the last check question from history
            last_check_question = None
            last_explanation = None
            
            for i in range(len(request.conversation_history) - 1, -1, -1):
                msg = request.conversation_history[i]
                if msg.role == "assistant":
                    try:
                        parsed = json.loads(msg.content)
                        if "question" in parsed:
                            last_check_question = parsed.get("question")
                            break
                        elif "explanation" in parsed:
                            last_explanation = parsed.get("explanation")
                    except:
                        pass
            
            topic = state_store.get("current_topic") or "Unknown"
            system_prompt = evaluator_prompt(
                topic,
                last_check_question or "Understanding question",
                request.user_input,
                last_explanation or ""
            )
            
            async def evaluator_stream():
                async for chunk in generate_stream("answering_check", messages, system_prompt, {}):
                    yield chunk
            
            return StreamingResponse(evaluator_stream(), media_type="text/event-stream")

        # STATE 1: New concept input
        if state == "new_concept":
            async def new_concept_stream():
                # Step 1: Call Intent Detector (non-streaming to get response for parsing)
                intent_system = intent_detector_prompt(request.user_input, history_dicts)
                intent_response = await collect_response(messages, intent_system)
                
                # Yield intent detector response
                yield f"data: {json.dumps({'content': intent_response, 'stage': 'intent'})}\n\n"
                
                # Parse intent response
                try:
                    json_start = intent_response.find('{')
                    json_end = intent_response.rfind('}') + 1
                    if json_start >= 0 and json_end > json_start:
                        intent_json_str = intent_response[json_start:json_end]
                        intent_data = json.loads(intent_json_str)
                        
                        # If clarification needed, stop here
                        if intent_data.get("clarification_needed") or intent_data.get("ask_style_question"):
                            yield f"data: {json.dumps({'type': 'clarification', 'stage': 'end'})}\n\n"
                            return
                        
                        # If clear, continue with explanation + understanding check
                        if intent_data.get("is_clear") and not intent_data.get("clarification_needed"):
                            concept = intent_data.get("concept", state_store.get("current_topic", "Unknown"))
                            style = intent_data.get("style", state_store.get("explanation_style", "beginner"))
                            
                            # Update state with detected style
                            if style != "unknown":
                                state_store["explanation_style"] = style
                            if concept:
                                state_store["current_topic"] = concept
                            
                            # Step 2: Call Explainer (streaming)
                            explainer_system = explainer_prompt(concept, style, history_dicts)
                            
                            yield f"data: {json.dumps({'stage': 'explanation_start'})}\n\n"
                            
                            explanation_response = ""
                            async for chunk in generate_stream("new_concept", messages, explainer_system, {}):
                                explanation_response += chunk
                                yield chunk
                            
                            # Extract explanation for check question
                            try:
                                # Find JSON in the streamed content
                                text_parts = explanation_response.split("data: ")
                                json_text = ""
                                for part in text_parts:
                                    if part.strip():
                                        json_text += part.split("\n\n")[0]
                                
                                json_match = ""
                                for line in json_text.split('\n'):
                                    if line.strip():
                                        try:
                                            parsed = json.loads(line.split(': ')[1] if ': ' in line else line)
                                            if isinstance(parsed, dict) and "explanation" in parsed:
                                                json_match = parsed
                                                break
                                        except:
                                            pass
                                
                                if json_match and isinstance(json_match, dict):
                                    explanation_content = json_match.get("explanation", "")
                                    
                                    # Step 3: Call Understanding Check (streaming)
                                    check_system = understanding_check_prompt(concept, explanation_content)
                                    
                                    yield f"data: {json.dumps({'stage': 'check_question_start'})}\n\n"
                                    
                                    async for chunk in generate_stream("new_concept", messages, check_system, {}):
                                        yield chunk
                            except Exception as e:
                                print(f"Error extracting explanation: {e}")
                            
                            yield f"data: {json.dumps({'type': 'explanation', 'stage': 'end'})}\n\n"
                except Exception as e:
                    print(f"Error parsing intent: {e}")
                    yield f"data: {json.dumps({'type': 'explanation', 'stage': 'end'})}\n\n"
            
            return StreamingResponse(new_concept_stream(), media_type="text/event-stream")
        
        # STATE 3: Follow-up question
        else:  
            topic = state_store.get("current_topic") or "Unknown"
            style = state_store.get("explanation_style") or "beginner"
            system_prompt = explainer_prompt(topic, style, history_dicts)
            
            async def followup_stream():
                async for chunk in generate_stream("follow_up", messages, system_prompt, {}):
                    yield chunk
            
            return StreamingResponse(followup_stream(), media_type="text/event-stream")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "AI Concept Explainer", "api": "Google Gemini"}

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
    uvicorn.run(app, host="127.0.0.1", port=3002)
