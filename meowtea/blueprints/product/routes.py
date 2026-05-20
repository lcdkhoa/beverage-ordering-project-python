from flask import Blueprint, jsonify, request

from ...services.catalog_service import get_product_payload

bp = Blueprint("product", __name__)


@bp.get("/get")
@bp.get("/get.php")
def get_product_route():
    try:
        product_id = int(request.args.get("id") or 0)
        if not product_id:
            raise ValueError("Mã sản phẩm không hợp lệ")
        return jsonify(success=True, data=get_product_payload(product_id))
    except Exception as exc:
        return jsonify(success=False, message=str(exc))
