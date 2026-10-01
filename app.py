import logging
import os
import sys
import traceback

from flask import Flask, jsonify, render_template

logging.basicConfig(
    level=logging.INFO,
    stream=sys.stdout,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("quanlythpt")


def _database_uri():
    if os.environ.get("DATABASE_URL"):
        return os.environ["DATABASE_URL"]

    # Azure App Service: /home luôn ghi được và persistent
    candidates = []
    if os.path.isdir("/home"):
        candidates.append("/home/data")
    candidates.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "data"))
    candidates.append("/tmp/quanlythpt")

    for data_dir in candidates:
        try:
            os.makedirs(data_dir, exist_ok=True)
            test_file = os.path.join(data_dir, ".write_test")
            with open(test_file, "w", encoding="utf-8") as f:
                f.write("ok")
            os.remove(test_file)
            db_file = os.path.join(data_dir, "school.db").replace("\\", "/")
            uri = "sqlite:///" + db_file
            logger.info("Using database: %s", uri)
            return uri
        except Exception as exc:
            logger.warning("Cannot use data dir %s: %s", data_dir, exc)

    logger.warning("Fallback to in-memory SQLite")
    return "sqlite://"


def create_app():
    app = Flask(
        __name__,
        static_folder="frontend/static",
        template_folder="frontend",
    )
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "quan-ly-thpt-azure-secret")
    app.config["SQLALCHEMY_DATABASE_URI"] = _database_uri()
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

    init_error = None
    try:
        from api import api_bp
        from models import db
        from seed import seed_demo_data

        db.init_app(app)
        app.register_blueprint(api_bp)

        with app.app_context():
            db.create_all()
            seed_demo_data()
        logger.info("Database initialized and demo data ready")
    except Exception:
        init_error = traceback.format_exc()
        logger.error("App init failed:\n%s", init_error)

    @app.get("/")
    def index():
        if init_error:
            return (
                "<h1>App đang lỗi khởi tạo DB</h1>"
                "<p>Xem Log stream trên Azure để biết chi tiết.</p>"
                f"<pre>{init_error}</pre>"
            ), 500
        return render_template("index.html")

    @app.get("/health")
    def health():
        return jsonify({"status": "ok", "init_error": bool(init_error)})

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG") == "1")
