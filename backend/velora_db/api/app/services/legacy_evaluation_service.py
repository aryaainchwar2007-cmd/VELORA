from app.services.legacy_ai_service import ai_evaluate_answer
from app.services.legacy_interview_runner import run_interview_code
from app.services.legacy_interview_service import update_session


def _normalize_output(value):
    return "\n".join(line.rstrip() for line in str(value or "").replace("\r\n", "\n").strip().split("\n")).strip()


def _input_variants(raw_input):
    text = str(raw_input or "")
    variants = [text]

    compact = text.strip()
    if compact and " " in compact and "\n" not in compact:
        variants.append("\n".join(compact.split()) + "\n")

    if "\n" in text:
        variants.append(" ".join(part for part in text.split()))

    unique = []
    for value in variants:
        if value not in unique:
            unique.append(value)
    return unique


def _outputs_match(actual, expected):
    actual_norm = _normalize_output(actual)
    expected_norm = _normalize_output(expected)
    if not actual_norm or not expected_norm:
        return False
    if actual_norm == expected_norm:
        return True

    actual_lines = [line.strip() for line in actual_norm.split("\n") if line.strip()]
    if actual_lines and actual_lines[-1] == expected_norm:
        return True

    expected_tokens = expected_norm.split()
    actual_tokens = actual_norm.replace("\n", " ").split()
    return expected_tokens == actual_tokens


def evaluate_answer(data):
    question = data.get("question")
    code = data.get("code")
    session_id = data.get("session_id")

    test_cases = [
        {"input": "2 3", "expected": "5"},
        {"input": "10 5", "expected": "15"},
        {"input": "-1 1", "expected": "0"},
    ]

    passed = 0
    for test in test_cases:
        is_passed = False
        for variant in _input_variants(test["input"]):
            run = run_interview_code(code or "", variant)
            if run.get("error"):
                continue
            if run.get("stderr"):
                continue
            if _outputs_match(run.get("stdout", ""), test["expected"]):
                is_passed = True
                break
        if is_passed:
            passed += 1

    if passed == len(test_cases):
        correctness = "Yes"
    elif passed > 0:
        correctness = "Partial"
    else:
        correctness = "No"

    try:
        ai_feedback = ai_evaluate_answer(question, code)
    except Exception as exc:
        ai_feedback = {"error": "AI failed", "details": str(exc)}

    score = (passed / len(test_cases)) * 10
    update_session(session_id, score, question, correctness)
    return {
        "correctness": correctness,
        "passed_cases": passed,
        "total_cases": len(test_cases),
        "score": round(score, 2),
        "ai_feedback": ai_feedback,
    }
