from flask import Blueprint, jsonify, request

from ...security import role_required
from ...services import management_service as service

bp = Blueprint("management", __name__)


@bp.get("/products")
@bp.get("/products.php")
@role_required("Admin", "Staff")
def products_route():
    return jsonify(success=True, data=service.list_products(), message="Lấy danh sách sản phẩm thành công")


@bp.get("/categories")
@bp.get("/categories.php")
@role_required("Admin", "Staff")
def categories_route():
    return jsonify(success=True, data=service.list_categories(), message="Lấy danh mục thành công")


@bp.get("/toppings")
@bp.get("/toppings.php")
@role_required("Admin", "Staff")
def toppings_route():
    return jsonify(success=True, data=service.list_toppings(), message="Lấy danh sách topping thành công")


@bp.get("/option-catalog")
@bp.get("/option-catalog.php")
@role_required("Admin", "Staff")
def option_catalog_route():
    return jsonify(success=True, data=service.list_option_catalog(), message="Lấy danh mục tùy chọn thành công")


@bp.get("/product-options")
@bp.get("/product-options.php")
@role_required("Admin", "Staff")
def product_options_route():
    product_id = int(request.args.get("product_id") or request.args.get("id") or 0)
    return jsonify(
        success=True,
        data=service.get_product_options_config(product_id),
        message="Lấy tùy chọn sản phẩm thành công",
    )


@bp.get("/promotions")
@bp.get("/promotions.php")
@role_required("Admin", "Staff")
def promotions_route():
    return jsonify(success=True, data=service.list_promotions(), message="Lấy danh sách khuyến mãi thành công")


@bp.post("/create-product")
@bp.post("/create-product.php")
@role_required("Admin")
def create_product_route():
    form_data = request.form.to_dict()
    form_data["option_value_ids"] = _parse_option_value_ids_from_request()
    return _mutate(
        lambda: service.create_product(
            form_data,
            request.files.get("hinh_anh"),
        ),
        "Tạo sản phẩm thành công",
    )


@bp.post("/update-product")
@bp.post("/update-product.php")
@role_required("Admin")
def update_product_route():
    return _mutate(
        lambda: service.update_product(
            int(request.form.get("product_id") or request.form.get("id") or 0),
            request.form.to_dict(),
            request.files.get("hinh_anh"),
        ),
        "Cập nhật sản phẩm thành công",
    )


@bp.post("/update-price")
@bp.post("/update-price.php")
@role_required("Admin")
def update_price_route():
    return _mutate(lambda: service.update_product_price(int(request.form.get("product_id") or request.form.get("id") or 0), float(request.form.get("price") or 0)), "Cập nhật giá sản phẩm thành công")


@bp.post("/delete-product")
@bp.post("/delete-product.php")
@role_required("Admin")
def delete_product_route():
    return _mutate(lambda: service.delete_product(int(request.form.get("product_id") or request.form.get("id") or 0)), "Xóa sản phẩm thành công")


@bp.post("/update-product-options")
@bp.post("/update-product-options.php")
@role_required("Admin")
def update_product_options_route():
    product_id = int(request.form.get("product_id") or request.form.get("id") or 0)
    option_value_ids = _parse_option_value_ids_from_request()
    return _mutate(
        lambda: service.set_product_options(product_id, option_value_ids) or {"MaSP": product_id},
        "Cập nhật tùy chọn sản phẩm thành công",
    )


@bp.post("/create-topping")
@bp.post("/create-topping.php")
@role_required("Admin")
def create_topping_route():
    return _mutate(lambda: service.create_topping(request.form.to_dict()), "Tạo topping thành công")


@bp.post("/update-topping-price")
@bp.post("/update-topping-price.php")
@role_required("Admin")
def update_topping_price_route():
    return _mutate(lambda: service.update_topping_price(int(request.form.get("topping_id") or request.form.get("id") or 0), float(request.form.get("price") or 0)), "Cập nhật giá topping thành công")


@bp.post("/delete-topping")
@bp.post("/delete-topping.php")
@role_required("Admin")
def delete_topping_route():
    return _mutate(lambda: service.delete_topping(int(request.form.get("topping_id") or request.form.get("id") or 0)), "Xóa topping thành công")


@bp.post("/create-promotion")
@bp.post("/create-promotion.php")
@role_required("Admin", "Staff")
def create_promotion_route():
    return _mutate(lambda: service.create_promotion(request.form.to_dict()), "Tạo khuyến mãi thành công")


@bp.post("/update-promotion")
@bp.post("/update-promotion.php")
@role_required("Admin", "Staff")
def update_promotion_route():
    return _mutate(lambda: service.update_promotion(int(request.form.get("promotion_id") or request.form.get("id") or 0), request.form.to_dict()), "Cập nhật khuyến mãi thành công")


@bp.post("/delete-promotion")
@bp.post("/delete-promotion.php")
@role_required("Admin", "Staff")
def delete_promotion_route():
    return _mutate(lambda: service.delete_promotion(int(request.form.get("promotion_id") or request.form.get("id") or 0)), "Xóa khuyến mãi thành công")


def _mutate(fn, message: str):
    try:
        result = fn()
        data = result.to_dict() if hasattr(result, "to_dict") else result
        return jsonify(success=True, message=message, data=data)
    except Exception as exc:
        return jsonify(success=False, message=str(exc))


def _parse_option_value_ids_from_request() -> list[int]:
    raw_values = request.form.getlist("option_value_ids[]") or request.form.getlist("option_value_ids")
    if not raw_values and request.form.get("option_value_ids"):
        raw_values = [part.strip() for part in request.form.get("option_value_ids").split(",") if part.strip()]
    return [int(value) for value in raw_values if str(value).isdigit()]
