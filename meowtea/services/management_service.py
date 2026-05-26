from datetime import datetime
from pathlib import Path
from uuid import uuid4

from flask import current_app
from werkzeug.utils import secure_filename

from ..extensions import db
from ..models import Category, OptionGroup, OptionValue, ProductOptionGroup, ProductOptionValue, Promotion, SanPham
from .catalog_service import product_dict

SUGAR_GROUP_ID = 1
ICE_GROUP_ID = 2
TOPPING_GROUP_ID = 3
DEFAULT_SUGAR_ICE_VALUE_IDS = [1, 2, 3, 4, 5, 6, 7]


def list_products() -> list[dict]:
    products = [
        product_dict(row)
        for row in SanPham.query.join(Category).filter(SanPham.TrangThai == 1).order_by(SanPham.MaSP.desc()).all()
    ]
    summaries = _get_product_option_summaries([product["MaSP"] for product in products])
    for product in products:
        product["optionSummary"] = summaries.get(
            product["MaSP"],
            {"sugar": 0, "ice": 0, "topping": 0},
        )
    return products


def list_categories() -> list[dict]:
    return [row.to_dict() for row in Category.query.filter_by(TrangThai=1).order_by(Category.TenCategory.asc()).all()]


def list_toppings() -> list[dict]:
    rows = OptionValue.query.join(OptionGroup).filter(OptionGroup.MaOptionGroup == 3).order_by(OptionValue.MaOptionValue.asc()).all()
    return [row.to_dict() for row in rows]


def list_option_catalog() -> list[dict]:
    groups = OptionGroup.query.order_by(OptionGroup.MaOptionGroup.asc()).all()
    values = OptionValue.query.order_by(OptionValue.MaOptionGroup.asc(), OptionValue.MaOptionValue.asc()).all()
    values_by_group: dict[int, list[dict]] = {}
    for value in values:
        values_by_group.setdefault(value.MaOptionGroup, []).append(value.to_dict())

    return [
        {
            "MaOptionGroup": group.MaOptionGroup,
            "TenNhom": group.TenNhom,
            "IsMultiple": bool(group.IsMultiple),
            "options": values_by_group.get(group.MaOptionGroup, []),
        }
        for group in groups
    ]


def get_product_options_config(product_id: int) -> dict:
    product = SanPham.query.filter_by(MaSP=product_id, TrangThai=1).first()
    if not product:
        raise ValueError("Sản phẩm không tồn tại")

    selected_ids = [
        row.MaOptionValue
        for row in ProductOptionValue.query.filter_by(MaSP=product_id).order_by(ProductOptionValue.MaOptionValue.asc()).all()
    ]
    return {
        "product": product_dict(product),
        "catalog": list_option_catalog(),
        "selectedOptionValueIds": selected_ids,
        "optionSummary": _get_product_option_summaries([product_id]).get(
            product_id,
            {"sugar": 0, "ice": 0, "topping": 0},
        ),
    }


def set_product_options(product_id: int, option_value_ids: list[int]) -> None:
    product = SanPham.query.filter_by(MaSP=product_id, TrangThai=1).first()
    if not product:
        raise ValueError("Sản phẩm không tồn tại")

    normalized_ids = _normalize_option_value_ids(option_value_ids)
    ProductOptionValue.query.filter_by(MaSP=product_id).delete()
    db.session.add_all(
        [ProductOptionValue(MaSP=product_id, MaOptionValue=option_value_id) for option_value_id in normalized_ids]
    )
    _sync_product_option_groups(product_id, normalized_ids)
    db.session.commit()


def list_promotions() -> list[dict]:
    return [row.to_dict() for row in Promotion.query.order_by(Promotion.MaPromotion.desc()).all()]


def create_product(data: dict, image_file=None) -> SanPham:
    product = SanPham(
        TenSP=(data.get("ten_sp") or "").strip(),
        MaCategory=int(data.get("ma_category") or 0),
        GiaNiemYet=float(data.get("gia_niem_yet") or data.get("price") or 0),
        GiaCoBan=float(data.get("gia_co_ban") or data.get("gia_niem_yet") or data.get("price") or 0),
        HinhAnh=_resolve_product_image(data, image_file),
        TrangThai=1,
    )
    if not product.TenSP or not product.MaCategory:
        raise ValueError("Tên sản phẩm và danh mục là bắt buộc")
    db.session.add(product)
    db.session.flush()

    option_value_ids = _parse_option_value_ids(data)
    if not option_value_ids:
        option_value_ids = list(DEFAULT_SUGAR_ICE_VALUE_IDS)
    set_product_options(product.MaSP, option_value_ids)
    db.session.refresh(product)
    return product


def update_product(product_id: int, data: dict, image_file=None) -> SanPham:
    product = SanPham.query.get(product_id)
    if not product:
        raise ValueError("Sản phẩm không tồn tại")

    product_name = (data.get("ten_sp") or data.get("name") or "").strip()
    if not product_name:
        raise ValueError("Tên sản phẩm là bắt buộc")

    listed_price = float(data.get("gia_niem_yet") or data.get("price") or 0)
    if listed_price < 0:
        raise ValueError("Giá bán không hợp lệ")

    product.TenSP = product_name
    product.GiaNiemYet = listed_price
    product.HinhAnh = _resolve_product_image(data, image_file, current_path=product.HinhAnh)
    db.session.commit()
    return product


def update_product_price(product_id: int, price: float):
    product = SanPham.query.get(product_id)
    if not product:
        raise ValueError("Sản phẩm không tồn tại")
    product.GiaNiemYet = price
    db.session.commit()


def delete_product(product_id: int):
    product = SanPham.query.get(product_id)
    if not product:
        raise ValueError("Sản phẩm không tồn tại")
    product.TrangThai = 0
    db.session.commit()


def create_topping(data: dict) -> OptionValue:
    topping = OptionValue(
        TenGiaTri=(data.get("ten_topping") or data.get("ten_gia_tri") or "").strip(),
        GiaThem=float(data.get("gia_them") or 0),
        HinhAnh=(data.get("hinh_anh") or "").strip() or None,
        MaOptionGroup=3,
    )
    if not topping.TenGiaTri:
        raise ValueError("Tên topping là bắt buộc")
    db.session.add(topping)
    db.session.commit()
    return topping


def update_topping_price(topping_id: int, price: float):
    topping = OptionValue.query.get(topping_id)
    if not topping:
        raise ValueError("Topping không tồn tại")
    topping.GiaThem = price
    db.session.commit()


def delete_topping(topping_id: int):
    topping = OptionValue.query.get(topping_id)
    if not topping:
        raise ValueError("Topping không tồn tại")
    db.session.delete(topping)
    db.session.commit()


def create_promotion(data: dict) -> Promotion:
    promo = Promotion(
        Code=(data.get("code") or "").strip().upper(),
        LoaiGiamGia=data.get("loai_giam_gia") or "Percentage",
        GiaTri=float(data.get("gia_tri") or 0),
        GiaTriToiDa=float(data["gia_tri_toi_da"]) if data.get("gia_tri_toi_da") not in (None, "") else None,
        NgayBatDau=_parse_datetime(data.get("ngay_bat_dau")),
        NgayKetThuc=_parse_datetime(data.get("ngay_ket_thuc")),
        TrangThai=int(data.get("trang_thai") or 1),
    )
    if not promo.Code:
        raise ValueError("Mã khuyến mãi là bắt buộc")
    db.session.add(promo)
    db.session.commit()
    return promo


def update_promotion(promotion_id: int, data: dict):
    promo = Promotion.query.get(promotion_id)
    if not promo:
        raise ValueError("Khuyến mãi không tồn tại")
    promo.Code = (data.get("code") or promo.Code).strip().upper()
    promo.LoaiGiamGia = data.get("loai_giam_gia") or promo.LoaiGiamGia
    promo.GiaTri = float(data.get("gia_tri") or promo.GiaTri)
    if "gia_tri_toi_da" in data:
        promo.GiaTriToiDa = float(data["gia_tri_toi_da"]) if data.get("gia_tri_toi_da") not in (None, "") else None
    promo.NgayBatDau = _parse_datetime(data.get("ngay_bat_dau")) if "ngay_bat_dau" in data else promo.NgayBatDau
    promo.NgayKetThuc = _parse_datetime(data.get("ngay_ket_thuc")) if "ngay_ket_thuc" in data else promo.NgayKetThuc
    if "trang_thai" in data:
        promo.TrangThai = int(data.get("trang_thai") or 0)
    db.session.commit()


def delete_promotion(promotion_id: int):
    promo = Promotion.query.get(promotion_id)
    if not promo:
        raise ValueError("Khuyến mãi không tồn tại")
    promo.TrangThai = 0
    db.session.commit()


def _parse_datetime(value):
    if not value:
        return None
    for fmt in ("%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return None


def _resolve_product_image(data: dict, image_file=None, current_path: str | None = None) -> str | None:
    if image_file and getattr(image_file, "filename", ""):
        return _save_product_image(image_file)

    image_path = (data.get("hinh_anh") or data.get("image") or "").strip()
    if image_path:
        return image_path

    return current_path


def _save_product_image(image_file) -> str:
    original_name = secure_filename(image_file.filename or "")
    extension = Path(original_name).suffix.lower()
    allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    if extension not in allowed_extensions:
        raise ValueError("Chỉ hỗ trợ hình ảnh JPG, PNG, GIF hoặc WEBP")

    upload_dir = Path(current_app.config["PROJECT_ROOT"]) / "assets" / "img" / "products" / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)

    stored_name = f"product-{uuid4().hex}{extension}"
    image_file.save(upload_dir / stored_name)
    return f"assets/img/products/uploads/{stored_name}"


def _parse_option_value_ids(data: dict) -> list[int]:
    raw_values = data.get("option_value_ids") or data.get("option_value_ids[]")
    if raw_values in (None, ""):
        return []

    if isinstance(raw_values, str):
        parts = [part.strip() for part in raw_values.split(",") if part.strip()]
        return [int(part) for part in parts if part.isdigit()]

    if isinstance(raw_values, (list, tuple)):
        return [int(value) for value in raw_values if str(value).isdigit()]

    return []


def _normalize_option_value_ids(option_value_ids: list[int]) -> list[int]:
    if not option_value_ids:
        return []

    rows = OptionValue.query.filter(OptionValue.MaOptionValue.in_(option_value_ids)).all()
    valid_ids = {row.MaOptionValue for row in rows}
    normalized = []
    seen = set()
    for option_value_id in option_value_ids:
        if option_value_id not in valid_ids or option_value_id in seen:
            continue
        seen.add(option_value_id)
        normalized.append(option_value_id)
    return normalized


def _sync_product_option_groups(product_id: int, option_value_ids: list[int]) -> None:
    group_ids = {
        row.MaOptionGroup
        for row in OptionValue.query.filter(OptionValue.MaOptionValue.in_(option_value_ids)).all()
    } if option_value_ids else set()

    ProductOptionGroup.query.filter_by(MaSP=product_id).delete()
    if group_ids:
        db.session.add_all(
            [ProductOptionGroup(MaSP=product_id, MaOptionGroup=group_id) for group_id in sorted(group_ids)]
        )


def _get_product_option_summaries(product_ids: list[int]) -> dict[int, dict[str, int]]:
    if not product_ids:
        return {}

    rows = (
        db.session.query(ProductOptionValue.MaSP, OptionValue.MaOptionGroup, db.func.count(OptionValue.MaOptionValue))
        .join(OptionValue, OptionValue.MaOptionValue == ProductOptionValue.MaOptionValue)
        .filter(ProductOptionValue.MaSP.in_(product_ids))
        .group_by(ProductOptionValue.MaSP, OptionValue.MaOptionGroup)
        .all()
    )

    summaries: dict[int, dict[str, int]] = {
        product_id: {"sugar": 0, "ice": 0, "topping": 0}
        for product_id in product_ids
    }
    group_keys = {
        SUGAR_GROUP_ID: "sugar",
        ICE_GROUP_ID: "ice",
        TOPPING_GROUP_ID: "topping",
    }
    for product_id, group_id, count in rows:
        key = group_keys.get(group_id)
        if key:
            summaries[product_id][key] = int(count)
    return summaries
