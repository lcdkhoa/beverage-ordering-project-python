from flask import Blueprint, jsonify, request, session

from ...security import current_user, login_required, role_required
from ...services.cart_service import set_selected_store
from ...services.order_service import create_order, get_order_detail, list_orders, lookup_taxpayer_info, update_order_status

bp = Blueprint("orders", __name__)


@bp.post("/create")
@bp.post("/create.php")
@login_required
def create_route():
    try:
        set_selected_store(int(request.form.get("store_id") or 1))
        payload = create_order(request.form.to_dict())
        return jsonify(success=True, message="Đặt hàng thành công", **payload)
    except Exception as exc:
        return jsonify(success=False, message=str(exc))


@bp.get("/lookup-tax")
@bp.get("/lookup-tax.php")
@login_required
def lookup_tax_route():
    try:
        payload = lookup_taxpayer_info(request.args.get("tax") or "")
        return jsonify(success=True, message="Tra cứu mã số thuế thành công", **payload)
    except Exception as exc:
        return jsonify(success=False, message=str(exc)), 400


@bp.get("/get")
@bp.get("/get.php")
@login_required
def get_route():
    try:
        user = current_user()
        payload = list_orders(user_id=user["id"], role_name=user.get("role_name") or "", filters=request.args.to_dict())
        return jsonify(success=True, message="Lấy danh sách đơn hàng thành công", **payload)
    except Exception as exc:
        return jsonify(success=False, message=str(exc), orders=[], total=0, total_pages=0, page=1, per_page=10)


@bp.get("/get-all")
@bp.get("/get-all.php")
@role_required("Admin", "Staff")
def get_all_route():
    try:
        payload = list_orders(user_id=None, role_name=session.get("user_role_name") or "", filters=request.args.to_dict())
        return jsonify(success=True, message="Lấy danh sách đơn hàng thành công", **payload)
    except Exception as exc:
        return jsonify(success=False, message=str(exc), orders=[], total=0, total_pages=0, page=1, per_page=10)


@bp.get("/get_one")
@bp.get("/get_one.php")
@login_required
def get_one_route():
    try:
        user = current_user()
        order = get_order_detail(int(request.args.get("id") or 0), user_id=int(user["id"]))
        return jsonify(success=True, message="OK", order=order)
    except Exception as exc:
        return jsonify(success=False, message=str(exc), order=None)


@bp.get("/get-one-admin")
@bp.get("/get-one-admin.php")
@role_required("Admin", "Staff")
def get_one_admin_route():
    try:
        order = get_order_detail(int(request.args.get("id") or 0), include_customer=True)
        return jsonify(success=True, message="OK", order=order)
    except Exception as exc:
        return jsonify(success=False, message=str(exc), order=None)


@bp.post("/update-status")
@bp.post("/update-status.php")
@role_required("Admin", "Staff")
def update_status_route():
    try:
        payload = update_order_status(
            int(request.form.get("order_id") or 0),
            (request.form.get("action") or "").strip(),
            (request.form.get("status") or "").strip(),
            session.get("user_role_name") or "",
        )
        return jsonify(success=True, **payload)
    except Exception as exc:
        return jsonify(success=False, message=str(exc))
