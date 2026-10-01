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


def create_app():
    app = Flask(
        __name__,
        static_folder="frontend/static",
        template_folder="frontend",
    )
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "quan-ly-thpt-azure-secret")
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

    init_error = None
    try:
        from api import api_bp
        from db import init_db
        from seed import seed_demo_data

        # Mặc định local nếu chưa set
        if not os.environ.get("MONGODB_URI") and not os.environ.get("MONGO_URL"):
            os.environ["MONGODB_URI"] = "mongodb://127.0.0.1:27017"

        init_db()
        seed_demo_data()
        app.register_blueprint(api_bp)
        logger.info("MongoDB connected and demo data ready")
    except Exception:
        init_error = traceback.format_exc()
        logger.error("MongoDB init failed:\n%s", init_error)

    @app.get("/")
    def index():
        if init_error:
            return (
                "<h1>App đang lỗi kết nối MongoDB</h1>"
                "<p>Hãy cấu hình Application Setting <code>MONGODB_URI</code> trên Azure.</p>"
                f"<pre style='white-space:pre-wrap'>{init_error}</pre>"
            ), 500
        return render_template("index.html")

    @app.get("/health")
    def health():
        payload = {"status": "ok" if not init_error else "error", "db": "mongodb"}
        if init_error:
            payload["error"] = init_error.splitlines()[-1]
        return jsonify(payload), (200 if not init_error else 500)

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG") == "1")
