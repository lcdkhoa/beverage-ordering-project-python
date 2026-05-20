from html import escape

from flask import Blueprint, jsonify, render_template, request

from ...services.catalog_service import get_best_seller_products, get_categories, get_toppings, search_products

bp = Blueprint("menu", __name__)


@bp.get("/search")
@bp.get("/search.php")
def search_route():
    try:
        category_id = request.args.get("category", type=int)
        keyword = (request.args.get("search") or "").strip()
        show_best_seller = request.args.get("bestseller") == "1"
        show_topping = request.args.get("topping") == "1"
        page = max(1, request.args.get("page", default=1, type=int))

        categories = get_categories()
        if show_best_seller:
            products = get_best_seller_products(2)
            selected_name = "Best Seller"
            total = len(products)
            payload = {"items": products, "total": total, "total_pages": 1, "page": 1, "per_page": 2}
        elif show_topping:
            products = get_toppings()
            selected_name = "Topping"
            total = len(products)
            payload = {"items": products, "total": total, "total_pages": 1, "page": 1, "per_page": total}
        else:
            payload = search_products(keyword, category_id, page, 12)
            selected_name = "Tất cả"
            if category_id:
                selected_name = next((cat["TenCategory"] for cat in categories if cat["MaCategory"] == category_id), selected_name)

        count_label = "topping" if show_topping else "sản phẩm"
        heading = (
            f'<h2 class="section-heading" id="menu-section-heading">'
            f'{escape(selected_name)}<span class="product-count">({payload["total"]} {count_label})</span>'
            "</h2>"
        )
        content = render_template(
            "partials/menu_products.html",
            products=payload["items"],
            show_best_seller=show_best_seller,
            show_topping=show_topping,
            total_pages=payload["total_pages"],
            page=payload["page"],
        )
        return jsonify(success=True, headingHtml=heading, contentHtml=content, data=payload)
    except Exception as exc:
        return jsonify(success=False, message=str(exc), headingHtml="", contentHtml="")
