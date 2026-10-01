import os

from flask import Flask, render_template

from api import api_bp
from models import db
from seed import seed_demo_data


def create_app():
    app = Flask(
        __name__,
        static_folder="frontend/static",
        template_folder="frontend",
    )
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "quan-ly-thpt-azure-secret")

    # Azure: ưu tiên thư mục HOME (ghi được). Local: cạnh file app.py
    if os.environ.get("DATABASE_URL"):
        app.config["SQLALCHEMY_DATABASE_URI"] = os.environ["DATABASE_URL"]
    else:
        data_dir = os.environ.get("HOME") or os.path.dirname(os.path.abspath(__file__))
        os.makedirs(data_dir, exist_ok=True)
        db_file = os.path.join(data_dir, "school.db")
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + db_file.replace("\\", "/")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

    db.init_app(app)
    app.register_blueprint(api_bp)

    with app.app_context():
        db.create_all()
        seed_demo_data()

    @app.get("/")
    def index():
        return render_template("index.html")

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG") == "1")
