from math import ceil

from sqlalchemy import func

from ..extensions import db
from ..models import Category, News, OptionGroup, OptionValue, PaymentMethod, ProductOptionGroup, SanPham, Store
from ..utils import decimal_to_number, markdown_excerpt, markdown_to_html, read_markdown_file


def product_dict(product: SanPham, include_category: bool = True) -> dict:
    data = product.to_dict()
    if include_category and product.category:
        data["TenCategory"] = product.category.TenCategory
    return data


def get_categories() -> list[dict]:
    rows = Category.query.filter_by(TrangThai=1).order_by(Category.TenCategory.asc()).all()
    return [row.to_dict() for row in rows]


def get_product_by_id(product_id: int) -> SanPham | None:
    return SanPham.query.filter_by(MaSP=product_id, TrangThai=1).first()


def get_product_options(product_id: int) -> list[dict]:
    rows = (
        db.session.query(OptionGroup, OptionValue)
        .join(ProductOptionGroup, ProductOptionGroup.MaOptionGroup == OptionGroup.MaOptionGroup)
        .join(OptionValue, OptionValue.MaOptionGroup == OptionGroup.MaOptionGroup)
        .filter(ProductOptionGroup.MaSP == product_id)
        .order_by(OptionGroup.MaOptionGroup.asc(), OptionValue.MaOptionValue.asc())
        .all()
    )
    return [
        {
            "MaOptionGroup": group.MaOptionGroup,
            "TenNhom": group.TenNhom,
            "IsMultiple": bool(group.IsMultiple),
            "MaOptionValue": option.MaOptionValue,
            "TenGiaTri": option.TenGiaTri,
            "GiaThem": decimal_to_number(option.GiaThem),
            "HinhAnh": option.HinhAnh,
        }
        for group, option in rows
    ]


def get_product_payload(product_id: int) -> dict:
    product = get_product_by_id(product_id)
    if not product:
        raise ValueError("Sản phẩm không tồn tại")

    groups = {}
    for option in get_product_options(product_id):
        group_id = option["MaOptionGroup"]
        groups.setdefault(
            group_id,
            {
                "MaOptionGroup": group_id,
                "TenNhom": option["TenNhom"],
                "IsMultiple": bool(option["IsMultiple"]),
                "options": [],
            },
        )
        groups[group_id]["options"].append(
            {
                "MaOptionValue": option["MaOptionValue"],
                "TenGiaTri": option["TenGiaTri"],
                "GiaThem": decimal_to_number(option["GiaThem"]),
            }
        )

    return {
        "product": {
            "MaSP": product.MaSP,
            "TenSP": product.TenSP,
            "GiaNiemYet": decimal_to_number(product.GiaNiemYet or product.GiaCoBan),
            "GiaCoBan": decimal_to_number(product.GiaCoBan or product.GiaNiemYet),
            "HinhAnh": product.HinhAnh or "assets/img/products/product_one.png",
        },
        "optionGroups": list(groups.values()),
    }


def search_products(keyword: str = "", category_id: int | None = None, page: int = 1, per_page: int = 12):
    query = SanPham.query.join(Category).filter(SanPham.TrangThai == 1)
    if keyword:
        query = query.filter(SanPham.TenSP.like(f"%{keyword}%"))
    if category_id:
        query = query.filter(SanPham.MaCategory == category_id)

    total = query.count()
    items = (
        query.order_by(SanPham.MaSP.desc())
        .limit(per_page)
        .offset((page - 1) * per_page)
        .all()
    )
    return {
        "items": [product_dict(item) for item in items],
        "total": total,
        "total_pages": ceil(total / per_page) if total else 1,
        "page": page,
        "per_page": per_page,
    }


def get_products_by_category(category_id: int | None = None, limit: int | None = None) -> list[dict]:
    query = SanPham.query.join(Category).filter(SanPham.TrangThai == 1)
    if category_id:
        query = query.filter(SanPham.MaCategory == category_id)
    query = query.order_by(SanPham.MaSP.desc())
    if limit:
        query = query.limit(limit)
    return [product_dict(row) for row in query.all()]


def get_best_seller_products(limit: int = 8) -> list[dict]:
    rows = (
        SanPham.query.join(Category)
        .filter(SanPham.TrangThai == 1, SanPham.Rating.isnot(None), SanPham.SoLuotRating > 0)
        .order_by(SanPham.Rating.desc(), SanPham.SoLuotRating.desc())
        .limit(limit)
        .all()
    )
    return [product_dict(row) for row in rows]


def get_toppings() -> list[dict]:
    rows = (
        OptionValue.query.join(OptionGroup)
        .filter(OptionGroup.MaOptionGroup == 3)
        .order_by(OptionValue.MaOptionValue.asc())
        .all()
    )
    return [
        {
            "MaSP": f"topping_{row.MaOptionValue}",
            "TenSP": row.TenGiaTri,
            "GiaCoBan": decimal_to_number(row.GiaThem),
            "HinhAnh": row.HinhAnh or "assets/img/products/topping/topping-tranchau.png",
            "Rating": 4.5,
            "SoLuotRating": 0,
            "MaCategory": 0,
            "TenCategory": "Topping",
            "IsTopping": True,
        }
        for row in rows
    ]


def enrich_cart_options(options: list[dict]) -> list[dict]:
    enriched = []
    for option in options or []:
        option_value_id = int(option.get("option_value_id") or option.get("value_id") or 0)
        if not option_value_id:
            continue
        option_value = OptionValue.query.get(option_value_id)
        if option_value and option_value.group:
            enriched.append(
                {
                    "option_value_id": option_value_id,
                    "value_name": option_value.TenGiaTri,
                    "option_name": option_value.TenGiaTri,
                    "group_name": option_value.group.TenNhom,
                    "IsMultiple": bool(option_value.group.IsMultiple),
                    "price": decimal_to_number(option_value.GiaThem),
                }
            )
        else:
            enriched.append(
                {
                    "option_value_id": option_value_id,
                    "value_name": option.get("value_name", ""),
                    "option_name": option.get("option_name", ""),
                    "group_name": option.get("group_name", ""),
                    "IsMultiple": bool(option.get("IsMultiple", False)),
                    "price": decimal_to_number(option.get("price", 0)),
                }
            )
    return enriched


def search_stores(keyword: str = "", province: str = "", ward: str = "") -> list[dict]:
    query = Store.query.filter(Store.TrangThai == 1)
    if keyword:
        query = query.filter(Store.TenStore.like(f"%{keyword}%"))
    if province:
        query = query.filter(Store.DiaChi.like(f"%{province}%"))
    if ward:
        query = query.filter(Store.DiaChi.like(f"%{ward}%"))
    return [row.to_dict() for row in query.order_by(Store.TenStore.asc()).all()]


def get_payment_methods() -> list[dict]:
    rows = PaymentMethod.query.order_by(PaymentMethod.MaPayment.asc()).all()
    return [row.to_dict() for row in rows]


def get_news(page: int = 1, per_page: int = 6) -> dict:
    query = News.query.filter_by(TrangThai=1).order_by(News.NgayTao.desc())
    total = query.count()
    items = query.limit(per_page).offset((page - 1) * per_page).all()
    data = []
    for item in items:
        row = item.to_dict()
        row["Excerpt"] = markdown_excerpt(read_markdown_file(item.NoiDung))
        data.append(row)
    return {
        "items": data,
        "total": total,
        "total_pages": ceil(total / per_page) if total else 1,
        "page": page,
        "per_page": per_page,
    }


def get_news_detail(news_id: int) -> dict:
    item = News.query.filter_by(MaNews=news_id, TrangThai=1).first()
    if not item:
        raise ValueError("Không tìm thấy tin tức")
    content = read_markdown_file(item.NoiDung)
    row = item.to_dict()
    row["Excerpt"] = markdown_excerpt(content)
    row["ContentHtml"] = markdown_to_html(content)
    return row


def get_home_news(limit: int = 3) -> list[dict]:
    rows = News.query.filter_by(TrangThai=1).order_by(News.NgayTao.desc()).limit(limit).all()
    data = []
    for item in rows:
        row = item.to_dict()
        row["Excerpt"] = markdown_excerpt(read_markdown_file(item.NoiDung), 100)
        data.append(row)
    return data


def count_products() -> int:
    return db.session.query(func.count(SanPham.MaSP)).filter(SanPham.TrangThai == 1).scalar() or 0
