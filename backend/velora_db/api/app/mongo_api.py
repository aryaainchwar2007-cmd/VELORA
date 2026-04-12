from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.db import get_collection, init_indexes
from app.routes.ai_runner import router as ai_runner_router
from app.routes.certificate import router as certificate_router
from app.routes.chatbot import router as chatbot_router
from app.routes.code_runner import router as code_runner_router
from app.routes.lessons import router as lessons_router
from app.routes.practice_problems import router as practice_problems_router
from app.routes.speech import router as speech_router
from app.routes.legacy_ai_runner import router as legacy_ai_runner_router
from app.routes.legacy_certificate import router as legacy_certificate_router
from app.routes.legacy_chatbot import router as legacy_chatbot_router
from app.routes.legacy_code_runner import router as legacy_code_runner_router
from app.routes.legacy_live_interview import router as legacy_live_interview_router
from app.schemas import AuthResponseOut, AuthStudentOut, AuthTokenOut, LoginIn, SignupIn
from app.security import create_access_token, decode_access_token, hash_password, verify_password

app = FastAPI(title=settings.app_name, version="2.0.0")
bearer_scheme = HTTPBearer(auto_error=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parents[1]
CERTIFICATES_DIR = BASE_DIR / "certificates"
CERTIFICATES_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/certificates", StaticFiles(directory=str(CERTIFICATES_DIR)), name="certificates")
LEGACY_AUDIO_DIR = BASE_DIR / "audio"
LEGACY_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/audio", StaticFiles(directory=str(LEGACY_AUDIO_DIR)), name="audio")

app.include_router(certificate_router)
app.include_router(code_runner_router)
app.include_router(ai_runner_router)
app.include_router(chatbot_router)
app.include_router(lessons_router)
app.include_router(practice_problems_router)
app.include_router(speech_router)
app.include_router(legacy_certificate_router, prefix="/legacy")
app.include_router(legacy_code_runner_router, prefix="/legacy")
app.include_router(legacy_ai_runner_router, prefix="/legacy")
app.include_router(legacy_chatbot_router, prefix="/legacy")
app.include_router(legacy_live_interview_router, prefix="/legacy")


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return str(uuid4())


def serialize_auth_user(student: dict) -> AuthStudentOut:
    return AuthStudentOut(
        user_id=student["user_id"],
        email=student["email"],
        full_name=student["full_name"],
        username=student["username"],
        branch=student["branch"],
        year=student["year"],
        role=student.get("role", "student"),
        created_at=student["created_at"],
    )


def build_auth_response(student: dict) -> AuthResponseOut:
    token_value = create_access_token(student["user_id"])
    return AuthResponseOut(
        token=AuthTokenOut(
            access_token=token_value,
            expires_in_seconds=settings.access_token_expire_minutes * 60,
        ),
        user=serialize_auth_user(student),
    )


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


@app.on_event("startup")
def on_startup() -> None:
    init_indexes()


@app.post("/auth/signup", response_model=AuthResponseOut, status_code=201)
def signup(payload: SignupIn):
    students = get_collection("students")
    email = payload.email.strip().lower()
    username = payload.username.strip().lower()

    if students.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="Email already registered")
    if students.find_one({"username": username}):
        raise HTTPException(status_code=409, detail="Username already taken")

    student = {
        "user_id": new_id(),
        "email": email,
        "full_name": payload.full_name.strip(),
        "username": username,
        "password_hash": hash_password(payload.password),
        "branch": payload.branch,
        "year": payload.year,
        "role": "student",
        "is_active": True,
        "created_at": now_utc(),
        "updated_at": now_utc(),
    }
    students.insert_one(student)
    return build_auth_response(student)


@app.post("/auth/login", response_model=AuthResponseOut)
def login(payload: LoginIn):
    students = get_collection("students")
    identifier = payload.identifier.strip().lower()
    student = students.find_one({"$or": [{"email": identifier}, {"username": identifier}], "role": "student"})
    if not student:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email/username or password")

    password_hash = student.get("password_hash")
    if not password_hash or not verify_password(payload.password, password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email/username or password")

    if not student.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")

    students.update_one({"user_id": student["user_id"]}, {"$set": {"updated_at": now_utc()}})
    return build_auth_response(student)


@app.get("/auth/me", response_model=AuthStudentOut)
def auth_me(student: dict = Depends(get_current_student)):
    return serialize_auth_user(student)
