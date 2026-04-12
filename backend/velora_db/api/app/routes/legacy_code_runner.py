import re

import requests
from fastapi import APIRouter

from app.config import settings


router = APIRouter(tags=["legacy"])


@router.post("/run-code")
def run_code(code: str):
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
        error = None
        if compile_error:
            error = extract_error(compile_error)
        elif stderr:
            error = extract_error(stderr)
        return {"output": output, "error": error}
    except Exception as exc:
        return {"output": None, "error": str(exc)}


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
