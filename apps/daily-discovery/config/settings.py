"""Environment-backed application settings."""

from dataclasses import dataclass
from pathlib import Path
import os
import secrets

from dotenv import load_dotenv


PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")
_LOCAL_JWT_KEY = secrets.token_urlsafe(48)
_LEGACY_KEY = "dev-secret-key-change-me-in-production"


def _as_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    database_url: str
    app_timezone: str
    daily_notification_enabled: bool
    nasa_api_key: str
    backend_host: str
    backend_port: int
    cors_origins: list[str]
    auth_mode: str
    jwt_secret_key: str
    jwt_algorithm: str
    access_token_expire_minutes: int
    refresh_token_expire_days: int


def _as_list(value: str | None, default: list[str] | None = None) -> list[str]:
    if value is None:
        return default or []
    return [entry.strip() for entry in value.split(",") if entry.strip()]


def get_settings() -> Settings:
    """Load settings from the environment, with safe local defaults."""

    default_database_url = "sqlite:///:memory:" if "PYTEST_CURRENT_TEST" in os.environ else "sqlite:///./data/daily_discovery.db"
    auth_mode = os.getenv("AUTH_MODE", "local").strip().lower()
    if auth_mode not in {"local", "authenticated"}:
        raise ValueError("AUTH_MODE must be local or authenticated")
    key = os.getenv("JWT_SECRET_KEY", "").strip()
    if auth_mode == "authenticated" and (len(key) < 32 or key == _LEGACY_KEY):
        raise ValueError("Authenticated mode requires a unique JWT_SECRET_KEY of at least 32 characters")
    if not key or key == _LEGACY_KEY:
        key = _LOCAL_JWT_KEY
    if os.getenv("JWT_ALGORITHM", "HS256") != "HS256":
        raise ValueError("Only HS256 is supported")
    return Settings(
        database_url=os.getenv("DATABASE_URL", default_database_url),
        app_timezone=os.getenv("APP_TIMEZONE", "UTC"),
        daily_notification_enabled=_as_bool(
            os.getenv("DAILY_NOTIFICATION_ENABLED")
        ),
        nasa_api_key=os.getenv("NASA_API_KEY", "DEMO_KEY"),
        backend_host=os.getenv("BACKEND_HOST", "127.0.0.1"),
        backend_port=int(os.getenv("BACKEND_PORT", "8000")),
        cors_origins=_as_list(
            os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
        ),
        auth_mode=auth_mode,
        jwt_secret_key=key,
        jwt_algorithm="HS256",
        access_token_expire_minutes=int(
            os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
        ),
        refresh_token_expire_days=int(
            os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30")
        ),
    )