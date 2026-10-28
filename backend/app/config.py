import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    # CockroachDB Connection
    DATABASE_URL: str = Field(..., description="PostgreSQL wire-compatible connection string")
    DATABASE_SSLROOTCERT: str = Field(..., description="Path to SSL root certificate")

    # AI Agent Provider Config
    LLM_PROVIDER: str = "auto"  # auto | gemini | groq
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GROQ_MODEL: str = "qwen/qwen3.8-27b"

    # Server Configuration
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:8080,http://127.0.0.1:5173"

    # Security & Auth
    JWT_SECRET_KEY: str = Field(..., description="Secret key for JWT generation")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Rate Limiting & Spend Cap
    RATE_LIMIT_PER_MINUTE: int = 20
    DAILY_TOKEN_BUDGET: int = 250000
    MONTHLY_SPEND_CAP_USD: float = 50.00

    # Redis swap flag
    REDIS_ENABLED: bool = False
    REDIS_URL: str = "redis://localhost:6379/0"

    model_config = SettingsConfigDict(
        env_file=os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.env")),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

settings = Settings()

# Startup assertion ensuring required credentials exist
if not settings.DATABASE_URL:
    raise RuntimeError("FATAL: DATABASE_URL is missing from environment. Application cannot start.")
