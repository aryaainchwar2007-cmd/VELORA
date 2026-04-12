import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import settings


router = APIRouter(tags=["code"])


class CodeRunRequest(BaseModel):
    code: str = Field(min_length=1)
    language_id: int = 71  # 71 = Python 3 on Judge0
    stdin: str | None = None

@router.post("/run-code")
def run_code(payload: CodeRunRequest):
    try:
        response = requests.post(
            settings.judge0_url,
            json={
                "source_code": payload.code,
                "language_id": payload.language_id,
                "stdin": payload.stdin or "",
            },
            timeout=30,
        )
        response.raise_for_status()
        result = response.json()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Code runner request failed: {exc}") from exc

    output = result.get("stdout")
    raw_error = result.get("compile_output") or result.get("stderr")
    return {"output": output, "error": raw_error}
