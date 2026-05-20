from flask import Blueprint, jsonify, request

from ...services.catalog_service import search_stores

bp = Blueprint("stores", __name__)


@bp.get("/search")
@bp.get("/search.php")
def search_route():
    try:
        stores = search_stores(
            keyword=(request.args.get("keyword") or request.args.get("search") or "").strip(),
            province=(request.args.get("province") or "").strip(),
            ward=(request.args.get("ward") or "").strip(),
        )
        return jsonify(success=True, stores=stores, data=stores, count=len(stores), total=len(stores))
    except Exception as exc:
        return jsonify(success=False, message=str(exc), stores=[], data=[])
