from ..clock import local_now
from ..models import Promotion
from ..utils import decimal_to_number


def validate_promotion(code: str, subtotal: float) -> dict:
    if not code:
        raise ValueError("Vui lòng nhập mã khuyến mãi")
    if subtotal <= 0:
        raise ValueError("Giá trị đơn hàng không hợp lệ")

    promotion = Promotion.query.filter_by(Code=code, TrangThai=1).first()
    if not promotion:
        raise ValueError("Mã khuyến mãi không tồn tại hoặc đã bị vô hiệu hóa")

    now = local_now()
    if promotion.NgayBatDau and now < promotion.NgayBatDau:
        raise ValueError("Mã khuyến mãi chưa có hiệu lực")
    if promotion.NgayKetThuc and now > promotion.NgayKetThuc:
        raise ValueError("Mã khuyến mãi đã hết hạn")

    discount_type = promotion.LoaiGiamGia or "Percentage"
    value = float(promotion.GiaTri or 0)
    max_value = float(promotion.GiaTriToiDa) if promotion.GiaTriToiDa is not None else None

    if discount_type == "Percentage":
        discount = subtotal * value / 100
        if max_value is not None and max_value > 0 and discount > max_value:
            discount = max_value
        if discount > subtotal:
            discount = subtotal
    else:
        discount = min(value, subtotal)

    return {
        "discount": discount,
        "promotion": {
            "id": promotion.MaPromotion,
            "code": promotion.Code,
            "loai_giam_gia": discount_type,
            "gia_tri": decimal_to_number(promotion.GiaTri),
            "discount_amount": discount,
        },
    }
