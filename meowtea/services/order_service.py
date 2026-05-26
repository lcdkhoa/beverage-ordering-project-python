import json
from datetime import timedelta
from math import ceil
from random import randint
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

from flask import session
from sqlalchemy import func

from ..clock import local_now
from ..extensions import db
from ..models import Cart, CartItem, OptionGroup, OptionValue, OrderItem, OrderItemOption, Orders, PaymentMethod, Store, User
from ..utils import decimal_to_number, get_full_name
from .cart_service import clear_cart, get_session_cart, recalculate_cart_prices
from .promotion_service import validate_promotion


def _auto_progress_orders():
    now = local_now()
    Orders.query.filter(
        Orders.TrangThai.in_(["Processing", "Order_Received"]),
        Orders.ThoiDiemGiaoHang.isnot(None),
        Orders.ThoiDiemGiaoHang <= now,
    ).update({"TrangThai": "Delivering"}, synchronize_session=False)
    Orders.query.filter(
        Orders.TrangThai == "Delivering",
        Orders.ThoiDiemNhanHang.isnot(None),
        Orders.ThoiDiemNhanHang <= now,
    ).update({"TrangThai": "Completed"}, synchronize_session=False)
    db.session.commit()


def lookup_taxpayer_info(tax_code: str) -> dict:
    normalized_tax_code = "".join((tax_code or "").split())
    if not normalized_tax_code:
        raise ValueError("Vui lòng nhập mã số thuế")

    query = urlencode({"tax": normalized_tax_code})
    url = f"https://mst.minvoice.com.vn/api/System/SearchTaxCode?{query}"

    try:
        with urlopen(url, timeout=10) as response:
            if response.status != 200:
                raise ValueError("Không thể tra cứu mã số thuế lúc này")
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        if exc.code == 404:
            raise ValueError("Không tìm thấy thông tin doanh nghiệp theo mã số thuế này") from exc
        raise ValueError("Không thể tra cứu mã số thuế lúc này") from exc
    except URLError as exc:
        raise ValueError("Không thể kết nối tới dịch vụ tra cứu mã số thuế") from exc
    except (TimeoutError, json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise ValueError("Dữ liệu tra cứu mã số thuế không hợp lệ") from exc

    if not isinstance(payload, dict):
        raise ValueError("Dữ liệu tra cứu mã số thuế không hợp lệ")

    company_name = (payload.get("ten_cty") or "").strip()
    company_address = (payload.get("dia_chi") or "").strip()
    if not company_name or not company_address:
        raise ValueError("Không lấy được đầy đủ tên công ty và địa chỉ công ty")

    return {
        "tax_code": normalized_tax_code,
        "company_name": company_name,
        "company_address": company_address,
        "raw": payload,
    }


def create_order(data: dict) -> dict:
    if not session.get("logged_in"):
        raise ValueError("Bạn cần đăng nhập để đặt hàng")

    user_id = int(session.get("user_id") or 0)
    store_id = int(data.get("store_id") or 0)
    payment_method = int(data.get("payment_method") or 0)
    delivery_address = (data.get("delivery_address") or "").strip()
    promotion_code = (data.get("promotion_code") or "").strip()
    promotion_id = int(data.get("promotion_id") or 0)

    if not store_id:
        raise ValueError("Cửa hàng là bắt buộc")
    if not payment_method:
        raise ValueError("Phương thức thanh toán là bắt buộc")
    if not delivery_address:
        raise ValueError("Địa chỉ giao hàng không được để trống. Vui lòng nhập địa chỉ.")

    cart_items = recalculate_cart_prices()
    if not cart_items:
        raise ValueError("Giỏ hàng trống")

    subtotal = sum(float(item.get("total_price") or 0) for item in cart_items)
    shipping_fee = 30000
    promotion_discount = 0
    promotion_id_for_db = None

    if promotion_code and promotion_id > 0:
        promo = validate_promotion(promotion_code, subtotal)
        if promo["promotion"]["id"] == promotion_id:
            promotion_discount = float(promo["discount"])
            promotion_id_for_db = promotion_id

    total_amount = subtotal + shipping_fee - promotion_discount
    user = User.query.get(user_id)
    if not user:
        raise ValueError("Người dùng không tồn tại")

    order = Orders(
        MaUser=user_id,
        MaStore=store_id,
        MaPayment=payment_method,
        DiaChiGiao=delivery_address,
        NguoiNhan=get_full_name(user.Ho, user.Ten),
        DienThoaiGiao=user.DienThoai or "",
        PhiVanChuyen=shipping_fee,
        MaPromotion=promotion_id_for_db,
        GiamGia=promotion_discount,
        TongTien=total_amount,
        TrangThai="Payment_Received",
        NgayTao=local_now(),
    )
    db.session.add(order)
    db.session.flush()

    for item in cart_items:
        product_id = int(item.get("product_id") or 0)
        if not product_id:
            continue
        order_item = OrderItem(
            MaOrder=order.MaOrder,
            MaSP=product_id,
            SoLuong=int(item.get("quantity") or 1),
            GiaNiemYet=float(item.get("base_price") or 0),
        )
        db.session.add(order_item)
        db.session.flush()
        for option in item.get("options") or []:
            option_value_id = int(option.get("value_id") or option.get("option_value_id") or 0)
            if option_value_id:
                db.session.add(OrderItemOption(MaOrderItem=order_item.MaOrderItem, MaOptionValue=option_value_id, GiaThem=float(option.get("price") or 0)))

    Cart.query.filter_by(MaUser=user_id).delete()
    db.session.commit()
    clear_cart()
    session[f"order_payment_{order.MaOrder}"] = payment_method

    return {
        "order_id": order.MaOrder,
        "order_code": "#" + str(order.MaOrder).zfill(9),
        "total_amount": total_amount,
    }


def list_orders(user_id: int | None, role_name: str, filters: dict) -> dict:
    _auto_progress_orders()

    page = max(1, int(filters.get("page") or 1))
    per_page = min(20, max(1, int(filters.get("per_page") or 10)))
    days = int(filters.get("days") or 30)
    status = (filters.get("status") or "").strip()
    search = (filters.get("search") or "").strip()
    admin_mode = role_name.lower() in {"admin", "staff"} and user_id is None

    query = Orders.query.join(Store)
    if not admin_mode:
        query = query.filter(Orders.MaUser == user_id)
        allowed_days = {7, 30, 90}
    else:
        allowed_days = {1, 7, 30}
        filter_user_id = filters.get("user_id")
        if filter_user_id:
            query = query.filter(Orders.MaUser == int(filter_user_id))

    if days not in allowed_days:
        days = 30
    query = query.filter(Orders.NgayTao >= local_now() - timedelta(days=days))

    status_map = {
        "payment_received": ["Payment_Received", "Pending"],
        "received": ["Payment_Received", "Pending"],
        "processing": ["Processing", "Order_Received"],
        "delivering": ["Delivering"],
        "completed": ["Completed"],
        "cancelled": ["Cancelled", "Store_Cancelled"],
    }
    if status in status_map:
        query = query.filter(Orders.TrangThai.in_(status_map[status]))

    if search:
        clean = search.upper().replace("#", "").replace("MTF", "").lstrip("0")
        if clean.isdigit() and int(clean) > 0:
            query = query.filter(Orders.MaOrder == int(clean))

    total = query.count()
    total_pages = ceil(total / per_page) if total else 1
    page = min(page, total_pages)
    orders = query.order_by(Orders.NgayTao.desc()).limit(per_page).offset((page - 1) * per_page).all()

    data = [_serialize_order(order, include_customer=admin_mode) for order in orders]
    return {"orders": data, "total": total, "total_pages": total_pages, "page": page, "per_page": per_page}


def get_order_detail(order_id: int, user_id: int | None = None, include_customer: bool = False) -> dict:
    _auto_progress_orders()
    if order_id <= 0:
        raise ValueError("Mã đơn hàng không hợp lệ")

    query = Orders.query.join(Store).join(User).filter(Orders.MaOrder == order_id)
    if user_id is not None:
        query = query.filter(Orders.MaUser == user_id)
    order = query.first()
    if not order:
        raise ValueError("Đơn hàng không tồn tại")

    row = _serialize_order(order, include_customer=include_customer)
    row["NgayTaoFormatted"] = order.NgayTao.strftime("%d/%m/%Y %H:%M:%S") if order.NgayTao else ""
    if include_customer and order.user:
        row["Email"] = order.user.Email
        row["DienThoai"] = order.user.DienThoai

    if not row.get("NguoiNhan"):
        row["NguoiNhan"] = row.get("CustomerName") or get_full_name(order.user.Ho, order.user.Ten) if order.user else ""
    if not row.get("DienThoaiGiao") and order.user:
        row["DienThoaiGiao"] = order.user.DienThoai or ""

    payment_id = order.MaPayment or session.get(f"order_payment_{order_id}")
    if payment_id:
        payment = PaymentMethod.query.get(payment_id)
        if payment:
            row["PaymentMethod"] = payment.TenPayment

    items = OrderItem.query.filter_by(MaOrder=order_id).all()
    subtotal = 0
    row["items"] = []
    for item in items:
        item_row = item.to_dict()
        item_row["TenSP"] = item.product.TenSP if item.product else ""
        item_row["HinhAnh"] = item.product.HinhAnh if item.product else None
        item_row["GiaThamKhao"] = decimal_to_number(item.product.GiaCoBan) if item.product else None
        item_row["GiaCoBan"] = decimal_to_number(item.GiaNiemYet)

        options = (
            db.session.query(OrderItemOption, OptionValue, OptionGroup)
            .join(OptionValue, OrderItemOption.MaOptionValue == OptionValue.MaOptionValue)
            .join(OptionGroup, OptionValue.MaOptionGroup == OptionGroup.MaOptionGroup)
            .filter(OrderItemOption.MaOrderItem == item.MaOrderItem)
            .all()
        )
        item_total = float(item.GiaNiemYet or 0) * int(item.SoLuong or 1)
        item_row["options"] = []
        for item_option, option_value, option_group in options:
            price = float(item_option.GiaThem or 0)
            item_row["options"].append(
                {
                    "GiaThem": decimal_to_number(item_option.GiaThem),
                    "TenGiaTri": option_value.TenGiaTri,
                    "TenNhom": option_group.TenNhom,
                }
            )
            item_total += price * int(item.SoLuong or 1)
        item_row["ItemTotal"] = item_total
        subtotal += item_total
        row["items"].append(item_row)

    row["Subtotal"] = subtotal
    for key in ["PhiVanChuyen", "GiamGia", "TongTien"]:
        row[key] = decimal_to_number(row.get(key))
    return row


def _serialize_order(order: Orders, include_customer: bool = False) -> dict:
    row = order.to_dict()
    row["TenStore"] = order.store.TenStore if order.store else None
    row["OrderCode"] = "#MTF" + str(order.MaOrder).zfill(5)
    row["PaymentMethod"] = order.payment.TenPayment if order.payment else "Chưa xác định"
    row["ItemCount"] = db.session.query(func.coalesce(func.sum(OrderItem.SoLuong), 0)).filter(OrderItem.MaOrder == order.MaOrder).scalar() or 0
    row["NgayTaoFormatted"] = order.NgayTao.strftime("%d/%m/%Y") if order.NgayTao else ""
    row["NgayTaoTime"] = order.NgayTao.strftime("%H:%M:%S") if order.NgayTao else ""
    if include_customer and order.user:
        row["Username"] = order.user.Username
        row["Ho"] = order.user.Ho
        row["Ten"] = order.user.Ten
        row["CustomerName"] = get_full_name(order.user.Ho, order.user.Ten) or order.user.Username
    row["ItemCount"] = int(row["ItemCount"])
    for key in ["PhiVanChuyen", "GiamGia", "TongTien"]:
        row[key] = decimal_to_number(row.get(key))
    return row


def update_order_status(order_id: int, action: str) -> dict:
    if action not in {"accept", "cancel"}:
        raise ValueError('Hành động không hợp lệ. Phải là "accept" hoặc "cancel"')

    order = Orders.query.get(order_id)
    if not order:
        raise ValueError("Đơn hàng không tồn tại")
    if order.TrangThai.lower() not in {"payment_received", "pending"}:
        raise ValueError('Chỉ có thể cập nhật trạng thái đơn hàng đang ở trạng thái "Đã nhận thanh toán"')

    now = local_now()
    if action == "accept":
        deliver_at = now + timedelta(minutes=randint(15, 20))
        complete_at = deliver_at + timedelta(minutes=randint(10, 15))
        order.TrangThai = "Processing"
        order.ThoiDiemNhanDon = now
        order.ThoiDiemGiaoHang = deliver_at
        order.ThoiDiemNhanHang = complete_at
        order.ThoiDiemHuyDon = None
        status_text = "Đã nhận đơn"
        new_status = "Processing"
    else:
        order.TrangThai = "Store_Cancelled"
        order.ThoiDiemHuyDon = now
        order.ThoiDiemGiaoHang = None
        order.ThoiDiemNhanHang = None
        order.ThoiDiemNhanDon = None
        status_text = "Đã hủy đơn"
        new_status = "Store_Cancelled"
    db.session.commit()

    response = {"message": f"Cập nhật trạng thái đơn hàng thành công: {status_text}", "new_status": new_status}
    if action == "accept":
        response.update(
            {
                "thoi_diem_nhan_don": order.ThoiDiemNhanDon.strftime("%Y-%m-%d %H:%M:%S"),
                "thoi_diem_giao_hang": order.ThoiDiemGiaoHang.strftime("%Y-%m-%d %H:%M:%S"),
                "thoi_diem_nhan_hang": order.ThoiDiemNhanHang.strftime("%Y-%m-%d %H:%M:%S"),
            }
        )
    else:
        response["thoi_diem_huy_don"] = order.ThoiDiemHuyDon.strftime("%Y-%m-%d %H:%M:%S")
    return response
