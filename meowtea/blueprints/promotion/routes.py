from flask import Blueprint, jsonify, request

from ...security import login_required
from ...services.promotion_service import validate_promotion

bp = Blueprint("promotion", __name__)


@bp.post("/validate")
@bp.post("/validate.php")
@login_required
def validate_route():
    try:
        payload = validate_promotion((request.form.get("code") or "").strip(), float(request.form.get("subtotal") or 0))
        return jsonify(success=True, message="Áp dụng mã khuyến mãi thành công", **payload)
    except Exception as exc:
        return jsonify(success=False, message=str(exc), discount=0, promotion=None)
