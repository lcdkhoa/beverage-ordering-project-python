from functools import wraps

from flask import jsonify, session
from werkzeug.security import check_password_hash, generate_password_hash

try:
    from passlib.hash import bcrypt
except Exception:  # pragma: no cover - optional dependency guard
    bcrypt = None


def hash_password(password: str) -> str:
    return generate_password_hash(password)


def verify_password(password: str, stored_hash: str) -> bool:
    if not stored_hash:
        return False

    if stored_hash.startswith(("scrypt:", "pbkdf2:")):
        return check_password_hash(stored_hash, password)

    if stored_hash.startswith(("$2y$", "$2a$", "$2b$")) and bcrypt is not None:
        normalized = "$2b$" + stored_hash[4:] if stored_hash.startswith("$2y$") else stored_hash
        try:
            return bcrypt.verify(password, normalized)
        except Exception:
            return False

    return password == stored_hash


def current_user() -> dict | None:
    if not session.get("logged_in"):
        return None
    return {
        "id": session.get("user_id"),
        "username": session.get("username"),
        "ho": session.get("user_ho"),
        "ten": session.get("user_ten"),
        "name": session.get("user_name"),
        "gioi_tinh": session.get("user_gioi_tinh"),
        "email": session.get("user_email"),
        "phone": session.get("user_phone"),
        "dia_chi": session.get("user_dia_chi"),
        "role": session.get("user_role"),
        "role_name": session.get("user_role_name"),
    }


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not session.get("logged_in"):
            return jsonify(success=False, message="Bạn cần đăng nhập để thực hiện thao tác này"), 401
        return fn(*args, **kwargs)

    return wrapper


def role_required(*roles: str):
    allowed = {role.lower() for role in roles}

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if not session.get("logged_in"):
                return jsonify(success=False, message="Bạn cần đăng nhập để truy cập"), 401
            role_name = (session.get("user_role_name") or "").lower()
            if role_name not in allowed:
                return jsonify(success=False, message="Bạn không có quyền truy cập trang này"), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator
