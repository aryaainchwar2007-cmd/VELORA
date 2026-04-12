import re

import requests
from fastapi import APIRouter
from openai import OpenAI

from app.config import settings


router = APIRouter(tags=["legacy"])

SYSTEM_PROMPT = """
You are Code Sage AI, a coding mentor.
Explain errors simply and clearly.

Output format:
Verdict:
Explanation:
Mistake:
Fix:
Improved Code:
""".strip()


@router.post("/evaluate-code")
def evaluate_code(code: str):
    try:
        response = requests.post(
            settings.judge0_url,
            json={"source_code": code, "language_id": 71},
            timeout=30,
        )
        result = response.json()

        output = result.get("stdout")
        stderr = result.get("stderr")
        compile_error = result.get("compile_output")
        raw_error = compile_error if compile_error else stderr
        clean_error = extract_error(raw_error) if raw_error else None

        if not settings.deepseek_api_key:
            return {
                "output": output,
                "error": clean_error,
                "ai_explanation": "Set DEEPSEEK_API_KEY to enable legacy AI explanation.",
            }

        client = OpenAI(api_key=settings.deepseek_api_key, base_url="https://api.deepseek.com")
        user_prompt = f"Code:\n{code}\n\nOutput:\n{output}\n\nError:\n{raw_error}\n"
        ai_response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": user_prompt}],
        )
        explanation = ai_response.choices[0].message.content
        return {"output": output, "error": clean_error, "ai_explanation": explanation}
    except Exception as exc:
        return {"output": None, "error": str(exc), "ai_explanation": None}


def extract_error(text: str):
    line_match = re.search(r"line (\d+)", text or "")
    line = line_match.group(1) if line_match else "unknown"
    if "SyntaxError" in text:
        return f"SyntaxError at line {line}"
    if "IndentationError" in text:
        return f"IndentationError at line {line}"
    if "NameError" in text:
        return f"NameError at line {line}"
    if "TypeError" in text:
        return f"TypeError at line {line}"
    if "ZeroDivisionError" in text:
        return f"ZeroDivisionError at line {line}"
    return f"Error at line {line}"
