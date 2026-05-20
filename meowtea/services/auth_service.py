import re

from flask import session
from sqlalchemy import or_

from ..extensions import db
from ..models import Role, User
from ..security import hash_password, verify_password
from ..utils import get_full_name
from .cart_service import merge_cart_with_db, selected_store_id


def _store_user_session(user: User):
    full_name = get_full_name(user.Ho, user.Ten)
    session["user_id"] = user.MaUser
    session["username"] = user.Username
    session["user_ho"] = user.Ho
    session["user_ten"] = user.Ten
    session["user_name"] = full_name
    session["user_gioi_tinh"] = user.GioiTinh
    session["user_email"] = user.Email
    session["user_phone"] = user.DienThoai
    session["user_dia_chi"] = user.DiaChi or ""
    session["user_role"] = user.MaRole
    session["user_role_name"] = user.role.TenRole
    session["logged_in"] = True
    session["user"] = {
        "MaUser": user.MaUser,
        "Username": user.Username,
        "Ho": user.Ho,
        "Ten": user.Ten,
        "Email": user.Email,
        "DienThoai": user.DienThoai,
        "DiaChi": user.DiaChi or "",
        "MaRole": user.MaRole,
        "TenRole": user.role.TenRole,
    }
    session.modified = True


def login(username_or_email: str, password: str) -> dict:
    if not username_or_email:
        raise ValueError("Vui lòng nhập tên đăng nhập hoặc email")
    if not password:
        raise ValueError("Vui lòng nhập mật khẩu")

    user = (
        User.query.join(Role)
        .filter(or_(User.Username == username_or_email, User.Email == username_or_email), User.TrangThai == 1)
        .first()
    )
    if not user or not verify_password(password, user.Password):
        raise ValueError("Tên đăng nhập/email hoặc mật khẩu không đúng")

    _store_user_session(user)
    merge_cart_with_db(user.MaUser, selected_store_id())

    return {
        "id": user.MaUser,
        "username": user.Username,
        "ho": user.Ho,
        "ten": user.Ten,
        "name": get_full_name(user.Ho, user.Ten),
        "gioi_tinh": user.GioiTinh,
        "email": user.Email,
        "phone": user.DienThoai,
        "dia_chi": user.DiaChi or "",
        "role": user.role.TenRole,
    }


def register_user(data: dict) -> dict:
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    ho = (data.get("ho") or "").strip()
    ten = (data.get("ten") or "").strip()
    email = (data.get("email") or "").strip()
    phone = (data.get("dien_thoai") or data.get("phone") or "").strip()
    gender = (data.get("gioi_tinh") or data.get("gender") or "O").strip()
    address = (data.get("dia_chi") or data.get("address") or "").strip()

    if not all([username, password, ho, ten]):
        raise ValueError("Vui lòng nhập đầy đủ thông tin bắt buộc")
    if User.query.filter(User.Username == username).first():
        raise ValueError("Tên đăng nhập đã tồn tại")
    if email and User.query.filter(User.Email == email).first():
        raise ValueError("Email đã được sử dụng")

    customer_role = Role.query.filter_by(TenRole="Customer").first()
    if not customer_role:
        raise ValueError("Không tìm thấy vai trò Customer")

    user = User(
        Username=username,
        Password=hash_password(password),
        Ho=ho,
        Ten=ten,
        GioiTinh=gender,
        DienThoai=phone,
        Email=email,
        DiaChi=address,
        TrangThai=1,
        MaRole=customer_role.MaRole,
    )
    db.session.add(user)
    db.session.commit()
    return {"id": user.MaUser, "username": user.Username}


def update_profile(user_id: int, data: dict) -> dict:
    user = User.query.filter_by(MaUser=user_id, TrangThai=1).first()
    if not user:
        raise ValueError("Không tìm thấy người dùng")

    gender = _optional_str(data, "gioi_tinh")
    email = _optional_str(data, "email")
    phone = _optional_str(data, "dien_thoai", "phone")
    address = _optional_str(data, "dia_chi", "address")

    if gender is not None and gender and gender not in {"M", "F", "O"}:
        raise ValueError("Giới tính không hợp lệ")
    if email is not None and email:
        if len(email) > 100:
            raise ValueError("Email không được vượt quá 100 ký tự")
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
            raise ValueError("Email không hợp lệ")
        exists = User.query.filter(User.Email == email, User.MaUser != user_id).first()
        if exists:
            raise ValueError("Email đã được sử dụng. Vui lòng sử dụng email khác")
    if phone is not None and phone:
        if len(phone) > 20:
            raise ValueError("Số điện thoại không được vượt quá 20 ký tự")
        if not re.match(r"^[0-9+\-\s()]+$", phone):
            raise ValueError("Số điện thoại không hợp lệ")
        exists = User.query.filter(User.DienThoai == phone, User.MaUser != user_id).first()
        if exists:
            raise ValueError("Số điện thoại đã được sử dụng. Vui lòng sử dụng số khác")
    if address is not None and address and len(address) > 500:
        raise ValueError("Địa chỉ không được vượt quá 500 ký tự")

    changed = False
    if gender is not None:
        user.GioiTinh = gender or None
        changed = True
    if email is not None:
        user.Email = email or None
        changed = True
    if phone is not None:
        user.DienThoai = phone or None
        changed = True
    if address is not None and (user.role and user.role.TenRole.lower() == "customer"):
        user.DiaChi = address or None
        changed = True

    if not changed:
        raise ValueError("Không có thông tin nào để cập nhật")

    db.session.commit()
    _store_user_session(user)
    return {
        "gioi_tinh": user.GioiTinh,
        "email": user.Email or "",
        "phone": user.DienThoai or "",
        "dia_chi": user.DiaChi or "",
    }


def change_password(user_id: int, data: dict) -> None:
    current_password = data.get("current_password") or ""
    new_password = data.get("new_password") or ""
    confirm_password = data.get("confirm_password") or ""

    if not current_password:
        raise ValueError("Vui lòng nhập mật khẩu hiện tại")
    if not new_password:
        raise ValueError("Vui lòng nhập mật khẩu mới")
    if len(new_password) < 6:
        raise ValueError("Mật khẩu mới phải có ít nhất 6 ký tự")
    if new_password != confirm_password:
        raise ValueError("Mật khẩu xác nhận không khớp")
    if current_password == new_password:
        raise ValueError("Mật khẩu mới phải khác mật khẩu hiện tại")

    user = User.query.filter_by(MaUser=user_id, TrangThai=1).first()
    if not user:
        raise ValueError("Không tìm thấy người dùng")
    if not verify_password(current_password, user.Password):
        raise ValueError("Mật khẩu hiện tại không đúng")

    user.Password = hash_password(new_password)
    db.session.commit()


def logout():
    session.clear()


def _optional_str(data: dict, *keys: str) -> str | None:
    for key in keys:
        if key in data:
            return (data.get(key) or "").strip()
    return None
