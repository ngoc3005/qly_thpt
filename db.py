import os
from functools import lru_cache
from urllib.parse import quote_plus

from pymongo import ASCENDING, MongoClient


def build_mongo_uri():
    uri = os.environ.get("MONGODB_URI") or os.environ.get("MONGO_URL")
    if uri:
        # Bổ sung param nếu thiếu
        if "retryWrites" not in uri:
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

    raise RuntimeError(
        "Chưa cấu hình MongoDB. Set MONGODB_URI hoặc MONGODB_USERNAME/MONGODB_PASSWORD trên Azure."
    )


@lru_cache(maxsize=1)
def get_client():
    uri = build_mongo_uri()
    return MongoClient(uri, serverSelectionTimeoutMS=12000)


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
