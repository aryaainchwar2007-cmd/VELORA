from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from openai import OpenAI

from app.config import settings


router = APIRouter(tags=["speech"])

LANGUAGE_MAP = {
    "en-IN": "en",
    "hi-IN": "hi",
    "mr-IN": "mr",
    "ta-IN": "ta",
    "te-IN": "te",
    "kn-IN": "kn",
    "ml-IN": "ml",
}


@router.post("/speech-to-text")
async def speech_to_text(
    audio: UploadFile = File(...),
    language: str = Form(default="en-IN"),
):
    if not settings.openai_api_key:
        raise HTTPException(status_code=400, detail="Set OPENAI_API_KEY in .env first.")

    suffix = Path(audio.filename or "audio.webm").suffix or ".webm"
    temp_path = None

    try:
        with NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_path = Path(temp_file.name)
            temp_file.write(await audio.read())

        client = OpenAI(api_key=settings.openai_api_key)
        normalized_language = LANGUAGE_MAP.get(language, "en")

        with temp_path.open("rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="gpt-4o-mini-transcribe",
                file=audio_file,
                language=normalized_language,
            )

        return {"text": (getattr(transcript, "text", "") or "").strip(), "language": normalized_language}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Speech transcription failed: {exc}") from exc
    finally:
        if temp_path and temp_path.exists():
            temp_path.unlink(missing_ok=True)
