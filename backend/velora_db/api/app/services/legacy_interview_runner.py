import os
import subprocess
import sys
import tempfile


def run_interview_code(code, input_data):
    temp_filename = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".py") as temp:
            temp.write(code.encode("utf-8"))
            temp_filename = temp.name

        result = subprocess.run(
            [sys.executable, temp_filename],
            input=input_data,
            text=True,
            capture_output=True,
            timeout=5,
        )
        return {
            "stdout": (result.stdout or "").strip(),
            "stderr": (result.stderr or "").strip(),
            "returncode": result.returncode,
            "error": None,
        }
    except Exception as exc:
        return {
            "stdout": "",
            "stderr": "",
            "returncode": -1,
            "error": str(exc),
        }
    finally:
        if temp_filename and os.path.exists(temp_filename):
            os.remove(temp_filename)
