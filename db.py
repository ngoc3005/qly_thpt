import os
from functools import lru_cache
from urllib.parse import quote_plus

import certifi
from pymongo import ASCENDING, MongoClient


def build_mongo_uri():
    uri = os.environ.get("MONGODB_URI") or os.environ.get("MONGO_URL")
    if uri:
        if uri.startswith("mongodb+srv://") and "retryWrites" not in uri:
            sep = "&" if "?" in uri else "?"
            uri = f"{uri}{sep}retryWrites=true&w=majority"
        return uri

    username = os.environ.get("MONGODB_USERNAME")
    password = os.environ.get("MONGODB_PASSWORD")
    host = os.environ.get("MONGODB_HOST", "cluster0.eqitwke.mongodb.net")
    if username and password:
        user = quote_plus(username)
        pwd = quote_plus(password)
        return f"mongodb+srv://{user}:{pwd}@{host}/?retryWrites=true&w=majority"

    # Local/CI fallback
    return "mongodb://127.0.0.1:27017"


def _needs_tls(uri: str) -> bool:
    u = uri.lower()
    if u.startswith("mongodb+srv://"):
        return True
    if "mongodb.net" in u:
        return True
    if "tls=true" in u or "ssl=true" in u:
        return True
    # Local docker/mongo service không dùng TLS
    if "127.0.0.1" in u or "localhost" in u:
        return False
    return False


@lru_cache(maxsize=1)
def get_client():
    uri = build_mongo_uri()
    kwargs = {
        "serverSelectionTimeoutMS": 30000,
        "connectTimeoutMS": 20000,
    }

    if _needs_tls(uri):
        kwargs["tls"] = True
        kwargs["tlsCAFile"] = certifi.where()
        on_azure = bool(os.environ.get("WEBSITE_INSTANCE_ID") or os.environ.get("WEBSITE_SITE_NAME"))
        insecure = os.environ.get("MONGODB_TLS_INSECURE", "").lower() in ("1", "true", "yes")
        if on_azure or insecure:
            kwargs["tlsAllowInvalidCertificates"] = True

    return MongoClient(uri, **kwargs)


def get_db():
    client = get_client()
    db_name = os.environ.get("MONGODB_DB", "quanlythpt")
    return client[db_name]


def init_db():
    """Tạo index (idempotent) và kiểm tra kết nối."""
    db = get_db()
    db.command("ping")

    db.users.create_index("username", unique=True)
    db.teachers.create_index("code", unique=True, sparse=True)
    db.students.create_index("code", unique=True, sparse=True)
    db.subjects.create_index("name", unique=True)
    db.classes.create_index([("name", ASCENDING), ("academic_year", ASCENDING)], unique=True)
    db.semesters.create_index([("name", ASCENDING), ("academic_year", ASCENDING)], unique=True)
    db.grades.create_index(
        [("student_id", ASCENDING), ("subject_id", ASCENDING), ("semester_id", ASCENDING)],
        unique=True,
    )
    return db


def reset_client_cache():
    get_client.cache_clear()
