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


def load_dotenv_if_present():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if not os.path.isfile(env_path):
        return
    try:
        from dotenv import load_dotenv
        load_dotenv(env_path, override=False)
    except Exception:
        # fallback đọc thủ công nếu chưa có python-dotenv
        with open(env_path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def create_app():
    load_dotenv_if_present()

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
        from db import init_db, reset_client_cache
        from seed import seed_demo_data

        reset_client_cache()
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
                "<p>Kiểm tra Application Setting <code>MONGODB_URI</code> trên Azure.</p>"
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
