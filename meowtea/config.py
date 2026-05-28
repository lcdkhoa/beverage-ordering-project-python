import os
from pathlib import Path


PACKAGE_DIR = Path(__file__).resolve().parent
MIGRATION_DIR = PACKAGE_DIR.parent
PROJECT_ROOT = PACKAGE_DIR


def _load_env_file():
    env_path = MIGRATION_DIR / ".env"
    try:
        from dotenv import load_dotenv
    except ImportError:
        if not env_path.exists():
            return
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip("'\""))
        return

    load_dotenv(env_path)


def _database_uri() -> str:
    uri = os.getenv("DATABASE_URL", "").strip()
    if not uri:
        raise RuntimeError("DATABASE_URL is required. Configure the Supabase Postgres connection string in .env.")

    if uri.startswith("postgres://"):
        return uri.replace("postgres://", "postgresql+psycopg://", 1)
    if uri.startswith("postgresql://"):
        return uri.replace("postgresql://", "postgresql+psycopg://", 1)
    return uri


_load_env_file()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-change-me")
    SQLALCHEMY_DATABASE_URI = _database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}
    JSON_AS_ASCII = False
    PROJECT_ROOT = PROJECT_ROOT
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
