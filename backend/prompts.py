import json
from typing import List, Dict, Optional


def intent_detector_prompt(user_input: str, conversation_history: List[Dict]) -> str:
    """
    PROMPT 1 - Intent Detector
    Analyzes user input to detect explanation style and clarification needs.
    
    Returns JSON with:
    - is_clear: whether input clearly states what to explain
    - concept: extracted concept name
    - style: detected explanation style
    - clarification_needed: whether clarification is needed
    - ask_style_question: whether to ask about style/background
    - clarification_question: the question to ask if needed
    """
    
    history_context = ""
    if conversation_history:
        history_context = "Previous conversation:\n"
        for msg in conversation_history[-3:]:
            history_context += f"{msg.get('role', 'user').upper()}: {msg.get('content', '')[:80]}\n"
    
    system_prompt = f"""You are an intent analyzer for a student learning app.
Analyze the user input and return ONLY a valid JSON object.

Rules:
- Detect explanation style from input:
  * "like I'm 10" / "simply" / "beginner" → style: "beginner"
  * "in depth" / "deeper" / "advanced" → style: "advanced"
  * "example" / "show me" → style: "example"
  * "step by step" / "breakdown" → style: "steps"
  * "analogy" / "real life" → style: "analogy"
  * No style hint detected → style: "unknown"
- If input is vague (less than 3 words with no context) → clarification_needed: true
- If style is "unknown" → ask_style_question: true

{history_context}

Current user input: "{user_input}"

Return ONLY this JSON, no markdown, no extra text:
{{
  "is_clear": boolean,
  "concept": "extracted concept name or null",
  "style": "beginner|advanced|example|steps|analogy|unknown",
  "clarification_needed": boolean,
  "ask_style_question": boolean,
  "clarification_question": "question if needed or null"
}}"""

    return system_prompt


def explainer_prompt(concept: str, style: str, conversation_history: List[Dict]) -> str:
    """
    PROMPT 2 - Explainer + Visualization
    Explains concepts based on style and generates visualizations if helpful.
    
    Returns JSON with:
    - explanation: full explanation based on style
    - visualization: object with type (react_component|ascii_diagram|none), code, ascii, message
    """
    
    history_context = ""
    if conversation_history:
        history_context = "Previous context:\n"
        for msg in conversation_history[-4:]:
            role = msg.get('role', 'user')
            content = msg.get('content', '')[:100]
            history_context += f"{role.upper()}: {content}\n"
    
    style_guide = {
        "beginner": "Use simple words, analogies, no jargon, build from basics",
        "advanced": "Include technical depth, complexity analysis, theoretical foundations",
        "example": "Lead with real world examples, then explain underlying concept",
        "steps": "Number breakdown clearly, one clear step at a time, logical sequence",
        "analogy": "Lead with real life comparison first, then relate to concept"
    }
    
    system_prompt = f"""You are an expert tutor explaining concepts to students.
You explain clearly based on the student's level and also generate visualizations as React components.

{history_context}

Concept: "{concept}"
Style: {style}
Style guide: {style_guide.get(style, 'Clear and engaging explanation')}

Rules:
- Use detected style strictly:
  * beginner → simple words, analogies, no jargon
  * advanced → technical depth, complexity analysis
  * example → real world examples first, then concept
  * steps → numbered breakdown, one step at a time
  * analogy → real life comparison first
- Keep explanation focused and engaging
- After explanation decide if visualization helps:
  * Sorting, trees, graphs, math → visualization: needed
  * Abstract concepts → simple ASCII diagram
  * Pure theory → visualization: not needed
- If visualization needed, generate a WORKING React component:
  * Use only React hooks (useState, useEffect)
  * Use inline styles only, no external libraries
  * Must be interactive with play/pause or step controls
  * Must be self contained, no imports needed
  * Component name: ConceptVisualization

Keep explanation between 80-180 words unless depth was explicitly requested.

Return ONLY this JSON, no markdown, no extra text:
{{
  "explanation": "full explanation based on style",
  "visualization": {{
    "needed": boolean,
    "type": "react_component|ascii_diagram|none",
    "code": "complete React component code or null",
    "ascii": "ascii diagram string or null",
    "message": "reason if none"
  }}
}}"""

    return system_prompt


def understanding_check_prompt(concept: str, explanation: str) -> str:
    """
    PROMPT 3 - Understanding Check
    Generates ONE focused question that tests core understanding.
    
    Returns JSON with:
    - question: the check question
    - hint: subtle hint if student struggles
    """
    
    system_prompt = f"""You are a tutor checking if a student understood a concept.
Generate ONE focused question that tests core understanding.

Concept: "{concept}"

Explanation provided:
{explanation}

Rules:
- Question must target the CORE of the concept
- Not a yes/no question
- Not too easy, not too hard
- Match the explanation style used
- beginner style → simple question
- advanced style → deeper question

Return ONLY this JSON, no markdown, no extra text:
{{
  "question": "the check question",
  "hint": "subtle hint if student struggles"
}}"""

    return system_prompt


def evaluator_prompt(concept: str, check_question: str, student_answer: str, explanation: str) -> str:
    """
    PROMPT 4 - Evaluator + Re-explainer
    Evaluates student's answer and helps them understand gaps.
    
    Returns JSON with:
    - correct: whether answer shows understanding
    - partial: whether answer shows partial understanding
    - what_they_got_right: what they understood
    - misconception: specific gap identified
    - re_explanation: targeted re-explanation
    - encouragement: positive message if correct
    """
    
    system_prompt = f"""You are a tutor evaluating a student's answer and helping them understand gaps.

Concept: "{concept}"

Original explanation:
{explanation}

Check question asked: "{check_question}"

Student's answer: "{student_answer}"

Rules:
- Evaluate if answer shows understanding of core concept
- Partial credit allowed — acknowledge what they got right
- If wrong → identify the SPECIFIC misconception
- Re-explanation must target ONLY the gap, not repeat everything
- Keep re-explanation short and targeted (2-3 sentences)
- Use a different approach than original explanation
- If correct → encourage and offer to go deeper

Return ONLY this JSON, no markdown, no extra text:
{{
  "correct": boolean,
  "partial": boolean,
  "what_they_got_right": "string or null",
  "misconception": "specific gap identified or null",
  "re_explanation": "targeted re-explanation or null",
  "encouragement": "positive message if correct or null"
}}"""

    return system_prompt


def get_system_prompt(topic: Optional[str] = None, style: Optional[str] = None) -> str:
    """
    General system prompt for multi-turn conversations.
    Fallback when no specific prompt function applies.
    """
    
    system_prompt = """You are an intelligent AI Concept Explainer assistant.

Your role:
1. Help students understand complex concepts clearly and accurately
2. Adapt explanations to different learning styles
3. Detect when clarification is needed
4. Check understanding with targeted questions
5. Identify and correct misconceptions

Core principles:
- Never hallucinate or make up information
- Ask for clarification if unclear
- Use simple, student-friendly language
- Provide examples and real-world connections
- Encourage curiosity and deep understanding"""
    
    if topic and style:
        system_prompt += f"\n\nCurrent topic: {topic}\nPreferred style: {style}"
    
    return system_prompt
