import os

from flask import Flask, render_template, send_from_directory

from api import api_bp, seed_defaults
from models import db


def create_app():
    app = Flask(
        __name__,
        static_folder="frontend/static",
        template_folder="frontend",
    )
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "quan-ly-thpt-azure-dev")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
        "DATABASE_URL",
        "sqlite:///" + os.path.join(os.path.dirname(__file__), "school.db"),
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    app.register_blueprint(api_bp)

    with app.app_context():
        db.create_all()
        seed_defaults()

    @app.route("/")
    def index():
        """Vào domain Azure sẽ trả giao diện frontend."""
        return render_template("index.html")

    @app.route("/favicon.ico")
    def favicon():
        return send_from_directory(
            os.path.join(app.root_path, "frontend", "static"),
            "favicon.ico",
            mimetype="image/vnd.microsoft.icon",
        )

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG") == "1")
