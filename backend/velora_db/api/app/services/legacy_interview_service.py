import uuid


session_store = {}


def start_interview(data):
    session_id = str(uuid.uuid4())
    session_store[session_id] = {
        "difficulty": data.get("difficulty", "easy"),
        "scores": [],
        "questions": [],
        "responses": [],
    }
    return {"session_id": session_id, "message": "Interview started"}


def update_session(session_id, score, question, correctness):
    session = session_store.get(session_id)
    if not session:
        return
    session["scores"].append(score)
    session["questions"].append(question)
    session["responses"].append({"question": question, "score": score, "correctness": correctness})


def get_next_difficulty(session_id):
    session = session_store.get(session_id)
    if not session:
        return "easy"

    scores = session["scores"]
    if not scores:
        return session["difficulty"]

    avg = sum(scores) / len(scores)
    if avg >= 8:
        return "hard"
    if avg >= 5:
        return "medium"
    return "easy"


def generate_summary(session_id):
    session = session_store.get(session_id)
    if not session or not session["scores"]:
        return {"error": "No data"}

    scores = session["scores"]
    avg = sum(scores) / len(scores)
    if avg >= 8:
        verdict = "Hire"
    elif avg >= 6:
        verdict = "Lean Hire"
    else:
        verdict = "No Hire"

    return {
        "average_score": round(avg, 2),
        "total_questions": len(scores),
        "verdict": verdict,
    }
