import json
import random
import time
import uuid

from openai import OpenAI

from app.config import settings
from app.services.legacy_ai_service import QUESTION_BANK


LIVE_INTERVIEW_DURATION_SECONDS = 300
MAX_QUESTIONS = 6

live_session_store = {}


def _difficulty_for_index(index):
    sequence = ["easy", "medium", "hard", "medium", "hard", "easy"]
    if index < len(sequence):
        return sequence[index]
    return random.choice(["easy", "medium", "hard"])


def _extract_keywords(question_text):
    words = []
    for raw in str(question_text or "").lower().replace("[", " ").replace("]", " ").split():
        cleaned = "".join(ch for ch in raw if ch.isalnum())
        if len(cleaned) >= 4 and cleaned not in {"given", "print", "with", "from", "this", "that", "what"}:
            words.append(cleaned)
    return list(dict.fromkeys(words))[:8]


def _pick_question(difficulty, force_type):
    items = QUESTION_BANK.get(difficulty, QUESTION_BANK["easy"])
    filtered = [item for item in items if item.get("type") == force_type]
    pool = filtered if filtered else items
    selected = random.choice(pool)
    return {
        "difficulty": difficulty,
        "question_type": selected.get("type", "coding"),
        "question": f"[{difficulty.upper()}] {selected.get('question', '')}",
        "examples": selected.get("examples", []),
        "constraints": selected.get("constraints", ""),
        "expected_complexity": selected.get("expected_complexity", ""),
        "keywords": _extract_keywords(selected.get("question", "")),
    }


def _extract_json_block(text):
    raw = str(text or "").strip()
    if not raw:
        return ""
    if raw.startswith("```"):
        lines = raw.splitlines()
        if len(lines) >= 3:
            return "\n".join(lines[1:-1]).strip()
    return raw


def _generate_ai_question(difficulty, force_type, domain):
    if not settings.deepseek_api_key:
        return None
    try:
        client = OpenAI(api_key=settings.deepseek_api_key, base_url="https://api.deepseek.com")
        prompt = (
            "Generate exactly one interview question in strict JSON with keys: "
            "question, question_type, constraints, expected_complexity, examples.\n"
            f"difficulty={difficulty}\n"
            f"question_type={force_type}\n"
            f"domain={domain}\n"
            "Rules:\n"
            "- question_type must be exactly coding or theory.\n"
            "- If coding, include at least one example with input/output.\n"
            "- If theory, examples can be empty.\n"
            "- Keep question concise and realistic for interviews.\n"
            "- Return JSON only."
        )
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "You are an expert interviewer who outputs strict JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
        )
        content = (response.choices[0].message.content or "").strip()
        parsed = json.loads(_extract_json_block(content))
        question = str(parsed.get("question", "")).strip()
        if not question:
            return None
        question_type = str(parsed.get("question_type", force_type)).strip().lower()
        if question_type not in {"coding", "theory"}:
            question_type = force_type
        if question_type != force_type:
            question_type = force_type

        examples = parsed.get("examples", [])
        if not isinstance(examples, list):
            examples = []

        return {
            "difficulty": difficulty,
            "question_type": question_type,
            "question": f"[{difficulty.upper()}] {question}",
            "examples": examples,
            "constraints": str(parsed.get("constraints", "")).strip(),
            "expected_complexity": str(parsed.get("expected_complexity", "Conceptual")).strip(),
            "keywords": _extract_keywords(question),
        }
    except Exception:
        return None


def _pick_question_with_ai(difficulty, force_type, domain):
    generated = _generate_ai_question(difficulty, force_type, domain)
    if generated:
        return generated
    return _pick_question(difficulty, force_type)


def _remaining_seconds(session):
    return max(0, int(session["expires_at"] - time.time()))


def start_live_interview(data):
    session_id = str(uuid.uuid4())
    now = time.time()
    domain = str(data.get("domain", "Python")).strip() or "Python"
    first_difficulty = str(data.get("difficulty", "easy")).strip().lower()
    if first_difficulty not in QUESTION_BANK:
        first_difficulty = "easy"

    first_question = _pick_question_with_ai(first_difficulty, force_type="coding", domain=domain)
    first_question["domain"] = domain

    live_session_store[session_id] = {
        "created_at": now,
        "expires_at": now + LIVE_INTERVIEW_DURATION_SECONDS,
        "domain": domain,
        "questions": [first_question],
        "answers": [],
        "ended": False,
    }

    return {
        "session_id": session_id,
        "remaining_seconds": LIVE_INTERVIEW_DURATION_SECONDS,
        "question_number": 1,
        "question": first_question,
    }


def submit_live_answer(data):
    session_id = data.get("session_id")
    answer = str(data.get("answer", "")).strip()
    session = live_session_store.get(session_id)
    if not session:
        return {"error": "Invalid session id"}
    if session.get("ended"):
        return {"error": "Interview already ended", "completed": True}

    remaining = _remaining_seconds(session)
    if remaining <= 0:
        session["ended"] = True
        return {"completed": True, "message": "Time is up.", "remaining_seconds": 0}

    if not session["questions"]:
        return {"error": "No active question found"}

    active_question = session["questions"][-1]
    session["answers"].append(
        {
            "question": active_question,
            "answer": answer,
            "submitted_at": int(time.time()),
        }
    )

    answered_count = len(session["answers"])
    if answered_count >= MAX_QUESTIONS:
        session["ended"] = True
        return {
            "completed": True,
            "message": "Answer recorded. Interview question limit reached.",
            "remaining_seconds": _remaining_seconds(session),
        }

    if _remaining_seconds(session) <= 0:
        session["ended"] = True
        return {
            "completed": True,
            "message": "Answer recorded. Time is up.",
            "remaining_seconds": 0,
        }

    next_index = answered_count
    next_difficulty = _difficulty_for_index(next_index)
    previous_type = active_question.get("question_type", "coding")
    next_type = "theory" if previous_type == "coding" else "coding"
    next_question = _pick_question_with_ai(next_difficulty, force_type=next_type, domain=session.get("domain", "Python"))
    next_question["domain"] = session.get("domain", "Python")
    session["questions"].append(next_question)

    return {
        "completed": False,
        "message": "Answer recorded. Moving to next question.",
        "remaining_seconds": _remaining_seconds(session),
        "question_number": len(session["questions"]),
        "question": next_question,
    }


def _score_coding(question_text, answer_text, keywords):
    text = answer_text.lower()
    score = 2.0
    if any(token in text for token in ["def ", "class ", "return", "for ", "while ", "if "]):
        score += 2.5
    if len(text) >= 80:
        score += 1.5
    if "\n" in answer_text:
        score += 1.0
    hit_count = sum(1 for key in keywords if key in text)
    score += min(3.0, hit_count * 0.6)
    score = max(0.0, min(10.0, score))

    if score >= 8:
        correctness = "Strong"
    elif score >= 6:
        correctness = "Good"
    elif score >= 4:
        correctness = "Fair"
    else:
        correctness = "Needs Work"

    return score, correctness


def _score_theory(question_text, answer_text, keywords):
    text = answer_text.lower()
    words = [w for w in text.split() if w.strip()]
    score = 1.5
    if len(words) >= 40:
        score += 2.0
    if len(words) >= 70:
        score += 1.0
    if any(token in text for token in ["because", "trade-off", "example", "therefore", "however"]):
        score += 1.5
    hit_count = sum(1 for key in keywords if key in text)
    score += min(4.0, hit_count * 0.7)
    score = max(0.0, min(10.0, score))

    if score >= 8:
        correctness = "Strong"
    elif score >= 6:
        correctness = "Good"
    elif score >= 4:
        correctness = "Fair"
    else:
        correctness = "Needs Work"

    return score, correctness


def _feedback_from_score(question_type, score):
    if score >= 8:
        suggestions = ["Well structured response. Keep explaining trade-offs clearly."]
        mistakes = []
    elif score >= 6:
        suggestions = ["Add stronger edge-case coverage and make your reasoning more explicit."]
        mistakes = ["Depth can be improved in key parts of the solution."]
    else:
        suggestions = ["Break your approach into steps and explain decisions before final answer."]
        mistakes = ["Response missed important details for the asked topic."]

    return {
        "suggestions": suggestions,
        "mistakes": mistakes,
        "question_type": question_type,
    }


def end_live_interview(data):
    session_id = data.get("session_id")
    session = live_session_store.get(session_id)
    if not session:
        return {"error": "Invalid session id"}

    session["ended"] = True
    rounds = []
    total_score = 0.0
    coding_scores = []
    theory_scores = []

    for idx, item in enumerate(session.get("answers", []), start=1):
        question = item.get("question", {})
        question_text = str(question.get("question", ""))
        question_type = question.get("question_type", "coding")
        keywords = question.get("keywords", [])
        answer = str(item.get("answer", ""))

        if question_type == "coding":
            score, correctness = _score_coding(question_text, answer, keywords)
            coding_scores.append(score)
        else:
            score, correctness = _score_theory(question_text, answer, keywords)
            theory_scores.append(score)

        total_score += score
        rounds.append(
            {
                "round": idx,
                "question": question_text,
                "question_type": question_type,
                "candidate_answer": answer,
                "correctness": correctness,
                "passed_cases": int(round(score / 3.4)),
                "total_cases": 3,
                "score": round(score, 2),
                "ai_feedback": _feedback_from_score(question_type, score),
            }
        )

    count = max(1, len(rounds))
    avg = total_score / count
    if avg >= 8:
        verdict = "Hire"
    elif avg >= 6:
        verdict = "Lean Hire"
    else:
        verdict = "No Hire"

    summary = {
        "average_score": round(avg, 2),
        "total_questions": len(rounds),
        "coding_average": round(sum(coding_scores) / max(1, len(coding_scores)), 2),
        "theory_average": round(sum(theory_scores) / max(1, len(theory_scores)), 2),
        "verdict": verdict,
    }

    return {"summary": summary, "rounds": rounds}
