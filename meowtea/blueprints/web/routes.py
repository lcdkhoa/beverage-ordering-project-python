from pathlib import Path
from datetime import timedelta

from flask import Blueprint, current_app, redirect, render_template, request, session, url_for

from ...clock import local_now
from ...security import current_user
from ...services.catalog_service import (
    get_best_seller_products,
    get_categories,
    get_home_news,
    get_news,
    get_news_detail,
    get_payment_methods,
    get_products_by_category,
    get_toppings,
    search_products,
    search_stores,
)
from ...services.cart_service import recalculate_cart_prices
from ...services.order_service import get_order_detail
from ...services.auth_service import logout as logout_user

bp = Blueprint("web", __name__)


@bp.get("/")
def home():
    carousel_images = _carousel_images()
    return render_template(
        "home.html",
        active_page="home",
        carousel_images=carousel_images or ["assets/img/carousel/one.png"],
        best_seller_products=get_products_by_category(None, 4),
        news_items=get_home_news(3),
    )


@bp.get("/menu")
def menu():
    category_id = request.args.get("category", type=int)
    keyword = (request.args.get("search") or "").strip()
    show_best_seller = request.args.get("bestseller") == "1"
    show_topping = request.args.get("topping") == "1"
    page = max(1, request.args.get("page", default=1, type=int))
    per_page = 12

    categories = get_categories()
    selected_category_name = "Tất cả"
    if show_best_seller:
        selected_category_name = "Best Seller"
        products = get_best_seller_products(2)
        total_products = len(products)
        total_pages = 1
    elif show_topping:
        selected_category_name = "Topping"
        products = get_toppings()
        total_products = len(products)
        total_pages = 1
    else:
        result = search_products(keyword, category_id, page, per_page)
        products = result["items"]
        total_products = result["total"]
        total_pages = result["total_pages"]
        if category_id:
            selected_category_name = next((cat["TenCategory"] for cat in categories if cat["MaCategory"] == category_id), selected_category_name)

    return render_template(
        "menu.html",
        active_page="menu",
        categories=categories,
        products=products,
        category_id=category_id,
        keyword=keyword,
        show_best_seller=show_best_seller,
        show_topping=show_topping,
        selected_category_name=selected_category_name,
        total_products=total_products,
        total_pages=total_pages,
        page=page,
        per_page=per_page,
        icon_for_category=_icon_for_category,
    )


@bp.get("/stores")
def stores():
    keyword = (request.args.get("keyword") or "").strip()
    province = (request.args.get("province") or "").strip()
    ward = (request.args.get("ward") or "").strip()
    stores = search_stores(keyword=keyword, province=province, ward=ward)
    return render_template(
        "stores.html",
        active_page="stores",
        carousel_images=_store_images() or ["assets/img/stores/stores_banner.png"],
        stores=stores,
        total_stores=len(stores),
        keyword=keyword,
        province=province,
        ward=ward,
    )


@bp.get("/news")
def news():
    page = max(1, request.args.get("page", default=1, type=int))
    news_result = get_news(page, 6)
    return render_template("news.html", active_page="news", **news_result)


@bp.get("/news/<int:news_id>")
def news_detail(news_id: int):
    try:
        item = get_news_detail(news_id)
    except ValueError:
        return render_template("errors/404.html"), 404
    return render_template("news_detail.html", active_page="news", news=item)


@bp.get("/career")
def career():
    return render_template("career.html", active_page="career")


@bp.get("/about")
def about():
    return render_template("about.html", active_page="about")


@bp.get("/cart")
def cart():
    role_name = (session.get("user_role_name") or "").lower()
    if role_name in {"admin", "staff"}:
        return redirect(url_for("web.home"))
    cart_items = recalculate_cart_prices()
    total_amount = sum(float(item.get("total_price") or 0) for item in cart_items)
    return render_template(
        "cart.html",
        active_page="cart",
        cart_items=cart_items,
        total_amount=total_amount,
    )


@bp.get("/checkout")
def checkout():
    role_name = (session.get("user_role_name") or "").lower()
    if not session.get("logged_in"):
        return redirect(url_for("web.login_page", redirect="checkout"))
    if role_name in {"admin", "staff"}:
        return redirect(url_for("web.home"))

    cart_items = recalculate_cart_prices()
    if not cart_items:
        return redirect(url_for("web.cart"))

    stores = _stores_with_province(search_stores())
    payment_methods = get_payment_methods()
    subtotal = sum(float(item.get("total_price") or 0) for item in cart_items)
    shipping_fee = 30000
    total_amount = subtotal + shipping_fee
    user = current_user() or {}

    return render_template(
        "checkout.html",
        active_page="cart",
        cart_items=cart_items,
        stores=stores,
        payment_methods=payment_methods,
        subtotal=subtotal,
        shipping_fee=shipping_fee,
        total_amount=total_amount,
        user=user,
    )


@bp.get("/order-result")
def order_result():
    if not session.get("logged_in"):
        return redirect(url_for("web.login_page"))

    order_id = request.args.get("order_id", type=int) or 0
    if not order_id:
        return redirect(url_for("web.cart"))

    try:
        user = current_user() or {}
        order = get_order_detail(order_id, user_id=int(user["id"]))
    except Exception:
        return render_template("order_not_found.html", active_page="cart", order_id=order_id), 404

    return render_template(
        "order_result.html",
        active_page="cart",
        order=order,
        user=current_user() or {},
        estimated_delivery=local_now() + timedelta(hours=1),
        progress=_order_progress(order),
    )


@bp.get("/profile")
def profile():
    if not session.get("logged_in"):
        return redirect(url_for("web.login_page"))
    user = current_user() or {}
    return render_template("profile.html", active_page="profile", user=user, include_orders=True)


@bp.get("/orders")
def orders_page():
    if not session.get("logged_in"):
        return redirect(url_for("web.login_page"))
    role_name = (session.get("user_role_name") or "").lower()
    if role_name != "customer":
        return redirect(url_for("web.home"))
    return render_template("my_orders.html", active_page="orders")


@bp.get("/management/products")
def management_products():
    allowed = _management_role()
    if allowed is None:
        return redirect(url_for("web.login_page"))
    if not allowed:
        return redirect(url_for("web.home"))
    return render_template("management_products.html", active_page="management", is_admin=session.get("user_role_name") == "Admin")


@bp.get("/management/promotions")
def management_promotions():
    role = session.get("user_role_name")
    if not role:
        return redirect(url_for("web.login_page"))
    if role != "Admin":
        return redirect(url_for("web.home"))
    return render_template("management_promotions.html", active_page="management")


@bp.get("/management/orders")
def management_orders():
    allowed = _management_role()
    if allowed is None:
        return redirect(url_for("web.login_page"))
    if not allowed:
        return redirect(url_for("web.home"))
    return render_template("management_orders.html", active_page="management")


@bp.get("/order-detail-view")
def order_detail_view():
    if not session.get("logged_in"):
        return '<p class="order-detail-error">Vui lòng đăng nhập để xem đơn hàng.</p>', 401

    order_id = request.args.get("id", type=int) or 0
    if not order_id:
        return '<p class="order-detail-error">Không tìm thấy đơn hàng.</p>', 400

    try:
        user = current_user() or {}
        order = get_order_detail(order_id, user_id=int(user["id"]))
    except Exception:
        return '<p class="order-detail-error">Không tải được đơn hàng.</p>', 404

    return render_template("partials/order_detail_view.html", order=order, progress=_order_progress(order))


@bp.get("/login")
def login_page():
    if session.get("logged_in"):
        return redirect(url_for("web.home"))
    return render_template("login.html", active_page="login")


@bp.get("/register")
def register_page():
    if session.get("logged_in"):
        return redirect(url_for("web.home"))
    return render_template("register.html", active_page="register")


@bp.get("/logout")
def logout_page():
    logout_user()
    return redirect(url_for("web.home"))


def _carousel_images() -> list[str]:
    carousel_dir = Path(current_app.config["PROJECT_ROOT"]) / "assets" / "img" / "carousel"
    if not carousel_dir.exists():
        return []
    allowed = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    return [
        "assets/img/carousel/" + path.name
        for path in sorted(carousel_dir.iterdir(), key=lambda item: item.name.lower())
        if path.is_file() and path.suffix.lower() in allowed
    ]


def _store_images() -> list[str]:
    stores_dir = Path(current_app.config["PROJECT_ROOT"]) / "assets" / "img" / "stores"
    if not stores_dir.exists():
        return []
    allowed = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    images = [
        path
        for path in stores_dir.iterdir()
        if path.is_file() and path.suffix.lower() in allowed and path.stem.isdigit()
    ]
    return ["assets/img/stores/" + path.name for path in sorted(images, key=lambda item: int(item.stem))]


def _icon_for_category(category_name: str) -> str:
    icon_map = {
        "Cà phê truyền thống": "coffee.svg",
        "Trà sữa": "milk_tea.svg",
        "Trà trái cây": "fruit_tea.svg",
        "Đá xay": "grinded_ice.svg",
        "Yogurt": "yogurt.svg",
        "Topping": "topping.svg",
    }
    return icon_map.get(category_name, "coffee.svg")


def _stores_with_province(stores: list[dict]) -> list[dict]:
    provinces = ["Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ"]
    enriched = []
    for store in stores:
        row = dict(store)
        address = row.get("DiaChi") or ""
        row["Province"] = next((province for province in provinces if province.lower() in address.lower()), "")
        enriched.append(row)
    return enriched


def _order_progress(order: dict) -> dict:
    status = order.get("TrangThai") or "Payment_Received"
    completed_statuses = {"Payment_Received", "Pending", "Processing", "Order_Received", "Delivering", "Completed"}
    received_statuses = {"Processing", "Order_Received", "Delivering", "Completed"}
    delivering_statuses = {"Delivering", "Completed"}
    is_cancelled = status in {"Cancelled", "Store_Cancelled"}
    return {
        "is_cancelled": is_cancelled,
        "step1": status in completed_statuses or is_cancelled,
        "step2": status in received_statuses,
        "step3": status in delivering_statuses,
        "step4": status == "Completed",
        "time": (order.get("NgayTaoTime") or ""),
        "status_text": _status_text(status),
        "status_class": _status_class(status),
    }


def _status_text(status: str) -> str:
    value = (status or "").lower()
    if value == "completed":
        return "Hoàn thành"
    if value in {"cancelled", "store_cancelled"}:
        return "Đã hủy"
    if value == "delivering":
        return "Đang giao hàng"
    if value in {"processing", "order_received"}:
        return "Đã nhận đơn"
    return "Đã nhận thanh toán"


def _status_class(status: str) -> str:
    value = (status or "").lower()
    if value == "completed":
        return "completed"
    if value in {"cancelled", "store_cancelled"}:
        return "cancelled"
    if value == "delivering":
        return "delivering"
    if value in {"processing", "order_received"}:
        return "received"
    return "payment-received"


def _management_role() -> bool | None:
    if not session.get("logged_in"):
        return None
    return (session.get("user_role_name") or "") in {"Admin", "Staff"}
