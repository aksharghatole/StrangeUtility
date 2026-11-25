from config.settings import get_settings


def test_settings_use_environment_values(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "sqlite:///:memory:")
    monkeypatch.setenv("APP_TIMEZONE", "America/New_York")
    monkeypatch.setenv("DAILY_NOTIFICATION_ENABLED", "true")

    settings = get_settings()

    assert settings.database_url == "sqlite:///:memory:"
    assert settings.app_timezone == "America/New_York"
    assert settings.daily_notification_enabled is True

def test_authenticated_mode_requires_strong_configured_secret(monkeypatch):
    import pytest
    monkeypatch.setenv("AUTH_MODE", "authenticated")
    for secret in ("", "short", "dev-secret-key-change-me-in-production"):
        monkeypatch.setenv("JWT_SECRET_KEY", secret)
        with pytest.raises(ValueError, match="JWT_SECRET_KEY"):
            get_settings()
    monkeypatch.setenv("JWT_SECRET_KEY", "test-only-" + "a" * 48)
    assert get_settings().auth_mode == "authenticated"


def test_local_default_key_is_nonlegacy_and_stable_in_process(monkeypatch):
    monkeypatch.setenv("AUTH_MODE", "local")
    monkeypatch.setenv("JWT_SECRET_KEY", "")
    first = get_settings()
    monkeypatch.delenv("BACKEND_HOST", raising=False)
    assert get_settings().backend_host == "127.0.0.1"
    assert len(first.jwt_secret_key) >= 32
    assert first.jwt_secret_key == get_settings().jwt_secret_key
    assert first.jwt_secret_key != "dev-secret-key-change-me-in-production"
