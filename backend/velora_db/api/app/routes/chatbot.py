from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from openai import OpenAI
from pydantic import BaseModel, Field

from app.config import settings
from app.db import get_collection
from app.security import decode_access_token


router = APIRouter(tags=["chat"])
bearer_scheme = HTTPBearer(auto_error=False)

SYSTEM_PROMPT = """
You are Code Sage, a friendly coding mentor.
Reply in the user's selected language script.
Keep technical terms like Python, loop, function, variable in English.

Style requirements for polished output:
- Start with one-line summary.
- Then give 2-5 short actionable steps.
- If helpful, add a tiny code snippet.
- Keep response concise and easy to read.
- Do not use markdown tables.
- Do not add unnecessary fluff.
- If you provide code, keep all identifiers in English only.
- Use English for variable names, function names, class names, and dictionary keys.
- Keep code comments in English.
""".strip()


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    language: str = Field(min_length=2, max_length=20)
    session_id: str = Field(min_length=6, max_length=64)


class ChatSessionStartOut(BaseModel):
    session_id: str


def _now() -> datetime:
    return datetime.now(timezone.utc)


def get_current_student(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing access token")
    payload = decode_access_token(credentials.credentials)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired access token")
    student = get_collection("students").find_one({"user_id": payload["sub"], "role": "student", "is_active": True})
    if not student:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return student


@router.post("/chat/session/start", response_model=ChatSessionStartOut)
def start_chat_session(student: dict = Depends(get_current_student)):
    user_id = student["user_id"]
    # Requirement: when a new conversation starts, clear old chats.
    get_collection("chat_messages").delete_many({"user_id": user_id})
    get_collection("chat_sessions").delete_many({"user_id": user_id})

    session_id = str(uuid4())
    get_collection("chat_sessions").insert_one(
        {
            "session_id": session_id,
            "user_id": user_id,
            "created_at": _now(),
            "updated_at": _now(),
        }
    )
    return {"session_id": session_id}


@router.get("/chat/history")
def get_chat_history(
    session_id: str = Query(..., min_length=6, max_length=64),
    student: dict = Depends(get_current_student),
):
    user_id = student["user_id"]
    docs = (
        get_collection("chat_messages")
        .find({"user_id": user_id, "session_id": session_id}, {"_id": 0, "role": 1, "content": 1, "created_at": 1})
        .sort("created_at", 1)
    )
    return {"session_id": session_id, "messages": list(docs)}


@router.post("/chat/session/end")
def end_chat_session(
    session_id: str = Query(..., min_length=6, max_length=64),
    student: dict = Depends(get_current_student),
):
    user_id = student["user_id"]
    # Requirement: once conversation ends, remove previous chats.
    get_collection("chat_messages").delete_many({"user_id": user_id})
    get_collection("chat_sessions").delete_many({"user_id": user_id})
    return {"message": "Conversation ended and chat history cleared.", "session_id": session_id}


@router.post("/chat")
def chat_with_ai(payload: ChatRequest, student: dict = Depends(get_current_student)):
    if not settings.deepseek_api_key:
        raise HTTPException(status_code=400, detail="Set DEEPSEEK_API_KEY in .env first.")

    try:
        client = OpenAI(api_key=settings.deepseek_api_key, base_url="https://api.deepseek.com")
        allowed_languages = {"English", "Hindi", "Marathi", "Tamil", "Telugu", "Kannada", "Malayalam"}
        language = payload.language if payload.language in allowed_languages else "English"
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Chat provider init failed: {exc}") from exc

    # Auth + history context
    user_id = student["user_id"]

    session_doc = get_collection("chat_sessions").find_one({"session_id": payload.session_id, "user_id": user_id})
    if not session_doc:
        raise HTTPException(status_code=404, detail="Chat session not found. Start a new session first.")

    history_docs = list(
        get_collection("chat_messages")
        .find({"user_id": user_id, "session_id": payload.session_id}, {"_id": 0, "role": 1, "content": 1})
        .sort("created_at", 1)
        .limit(20)
    )

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for item in history_docs:
        role = item.get("role")
        content = item.get("content")
        if role in {"user", "assistant"} and content:
            messages.append({"role": role, "content": content})

    messages.append(
        {
            "role": "user",
            "content": (
                f"Selected language: {language}\n"
                "Reply ONLY in selected language script. Do not mix scripts.\n"
                "Important code rule: if you provide code, all identifiers must be in English only.\n"
                "Never translate variable/function/class names.\n"
                "Output format:\n"
                "Summary: <one line>\n"
                "Steps:\n"
                "1) ...\n"
                "2) ...\n"
                "3) ... (optional)\n"
                "Code (optional):\n"
                "<small snippet only when useful>\n\n"
                f"User message:\n{payload.message}"
            ),
        }
    )

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=messages,
            temperature=0.4,
        )
        reply = (response.choices[0].message.content or "").strip()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Chat provider error: {exc}") from exc

    get_collection("chat_messages").insert_many(
        [
            {
                "user_id": user_id,
                "session_id": payload.session_id,
                "role": "user",
                "content": payload.message,
                "language": language,
                "created_at": _now(),
            },
            {
                "user_id": user_id,
                "session_id": payload.session_id,
                "role": "assistant",
                "content": reply,
                "language": language,
                "created_at": _now(),
            },
        ]
    )
    get_collection("chat_sessions").update_one(
        {"user_id": user_id, "session_id": payload.session_id},
        {"$set": {"updated_at": _now()}},
    )

    return {"bot_name": "Code Sage", "language": language, "reply": reply}
