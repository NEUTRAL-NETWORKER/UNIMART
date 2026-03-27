import os


def app_env() -> str:
    return os.getenv("APP_ENV", os.getenv("ENVIRONMENT", "development")).strip().lower()


def is_production() -> bool:
    return app_env() in {"prod", "production"}


def is_placeholder(value: str) -> bool:
    if not value:
        return True
    lowered = value.strip().lower()
    bad_markers = [
        "change-this",
        "your_",
        "your-",
        "example",
        "placeholder",
        "super-secret-key-change-this",
    ]
    return any(marker in lowered for marker in bad_markers)


def require_secret(name: str, min_len: int = 32) -> str:
    value = os.getenv(name, "")
    if is_production():
        if is_placeholder(value) or len(value) < min_len:
            raise RuntimeError(
                f"Missing or weak {name}. Set a strong production value (min {min_len} chars)."
            )
    return value
