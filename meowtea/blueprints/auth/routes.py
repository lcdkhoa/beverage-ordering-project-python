from flask import Blueprint, jsonify, request

from ...models import User
from ...security import current_user, login_required, role_required
from ...services.auth_service import change_password, login, logout, register_user, update_profile

bp = Blueprint("auth", __name__)


@bp.post("/login")
@bp.post("/login.php")
def login_route():
    try:
        user = login(request.form.get("username_or_email", "").strip(), request.form.get("password", ""))
        return jsonify(success=True, message="Đăng nhập thành công", user=user)
    except Exception as exc:
        return jsonify(success=False, message=str(exc))


@bp.post("/register")
@bp.post("/register.php")
def register_route():
    try:
        user = register_user(request.form.to_dict())
        return jsonify(success=True, message="Đăng ký thành công", user=user)
    except Exception as exc:
        return jsonify(success=False, message=str(exc))


@bp.route("/logout", methods=["GET", "POST"])
@bp.route("/logout.php", methods=["GET", "POST"])
def logout_route():
    logout()
    return jsonify(success=True, message="Đăng xuất thành công")


@bp.get("/me")
@login_required
def me_route():
    return jsonify(success=True, user=current_user())


@bp.post("/update-profile")
@bp.post("/update-profile.php")
@login_required
def update_profile_route():
    try:
        user = current_user()
        updated = update_profile(int(user["id"]), request.form.to_dict())
        return jsonify(success=True, message="Cập nhật thông tin thành công!", user=updated)
    except Exception as exc:
        return jsonify(success=False, message=str(exc))


@bp.post("/change-password")
@bp.post("/change-password.php")
@login_required
def change_password_route():
    try:
        user = current_user()
        change_password(int(user["id"]), request.form.to_dict())
        return jsonify(success=True, message="Đổi mật khẩu thành công!")
    except Exception as exc:
        return jsonify(success=False, message=str(exc))


@bp.get("/get-users")
@bp.get("/get-users.php")
@role_required("Admin", "Staff")
def get_users_route():
    users = User.query.filter(User.TrangThai == 1).order_by(User.MaUser.asc()).all()
    data = []
    for user in users:
        row = user.to_dict()
        row["TenRole"] = user.role.TenRole if user.role else None
        data.append(row)
    return jsonify(success=True, data=data, message="Lấy danh sách người dùng thành công")
