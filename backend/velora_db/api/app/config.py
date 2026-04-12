from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "Velora API"
    app_env: str = "development"
    mongo_url: str
    mongo_db_name: str = "velora"
    jwt_secret_key: str = Field(default="change-me-in-production")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    deepseek_api_key: str | None = None
    openai_api_key: str | None = None
    judge0_url: str = "https://ce.judge0.com/submissions?base64_encoded=false&wait=true"


settings = Settings()
