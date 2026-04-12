from fastapi import APIRouter, HTTPException
from openai import OpenAI
from pydantic import BaseModel, Field

from app.config import settings

import requests


router = APIRouter(tags=["ai"])

SYSTEM_PROMPT = """
You are Code Sage AI, a coding mentor.

Explain errors simply and clearly.

Output format:
Verdict:
Explanation:

Rules:
- Do not include sections named Mistake, Fix, Improved Code, Working Code, or any full code block.
- Keep it short and beginner-friendly.
""".strip()


class EvaluateCodeRequest(BaseModel):
    code: str = Field(min_length=1)
    language_id: int = 71


@router.post("/evaluate-code")
def evaluate_code(payload: EvaluateCodeRequest):
    try:
        run_response = requests.post(
            settings.judge0_url,
            json={"source_code": payload.code, "language_id": payload.language_id},
            timeout=30,
        )
        run_response.raise_for_status()
        run_result = run_response.json()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Code runner request failed: {exc}") from exc

    output = run_result.get("stdout")
    raw_error = run_result.get("compile_output") or run_result.get("stderr")
    clean_error = raw_error

    if not settings.deepseek_api_key:
        return {
            "output": output,
            "error": clean_error,
            "ai_explanation": "Set DEEPSEEK_API_KEY in .env to enable AI explanations.",
        }

    try:
        client = OpenAI(api_key=settings.deepseek_api_key, base_url="https://api.deepseek.com")
        user_prompt = f"Code:\n{payload.code}\n\nOutput:\n{output}\n\nError:\n{raw_error}"
        ai_response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": user_prompt}],
        )
        explanation = ai_response.choices[0].message.content
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI evaluation failed: {exc}") from exc

    return {"output": output, "error": clean_error, "ai_explanation": explanation}
