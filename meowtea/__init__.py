from pathlib import Path

import click
from flask import Flask, render_template

from .config import Config
from .extensions import db
from .utils import format_currency, render_stars


def create_app(config_object=Config):
    package_dir = Path(__file__).resolve().parent

    app = Flask(
        __name__,
        static_folder=str(package_dir / "assets"),
        static_url_path="/assets",
        template_folder=str(package_dir / "templates"),
    )
    app.config.from_object(config_object)

    db.init_app(app)

    app.jinja_env.filters["currency"] = format_currency
    app.jinja_env.filters["stars"] = render_stars

    register_blueprints(app)
    register_context_processors(app)
    register_cli(app)
    register_error_handlers(app)

    @app.get("/health")
    def health():
        return {"success": True, "message": "MeowTea Flask app is running"}

    return app


def register_blueprints(app: Flask):
    from .blueprints.auth.routes import bp as auth_bp
    from .blueprints.cart.routes import bp as cart_bp
    from .blueprints.management.routes import bp as management_bp
    from .blueprints.menu.routes import bp as menu_bp
    from .blueprints.orders.routes import bp as orders_bp
    from .blueprints.product.routes import bp as product_bp
    from .blueprints.promotion.routes import bp as promotion_bp
    from .blueprints.stores.routes import bp as stores_bp
    from .blueprints.web.routes import bp as web_bp

    app.register_blueprint(web_bp)
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(cart_bp, url_prefix="/api/cart")
    app.register_blueprint(management_bp, url_prefix="/api/management")
    app.register_blueprint(menu_bp, url_prefix="/api/menu")
    app.register_blueprint(orders_bp, url_prefix="/api/order")
    app.register_blueprint(product_bp, url_prefix="/api/product")
    app.register_blueprint(promotion_bp, url_prefix="/api/promotion")
    app.register_blueprint(stores_bp, url_prefix="/api/stores")


def register_cli(app: Flask):
    @app.cli.command("seed-db")
    @click.option("--drop", is_flag=True, help="Drop existing tables before creating schema.")
    def seed_db(drop: bool):
        from .database.seed import seed_database

        if drop:
            db.drop_all()
        db.create_all()
        seed_database()
        click.echo("Database schema and seed data are ready.")

    @app.cli.command("verify-seed")
    def verify_seed():
        from .database.seed import EXPECTED_SEED_COUNTS

        failures = []
        for model, expected_count in EXPECTED_SEED_COUNTS.items():
            actual_count = model.query.count()
            table_name = model.__tablename__
            click.echo(f"{table_name}: {actual_count}/{expected_count}")
            if actual_count != expected_count:
                failures.append(f"{table_name} expected {expected_count}, got {actual_count}")
        if failures:
            raise click.ClickException("; ".join(failures))
        click.echo("Seed row counts match the legacy seed data.")


def register_context_processors(app: Flask):
    @app.context_processor
    def inject_layout_state():
        from .security import current_user
        from .services.cart_service import cart_count

        user = current_user()
        role_name = (user or {}).get("role_name") or ""
        can_use_cart = role_name.lower() not in {"admin", "staff"}
        return {
            "current_user": user,
            "is_logged_in": bool(user),
            "user_role": role_name,
            "is_admin": role_name == "Admin",
            "show_management": role_name in {"Admin", "Staff"},
            "can_use_cart": can_use_cart,
            "cart_count": cart_count() if can_use_cart else 0,
        }


def register_error_handlers(app: Flask):
    @app.errorhandler(404)
    def not_found(_error):
        return render_template("errors/404.html"), 404
