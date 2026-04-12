# Velora API

This is a FastAPI backend scaffold for the Velora project using MongoDB.

## What it includes

- JWT-based signup/login auth for students
- MongoDB user storage with unique email/username indexes
- Password hashing (PBKDF2) + JWT bearer access tokens
- Code execution API (Judge0)
- AI code evaluation + multilingual coding mentor chat (DeepSeek-compatible OpenAI client)
- PDF certificate generation with static certificate hosting

## Folder structure

- [app/main.py](C:\Users\Omkar Patil\OneDrive\Documents\velora_db\api\app\main.py): FastAPI entrypoint
- [app/mongo_api.py](C:\Users\Omkar Patil\OneDrive\Documents\velora_db\api\app\mongo_api.py): MongoDB-backed FastAPI routes
- [app/schemas.py](C:\Users\Omkar Patil\OneDrive\Documents\velora_db\api\app\schemas.py): request and response models
- [app/db.py](C:\Users\Omkar Patil\OneDrive\Documents\velora_db\api\app\db.py): MongoDB connection helpers and indexes
- [app/config.py](C:\Users\Omkar Patil\OneDrive\Documents\velora_db\api\app\config.py): environment-based configuration
- [app/security.py](C:\Users\Omkar Patil\OneDrive\Documents\velora_db\api\app\security.py): password hashing and JWT helpers
- [app/routes](C:\Users\Omkar Patil\OneDrive\Documents\velora_db\api\app\routes): extra feature routers (code runner, AI, chat, certificate)
- [app/services](C:\Users\Omkar Patil\OneDrive\Documents\velora_db\api\app\services): backend services (certificate generation)
- [assets](C:\Users\Omkar Patil\OneDrive\Documents\velora_db\api\assets): certificate design assets
- [certificates](C:\Users\Omkar Patil\OneDrive\Documents\velora_db\api\certificates): generated certificate files
- [requirements.txt](C:\Users\Omkar Patil\OneDrive\Documents\velora_db\api\requirements.txt): Python dependencies
- [.env.example](C:\Users\Omkar Patil\OneDrive\Documents\velora_db\api\.env.example): sample environment variables

## Setup

1. Install Python 3.11+ and MongoDB Community Server.
2. Start MongoDB locally so it is available at `mongodb://localhost:27017`.
3. In the `api` folder, create a virtual environment and install dependencies:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

4. Copy `.env.example` to `.env` and update `MONGO_URL` and `MONGO_DB_NAME`.
5. Add `DEEPSEEK_API_KEY` in `.env` to enable AI chat/evaluation endpoints.
6. Run the server:

```powershell
uvicorn app.main:app --reload
```

6. Open:

- `http://127.0.0.1:8000/docs` for Swagger UI
- `http://127.0.0.1:8000/redoc` for ReDoc

## Main APIs

- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me`
- `POST /run-code`
- `POST /evaluate-code`
- `POST /chat`
- `POST /generate-certificate`
- `GET /certificates/{file_name}`

## Notes

- Signup stores hashed passwords (PBKDF2), and login issues JWT bearer tokens.
- Set a strong `JWT_SECRET_KEY` in `.env` before deployment.
- Branch values: `CS`, `IT`, `ENTC`, `Mechanical`
- Year values: `1st`, `2nd`, `3rd`, `4th`
- `/run-code` and `/evaluate-code` use Judge0 (internet required).
- `/chat` and `/evaluate-code` AI explanation need `DEEPSEEK_API_KEY`.
