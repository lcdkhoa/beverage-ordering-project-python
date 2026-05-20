from pathlib import Path


PACKAGE_DIR = Path(__file__).resolve().parent
MIGRATION_DIR = PACKAGE_DIR.parent
PROJECT_ROOT = MIGRATION_DIR.parent
INSTANCE_DIR = MIGRATION_DIR / "instance"


class Config:
    SECRET_KEY = "dev-change-me"
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{INSTANCE_DIR / 'meowtea.sqlite3'}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_AS_ASCII = False
    PROJECT_ROOT = PROJECT_ROOT
