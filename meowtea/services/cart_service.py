from flask import session

from ..clock import local_now
from ..extensions import db
from ..models import Cart, CartItem, CartItemOption, OptionGroup, OptionValue, ProductOptionGroup, SanPham
from ..utils import decimal_to_number
from .catalog_service import get_product_by_id


def get_session_cart() -> list[dict]:
    return session.setdefault("cart", [])


def cart_count() -> int:
    return sum(int(item.get("quantity", 0)) for item in get_session_cart())


def add_to_cart(data: dict) -> dict:
    product_id = int(data.get("product_id") or 0)
    quantity = max(1, int(data.get("quantity") or 1))
    if not product_id:
        raise ValueError("Mã sản phẩm là bắt buộc")

    product = get_product_by_id(product_id)
    if not product:
        raise ValueError("Sản phẩm không tồn tại")

    options = _normalize_cart_options(product_id, data.get("options") or [])
    base_price = float(product.GiaNiemYet or product.GiaCoBan or 0)
    unit_price = base_price + sum(float(option.get("price") or 0) for option in options)
    total_price = unit_price * quantity
    cart_item = {
        "product_id": product_id,
        "product_name": product.TenSP,
        "product_image": product.HinhAnh or "assets/img/products/product_one.png",
        "quantity": quantity,
        "base_price": base_price,
        "total_price": total_price,
        "reference_price": decimal_to_number(product.GiaCoBan),
        "options": options,
        "note": (data.get("note") or "").strip(),
        "added_at": local_now().strftime("%Y-%m-%d %H:%M:%S"),
    }

    cart = get_session_cart()
    cart.append(cart_item)
    session["cart"] = cart
    session.modified = True

    if session.get("user", {}).get("MaUser"):
        save_cart_to_db(session["user"]["MaUser"], selected_store_id())

    return cart_item


def update_cart_item(index: int, quantity: int | None = None, note: str | None = None) -> None:
    cart = get_session_cart()
    if index < 0 or index >= len(cart):
        raise ValueError("Sản phẩm trong giỏ hàng không tồn tại")
    cart[index] = _recalculate_cart_item(cart[index])
    if quantity is not None:
        cart[index]["quantity"] = max(1, int(quantity))
    if note is not None:
        cart[index]["note"] = note[:52]
    unit_price = float(cart[index].get("base_price") or 0) + sum(float(option.get("price") or 0) for option in cart[index].get("options", []))
    cart[index]["total_price"] = unit_price * int(cart[index].get("quantity") or 1)
    session["cart"] = cart
    session.modified = True
    if session.get("user", {}).get("MaUser"):
        save_cart_to_db(session["user"]["MaUser"], selected_store_id())


def delete_cart_item(index: int) -> None:
    cart = get_session_cart()
    if index < 0 or index >= len(cart):
        raise ValueError("Sản phẩm trong giỏ hàng không tồn tại")
    cart.pop(index)
    session["cart"] = cart
    session.modified = True
    if session.get("user", {}).get("MaUser"):
        save_cart_to_db(session["user"]["MaUser"], selected_store_id())


def clear_cart() -> None:
    session["cart"] = []
    session.modified = True


def save_cart_to_db(user_id: int, store_id: int) -> bool:
    cart_items = recalculate_cart_prices()
    if not cart_items:
        return True

    cart = Cart.query.filter_by(MaUser=user_id, MaStore=store_id).first()
    if cart:
        CartItem.query.filter_by(MaCart=cart.MaCart).delete()
    else:
        cart = Cart(MaUser=user_id, MaStore=store_id, NgayTao=local_now())
        db.session.add(cart)
        db.session.flush()

    for item in cart_items:
        cart_item = CartItem(
            MaCart=cart.MaCart,
            MaSP=int(item["product_id"]),
            SoLuong=int(item.get("quantity") or 1),
            GiaNiemYet=float(item.get("base_price") or 0),
            GhiChu=item.get("note") or None,
        )
        db.session.add(cart_item)
        db.session.flush()
        for option in item.get("options") or []:
            option_value_id = int(option.get("option_value_id") or 0)
            if option_value_id:
                db.session.add(CartItemOption(MaCartItem=cart_item.MaCartItem, MaOptionValue=option_value_id, GiaThem=float(option.get("price") or 0)))

    db.session.commit()
    return True


def load_cart_from_db(user_id: int, store_id: int) -> bool:
    cart = Cart.query.filter_by(MaUser=user_id, MaStore=store_id).first()
    if not cart:
        return True

    session_cart = []
    rows = CartItem.query.filter_by(MaCart=cart.MaCart).all()
    for row in rows:
        product = SanPham.query.get(row.MaSP)
        if not product:
            continue
        options = (
            db.session.query(CartItemOption, OptionValue, OptionGroup)
            .join(OptionValue, CartItemOption.MaOptionValue == OptionValue.MaOptionValue)
            .join(OptionGroup, OptionValue.MaOptionGroup == OptionGroup.MaOptionGroup)
            .filter(CartItemOption.MaCartItem == row.MaCartItem)
            .all()
        )
        formatted_options = []
        total_price = float(row.GiaNiemYet or 0)
        for item_option, option_value, option_group in options:
            price = float(item_option.GiaThem or 0)
            formatted_options.append(
                {
                    "option_value_id": option_value.MaOptionValue,
                    "option_name": option_value.TenGiaTri,
                    "value_name": option_value.TenGiaTri,
                    "group_name": option_group.TenNhom,
                    "price": price,
                }
            )
            total_price += price
        total_price *= int(row.SoLuong or 1)
        session_cart.append(
            {
                "product_id": row.MaSP,
                "product_name": product.TenSP,
                "product_image": product.HinhAnh or "assets/img/products/product_one.png",
                "quantity": row.SoLuong,
                "base_price": decimal_to_number(row.GiaNiemYet),
                "total_price": total_price,
                "reference_price": decimal_to_number(product.GiaCoBan),
                "options": formatted_options,
                "note": row.GhiChu or "",
                "added_at": local_now().strftime("%Y-%m-%d %H:%M:%S"),
            }
        )

    session["cart"] = session_cart
    session.modified = True
    return True


def merge_cart_with_db(user_id: int, store_id: int) -> bool:
    if not get_session_cart():
        return load_cart_from_db(user_id, store_id)
    return save_cart_to_db(user_id, store_id)


def selected_store_id() -> int:
    return int(session.get("selected_store") or 1)


def set_selected_store(store_id: int) -> None:
    session["selected_store"] = max(1, int(store_id or 1))
    session.modified = True


def recalculate_cart_prices() -> list[dict]:
    recalculated = []
    for item in get_session_cart():
        try:
            recalculated.append(_recalculate_cart_item(item))
        except ValueError:
            continue
    session["cart"] = recalculated
    session.modified = True
    return recalculated


def _recalculate_cart_item(item: dict) -> dict:
    product_id = int(item.get("product_id") or 0)
    product = get_product_by_id(product_id)
    if not product:
        raise ValueError("Sản phẩm không tồn tại")

    quantity = max(1, int(item.get("quantity") or 1))
    options = _normalize_cart_options(product_id, item.get("options") or [])
    base_price = float(product.GiaNiemYet or product.GiaCoBan or 0)
    total_price = (base_price + sum(float(option.get("price") or 0) for option in options)) * quantity
    return {
        **item,
        "product_id": product_id,
        "product_name": product.TenSP,
        "product_image": product.HinhAnh or "assets/img/products/product_one.png",
        "quantity": quantity,
        "base_price": base_price,
        "total_price": total_price,
        "reference_price": decimal_to_number(product.GiaCoBan),
        "options": options,
    }


def _normalize_cart_options(product_id: int, options: list[dict]) -> list[dict]:
    selected_ids = []
    for option in options or []:
        option_value_id = int(option.get("option_value_id") or option.get("value_id") or 0)
        if option_value_id and option_value_id not in selected_ids:
            selected_ids.append(option_value_id)
    if not selected_ids:
        return []

    rows = (
        db.session.query(OptionValue, OptionGroup)
        .join(OptionGroup, OptionValue.MaOptionGroup == OptionGroup.MaOptionGroup)
        .join(ProductOptionGroup, ProductOptionGroup.MaOptionGroup == OptionGroup.MaOptionGroup)
        .filter(ProductOptionGroup.MaSP == product_id, OptionValue.MaOptionValue.in_(selected_ids))
        .all()
    )
    by_id = {option.MaOptionValue: (option, group) for option, group in rows}
    normalized = []
    for option_value_id in selected_ids:
        row = by_id.get(option_value_id)
        if not row:
            continue
        option_value, option_group = row
        normalized.append(
            {
                "option_value_id": option_value.MaOptionValue,
                "value_name": option_value.TenGiaTri,
                "option_name": option_value.TenGiaTri,
                "group_name": option_group.TenNhom,
                "IsMultiple": bool(option_group.IsMultiple),
                "price": decimal_to_number(option_value.GiaThem),
            }
        )
    return normalized
