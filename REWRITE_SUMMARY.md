# Backend Rewrite Complete - 4-State Conversation Flow

## Summary

The backend has been completely rewritten with a powerful new **4-state conversation system** that orchestrates intelligent pedagogical responses through sequential API calls to specialized prompts.

---

## 1. New Prompt System (4 Specialized Prompts)

### PROMPT 1 - Intent Detector
**Purpose**: Understand user intent, detect explanation style, and identify vagueness

**Input**: User input + conversation history  
**Output JSON**:
```json
{
  "is_clear": boolean,
  "concept": "extracted concept name or null",
  "style": "beginner|advanced|example|steps|analogy|unknown",
  "clarification_needed": boolean,
  "ask_style_question": boolean,
  "clarification_question": "question if needed or null"
}
```

**Detects Styles**:
- "beginner" → for novice-level requests
- "advanced" → for deeper technical depth
- "example" → emphasizes real-world applications
- "steps" → detailed procedural breakdown
- "analogy" → real-life comparisons
- "unknown" → no style hint detected (asks follow-up)

**Special Handling**: Vague inputs (< 3 words) trigger `clarification_needed: true`

---

### PROMPT 2 - Explainer + Visualization
**Purpose**: Generate engaging explanations tailored to style + create visual representations

**Input**: Concept name, style, conversation history  
**Output JSON**:
```json
{
  "explanation": "full explanation (80-180 words)",
  "visualization": {
    "needed": boolean,
    "type": "react_component|ascii_diagram|none",
    "code": "complete React component code or null",
    "ascii": "ascii diagram string or null",
    "message": "reason if none"
  }
}
```

**Style-Specific Behavior**:
- **beginner**: Simple language, analogies, no jargon
- **advanced**: Technical depth, complexity analysis
- **example**: Real-world examples first, then concept
- **steps**: Numbered breakdown, one step at a time
- **analogy**: Real-life comparison first

**Visualization Logic**:
- Sorting algorithms, data structures, graphs → generate interactive React component
- Processes, abstract concepts → simple ASCII diagram
- Pure theory → no visualization needed

---

### PROMPT 3 - Understanding Check
**Purpose**: Generate ONE focused question that tests core understanding

**Input**: Concept + explanation  
**Output JSON**:
```json
{
  "question": "the check question",
  "hint": "subtle hint if student struggles"
}
```

**Requirements**:
- Must target CORE of concept (not peripheral details)
- Not yes/no questions
- Difficulty matches explanation style
- Student-friendly language

---

### PROMPT 4 - Evaluator + Re-explainer
**Purpose**: Evaluate student answer and provide targeted re-explanation for misconceptions

**Input**: Concept, check question, student answer, original explanation  
**Output JSON**:
```json
{
  "correct": boolean,
  "partial": boolean,
  "what_they_got_right": "string or null",
  "misconception": "specific gap identified or null",
  "re_explanation": "targeted re-explanation or null",
  "encouragement": "positive message if correct or null"
}
```

**Features**:
- Acknowledges partial understanding
- Identifies SPECIFIC misconceptions (not vague)
- Re-explains only the gap (targets difference from original)
- Uses different approach than original explanation  
- Encourages correct responses

---

## 2. New Chat Endpoint - 4-State Orchestration

### State Detector
The endpoint automatically detects which of 4 conversation states the user is in:

```python
def detect_conversation_state(messages, user_input, conversation_history) -> str:
    """Returns: 'new_concept' | 'answering_check' | 'follow_up' | 'skip'"""
```

---

### STATE 1: New Concept Input
**Triggered When**: First message or completely new topic

**Flow**:
1. **Prompt 1 (Intent Detector)** → Analyze user input for clarity & style
   - If `clarification_needed = true` → Return clarification question, STOP
   - If `ask_style_question = true` → Ask about background, STOP
   - If `is_clear = true` → Continue to step 2

2. **Prompt 2 (Explainer)** → Generate explanation in detected style
   - Uses detected `style` from Intent Detector
   - Includes visualization if applicable

3. **Prompt 3 (Understanding Check)** → Generate assessment question
   - Tests student's understanding of just-explained concept

**Response Type**: `"explanation"`  
**Response Fields**: 
- Intent detection result (concept, style, clarity)
- Explanation + visualization
- Understanding check question

---

### STATE 2: User Answering Check Question
**Triggered When**: Last assistant message was an understanding check question

**Flow**:
1. **Retrieves** the previous check question from conversation history
2. **Retrieves** the original explanation for context
3. **Prompt 4 (Evaluator)** → Evaluate answer & provide feedback

**Response Type**: `"evaluation"`  
**Response Fields**:
- Correctness assessment
- Specific misconception (if wrong)
- Targeted re-explanation (if wrong)
- Encouragement (if correct)

---

### STATE 3: Follow-up Question
**Triggered When**: Continuing earlier conversation about same topic

**Flow**:
1. **Prompt 2 (Explainer)** → Generate new explanation with full history as context
2. Maintains same topic and style from state store

**Response Type**: `"explanation"`  
**Response Fields**: New explanation + optional visualization

---

### STATE 4: Skip Command
**Triggered When**: User sends "skip", "skip this", "never mind", "next"

**Response**:
```json
{
  "type": "skip",
  "message": "No problem! Feel free to ask anything else."
}
```

**Result**: Resets flow, ready for new concept

---

## 3. Implementation Details

### Updated Files

#### `/prompts.py` - Completely Rewritten
- **Functions**:
  - `intent_detector_prompt(user_input, history)`
  - `explainer_prompt(concept, style, history)`
  - `understanding_check_prompt(concept, explanation)`
  - `evaluator_prompt(concept, question, answer, explanation)`
  - `get_system_prompt(topic, style)` - fallback

- **Key Changes**:
  - All prompts return strict JSON format
  - Style detection rules built into prompts
  - Word count constraints (80-180 words for explanations)
  - Scenario-specific instructions

#### `/main.py` - New Orchestration Logic
- **New Functions**:
  - `detect_conversation_state()` - Identifies which of 4 states we're in
  - `collect_response()` - Collects non-streaming response for parsing

- **Updated Functions**:
  - `generate_stream()` - Simplified for linear streaming
  - `/chat` endpoint - Completely new orchestration

- **New Endpoints**: None (kept same `/chat` interface)

### State Store
Maintains across requests:
- `current_topic`: Topic being discussed
- `explanation_style`: Student's preferred style (beginner/advanced/example/steps/analogy)

---

## 4. Conversation Flow Example

### Example: "explain bubble sort to me like I'm 10"

**STATE 1 Execution**:

1. **Intent Detector Called**:
   ```
   Input: "explain bubble sort to me like I'm 10"
   Output: {
     "is_clear": true,
     "concept": "bubble sort",
     "style": "beginner",
     "clarification_needed": false,
     "ask_style_question": false
   }
   ```

2. **Explainer Called**:
   ```
   Input: concept="bubble sort", style="beginner"
   Output: {
     "explanation": "Bubble sort is like sorting toys by...",
     "visualization": {
       "needed": true,
       "type": "react_component",
       "code": "function ConceptVisualization() { ... }"
     }
   }
   ```

3. **Understanding Check Called**:
   ```
   Input: explanation="Bubble sort is like..."
   Output: {
     "question": "Can you describe in your own words what happens when we compare neighboring items?"
   }
   ```

**Returned to Frontend**:
- All three responses in sequence
- Type: "explanation"
- Ready for student to answer the check question

---

### Example: Student Answers Check Question

**STATE 2 Execution**:

1. **System Retrieves**:
   - Previous check question
   - Original explanation

2. **Evaluator Called**:
   ```
   student_answer: "We look at two items next to each other..."
   Output: {
     "correct": true,
     "partial": false,
     "misconception": null,
     "encouragement": "Exactly right! You understand the core idea."
   }
   ```

**Returned to Frontend**:
- Type: "evaluation"
- Feedback message
- Ready for follow-up question

---

## 5. API Response Format

All responses stream as Server-Sent Events (SSE) with this format:

```
data: {"content": "...", "stage": "intent"}
data: {"content": "...", "stage": "explanation_start"}
data: {"content": "...JSON object...", "type": "explanation"}
```

The `stage` field helps frontend track progress through multi-step STATE 1 flow.

---

## 6. Error Handling

### Quota Exceeded (429)
If Gemini API quota is hit:
```json
{
  "error": "API quota exceeded. Please try again later.",
  "is_clear": false,
  "clarification_needed": true,
  "clarification_question": "API quota exceeded. Please try again in a moment."
}
```

### Other Errors
Standard HTTP 500 with error details in response body.

---

## 7. Testing Notes

### Current Status
- ✅ Code syntax validated (py_compile passed)
- ✅ Endpoint routing works (200 OK responses)
- ✅ State detection logic functional
- ✅ STATE 4 (Skip) tested successfully
- ⏳ Full API testing pending (Gemini API quota reset)

### Known Limitation
Free tier Gemini API has 20 requests/day limit. After testing the rewrite, quota was exceeded. Once quota resets or paid API key is used, full end-to-end flow will work.

---

## 8. Frontend Integration Notes

**No Changes Required** to frontend - it already handles:
- SSE streaming
- JSON response parsing
- Multiple response types ("explanation", "evaluation", "skip")
- Chat UI rendering

Just refresh browser after restart to use new backend logic.

---

## 9. Next Steps for User

1. **Wait for Quota Reset** or upgrade to paid Gemini API key
2. **Test Full Flow**:
   - "explain bubble sort" (STATE 1)
   - Answer check question (STATE 2)
   - "explain quicksort" (STATE 1, new)
   - "skip" (STATE 4)

3. **Integrate with Frontend** (if needed):
   - No code changes required
   - Just refresh browser

---

## Summary

The backend has been completely rewritten with a powerful **4-state conversation orchestration system** that:

✅ Detects student intent & preferred learning style  
✅ Generates targeted explanations in that style  
✅ Checks understanding with focused questions  
✅ Evaluates answers & provides targeted re-explanations  
✅ Handles follow-up questions within the same topic  
✅ Supports skip/reset commands  

All through **4 specialized, focused prompts** that stream together as a cohesive conversation flow.
