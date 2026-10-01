import os
from functools import lru_cache

from pymongo import ASCENDING, MongoClient
@lru_cache(maxsize=1)
def get_client():
    uri = os.environ.get("MONGODB_URI") or os.environ.get("MONGO_URL")
    if not uri:
        raise RuntimeError(
            "Chưa cấu hình MONGODB_URI. "
            "Thêm Application setting trên Azure hoặc file .env local."
        )
    return MongoClient(uri, serverSelectionTimeoutMS=8000)


def get_db():
    client = get_client()
    db_name = os.environ.get("MONGODB_DB", "quanlythpt")
    return client[db_name]


def init_db():
    """Tạo index (idempotent) và kiểm tra kết nối."""
    db = get_db()
    # Ping
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
