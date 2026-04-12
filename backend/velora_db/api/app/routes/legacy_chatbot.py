import os
import uuid

from fastapi import APIRouter, HTTPException
from openai import OpenAI

from app.config import settings


router = APIRouter(tags=["legacy"])

LANGUAGE_MAP = {
    "english": "en",
    "hindi": "hi",
    "marathi": "mr",
    "tamil": "ta",
    "telugu": "te",
    "kannada": "kn",
    "malayalam": "ml",
}

SYSTEM_PROMPT = """
You are Code Sage, a friendly coding mentor.
User selects a language. You MUST strictly follow the script rules.
Do not mix scripts.
Keep programming terms in English (Python, loop, variable).
Be simple and mentor-like.
""".strip()


def build_tts_audio(text: str, language: str):
    try:
        from gtts import gTTS
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"gTTS is not installed: {exc}") from exc

    lang_code = LANGUAGE_MAP.get((language or "").lower(), "en")
    audio_dir = "audio"
    os.makedirs(audio_dir, exist_ok=True)
    audio_filename = f"audio_{uuid.uuid4()}.mp3"
    audio_path = os.path.join(audio_dir, audio_filename)
    tts = gTTS(text=text, lang=lang_code)
    tts.save(audio_path)
    return f"http://127.0.0.1:8000/audio/{audio_filename}"


@router.post("/chat")
def chat_with_ai(message: str, language: str):
    try:
        if not settings.deepseek_api_key:
            return {"error": "Set DEEPSEEK_API_KEY in .env first."}

        client = OpenAI(api_key=settings.deepseek_api_key, base_url="https://api.deepseek.com")
        user_prompt = (
            f"User message:\n{message}\n\n"
            f"Selected language: {language}\n\n"
            f"Instructions:\n- Reply ONLY in {language}\n- Use correct script\n- Keep programming words in English"
        )
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": user_prompt}],
        )
        reply = (response.choices[0].message.content or "").replace("\\n", "\n").strip()
        audio_url = build_tts_audio(reply, language)
        return {"bot_name": "Code Sage", "language": language, "reply": reply, "audio_url": audio_url}
    except Exception as exc:
        return {"error": str(exc)}


@router.post("/chat/text-to-speech")
def text_to_speech(text: str, language: str = "english"):
    try:
        audio_url = build_tts_audio(text, language)
        return {"language": language, "text": text, "audio_url": audio_url}
    except Exception as exc:
        return {"error": str(exc)}
