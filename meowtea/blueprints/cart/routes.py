import json

from flask import Blueprint, jsonify, request

from ...services.cart_service import add_to_cart, cart_count, clear_cart, delete_cart_item, get_session_cart, update_cart_item

bp = Blueprint("cart", __name__)


@bp.post("/add")
@bp.post("/add.php")
def add_route():
    try:
        data = request.form.to_dict()
        data["options"] = json.loads(data.get("options") or "[]")
        item = add_to_cart(data)
        return jsonify(success=True, message="Đã thêm vào giỏ hàng", cart_count=cart_count(), item=item)
    except Exception as exc:
        return jsonify(success=False, message=str(exc))


@bp.get("/get")
@bp.get("/get.php")
def get_route():
    items = get_session_cart()
    return jsonify(success=True, items=items, count=len(items))


@bp.get("/count")
@bp.get("/count.php")
def count_route():
    return jsonify(success=True, count=cart_count())


@bp.post("/update")
@bp.post("/update.php")
def update_route():
    try:
        index = int(request.form.get("index") or request.form.get("cart_index") or request.form.get("item_index") or 0)
        quantity = int(request.form["quantity"]) if "quantity" in request.form else None
        note = request.form["note"] if "note" in request.form else None
        update_cart_item(index, quantity=quantity, note=note)
        return jsonify(success=True, message="Cập nhật giỏ hàng thành công", count=cart_count(), cart_count=cart_count(), items=get_session_cart())
    except Exception as exc:
        return jsonify(success=False, message=str(exc))


@bp.post("/delete")
@bp.post("/delete.php")
def delete_route():
    try:
        index = int(request.form.get("index") or request.form.get("cart_index") or request.form.get("item_index") or 0)
        delete_cart_item(index)
        return jsonify(success=True, message="Xóa sản phẩm khỏi giỏ hàng thành công", count=cart_count(), cart_count=cart_count(), items=get_session_cart())
    except Exception as exc:
        return jsonify(success=False, message=str(exc))


@bp.post("/clear")
@bp.post("/clear.php")
def clear_route():
    clear_cart()
    return jsonify(success=True, message="Đã xóa giỏ hàng", count=0)
