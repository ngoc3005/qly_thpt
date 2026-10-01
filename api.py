from datetime import datetime
from functools import wraps

from flask import Blueprint, jsonify, request, session
from pymongo.errors import DuplicateKeyError

from db import get_db
from models import (
    BAN_HOC,
    CONDUCT,
    GENDER,
    GRADE_LEVEL,
    ROLES,
    STATUS,
    class_dict,
    grade_dict,
    hash_password,
    oid,
    semester_dict,
    sid,
    student_dict,
    subject_dict,
    teacher_dict,
    transfer_dict,
    user_dict,
    verify_password,
)

api_bp = Blueprint("api", __name__, url_prefix="/api")


def ok(data=None, status=200):
    return jsonify(data if data is not None else {"ok": True}), status


def err(message, status=400):
    return jsonify({"error": message}), status


def current_user():
    uid = session.get("user_id")
    if not uid:
        return None
    return get_db().users.find_one({"_id": oid(uid)})


def login_required(roles=None):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = current_user()
            if not user or not user.get("is_active", True):
                return err("Chưa đăng nhập.", 401)
            if roles and user.get("role") not in roles:
                return err("Không có quyền thực hiện.", 403)
            return fn(user, *args, **kwargs)

        return wrapper

    return decorator


def num_or_none(value):
    if value in (None, ""):
        return None
    return float(value)


def next_code(collection, prefix):
    count = collection.count_documents({}) + 1
    return f"{prefix}-{count:05d}"


# ---------- Auth ----------
@api_bp.post("/auth/login")
def login():
    data = request.get_json(force=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    user = get_db().users.find_one({"username": username})
    if not user or not verify_password(user.get("password_hash", ""), password):
        return err("Sai tên đăng nhập hoặc mật khẩu.", 401)
    if not user.get("is_active", True):
        return err("Tài khoản đã bị khóa.", 401)
    session["user_id"] = sid(user["_id"])
    return ok(user_dict(user))


@api_bp.post("/auth/logout")
def logout():
    session.clear()
    return ok()


@api_bp.get("/auth/me")
def me():
    return ok({"user": user_dict(current_user())})


@api_bp.get("/meta")
@login_required()
def meta(user):
    return ok({
        "gender": GENDER,
        "ban_hoc": BAN_HOC,
        "conduct": CONDUCT,
        "status": STATUS,
        "grade_level": GRADE_LEVEL,
        "roles": ROLES,
        "role": user.get("role"),
    })


@api_bp.get("/stats")
@login_required(roles=["admin", "teacher"])
def stats(user):
    db = get_db()
    return ok({
        "teachers": db.teachers.count_documents({}),
        "students": db.students.count_documents({}),
        "classes": db.classes.count_documents({}),
        "subjects": db.subjects.count_documents({}),
        "semesters": db.semesters.count_documents({}),
        "grades": db.grades.count_documents({}),
        "transfers": db.transfers.count_documents({}),
        "users": db.users.count_documents({}),
    })


# ---------- Teachers ----------
@api_bp.get("/teachers")
@login_required(roles=["admin", "teacher"])
def list_teachers(user):
    items = get_db().teachers.find().sort("name", 1)
    return ok([teacher_dict(x) for x in items])


@api_bp.post("/teachers")
@login_required(roles=["admin"])
def create_teacher(user):
    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip().title()
    if not name:
        return err("Tên giáo viên bắt buộc.")
    db = get_db()
    doc = {
        "name": name,
        "gender": data.get("gender"),
        "phone": data.get("phone"),
        "email": data.get("email"),
        "subject_name": data.get("subject_name"),
        "code": next_code(db.teachers, "GV"),
    }
    result = db.teachers.insert_one(doc)
    doc["_id"] = result.inserted_id
    return ok(teacher_dict(doc), 201)


@api_bp.put("/teachers/<item_id>")
@login_required(roles=["admin"])
def update_teacher(user, item_id):
    data = request.get_json(force=True) or {}
    db = get_db()
    db.teachers.update_one(
        {"_id": oid(item_id)},
        {"$set": {
            "name": (data.get("name") or "").strip().title(),
            "gender": data.get("gender"),
            "phone": data.get("phone"),
            "email": data.get("email"),
            "subject_name": data.get("subject_name"),
        }},
    )
    doc = db.teachers.find_one({"_id": oid(item_id)})
    return ok(teacher_dict(doc))


@api_bp.delete("/teachers/<item_id>")
@login_required(roles=["admin"])
def delete_teacher(user, item_id):
    get_db().teachers.delete_one({"_id": oid(item_id)})
    return ok()


# ---------- Classes ----------
@api_bp.get("/classes")
@login_required()
def list_classes(user):
    db = get_db()
    result = []
    for doc in db.classes.find().sort([("academic_year", -1), ("name", 1)]):
        teacher = db.teachers.find_one({"_id": doc.get("homeroom_teacher_id")}) if doc.get("homeroom_teacher_id") else None
        size = db.students.count_documents({"class_id": doc["_id"]})
        result.append(class_dict(doc, size=size, teacher_name=teacher.get("name") if teacher else None))
    return ok(result)


@api_bp.post("/classes")
@login_required(roles=["admin"])
def create_class(user):
    data = request.get_json(force=True) or {}
    doc = {
        "name": (data.get("name") or "").strip(),
        "grade_level": data.get("grade_level"),
        "academic_year": (data.get("academic_year") or "").strip(),
        "homeroom_teacher_id": oid(data.get("homeroom_teacher_id")),
    }
    if not doc["name"] or not doc["grade_level"] or not doc["academic_year"]:
        return err("Thiếu tên lớp / khối / năm học.")
    try:
        result = get_db().classes.insert_one(doc)
    except DuplicateKeyError:
        return err("Lớp + năm học đã tồn tại.")
    doc["_id"] = result.inserted_id
    return ok(class_dict(doc), 201)


@api_bp.put("/classes/<item_id>")
@login_required(roles=["admin"])
def update_class(user, item_id):
    data = request.get_json(force=True) or {}
    try:
        get_db().classes.update_one(
            {"_id": oid(item_id)},
            {"$set": {
                "name": (data.get("name") or "").strip(),
                "grade_level": data.get("grade_level"),
                "academic_year": (data.get("academic_year") or "").strip(),
                "homeroom_teacher_id": oid(data.get("homeroom_teacher_id")),
            }},
        )
    except DuplicateKeyError:
        return err("Lớp + năm học đã tồn tại.")
    doc = get_db().classes.find_one({"_id": oid(item_id)})
    return ok(class_dict(doc))


@api_bp.delete("/classes/<item_id>")
@login_required(roles=["admin"])
def delete_class(user, item_id):
    get_db().classes.delete_one({"_id": oid(item_id)})
    return ok()


# ---------- Students ----------
@api_bp.get("/students")
@login_required()
def list_students(user):
    db = get_db()
    query = {}
    if user.get("role") == "parent":
        if not user.get("student_id"):
            return ok([])
        query = {"_id": user["student_id"]}
    else:
        q = (request.args.get("q") or "").strip()
        if q:
            query = {"$or": [
                {"name": {"$regex": q, "$options": "i"}},
                {"code": {"$regex": q, "$options": "i"}},
            ]}
    result = []
    for doc in db.students.find(query).sort("name", 1):
        cls = db.classes.find_one({"_id": doc.get("class_id")}) if doc.get("class_id") else None
        result.append(student_dict(doc, class_name=cls.get("name") if cls else None))
    return ok(result)


@api_bp.post("/students")
@login_required(roles=["admin"])
def create_student(user):
    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip().title()
    if not name:
        return err("Tên học sinh bắt buộc.")
    db = get_db()
    doc = {
        "name": name,
        "birth_date": data.get("birth_date") or None,
        "gender": data.get("gender"),
        "phone": data.get("phone"),
        "address": data.get("address"),
        "ban_hoc": data.get("ban_hoc") or "tu_nhien",
        "conduct": data.get("conduct") or "tot",
        "status": data.get("status") or "studying",
        "parent_name": data.get("parent_name"),
        "class_id": oid(data.get("class_id")),
        "code": next_code(db.students, "HS"),
    }
    result = db.students.insert_one(doc)
    doc["_id"] = result.inserted_id
    return ok(student_dict(doc), 201)


@api_bp.put("/students/<item_id>")
@login_required(roles=["admin"])
def update_student(user, item_id):
    data = request.get_json(force=True) or {}
    get_db().students.update_one(
        {"_id": oid(item_id)},
        {"$set": {
            "name": (data.get("name") or "").strip().title(),
            "birth_date": data.get("birth_date") or None,
            "gender": data.get("gender"),
            "phone": data.get("phone"),
            "address": data.get("address"),
            "ban_hoc": data.get("ban_hoc") or "tu_nhien",
            "conduct": data.get("conduct") or "tot",
            "status": data.get("status") or "studying",
            "parent_name": data.get("parent_name"),
            "class_id": oid(data.get("class_id")),
        }},
    )
    doc = get_db().students.find_one({"_id": oid(item_id)})
    return ok(student_dict(doc))


@api_bp.delete("/students/<item_id>")
@login_required(roles=["admin"])
def delete_student(user, item_id):
    get_db().students.delete_one({"_id": oid(item_id)})
    return ok()


# ---------- Subjects ----------
@api_bp.get("/subjects")
@login_required()
def list_subjects(user):
    return ok([subject_dict(x) for x in get_db().subjects.find().sort("name", 1)])


@api_bp.post("/subjects")
@login_required(roles=["admin"])
def create_subject(user):
    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return err("Tên môn bắt buộc.")
    doc = {"name": name, "periods": int(data.get("periods") or 2)}
    try:
        result = get_db().subjects.insert_one(doc)
    except DuplicateKeyError:
        return err("Môn đã tồn tại.")
    doc["_id"] = result.inserted_id
    return ok(subject_dict(doc), 201)


@api_bp.put("/subjects/<item_id>")
@login_required(roles=["admin"])
def update_subject(user, item_id):
    data = request.get_json(force=True) or {}
    get_db().subjects.update_one(
        {"_id": oid(item_id)},
        {"$set": {"name": (data.get("name") or "").strip(), "periods": int(data.get("periods") or 2)}},
    )
    return ok(subject_dict(get_db().subjects.find_one({"_id": oid(item_id)})))


@api_bp.delete("/subjects/<item_id>")
@login_required(roles=["admin"])
def delete_subject(user, item_id):
    get_db().subjects.delete_one({"_id": oid(item_id)})
    return ok()


# ---------- Semesters ----------
@api_bp.get("/semesters")
@login_required()
def list_semesters(user):
    items = get_db().semesters.find().sort([("academic_year", -1), ("name", 1)])
    return ok([semester_dict(x) for x in items])


@api_bp.post("/semesters")
@login_required(roles=["admin"])
def create_semester(user):
    data = request.get_json(force=True) or {}
    db = get_db()
    is_current = str(data.get("is_current")).lower() in ("1", "true", "yes")
    if is_current:
        db.semesters.update_many({}, {"$set": {"is_current": False}})
    doc = {
        "name": (data.get("name") or "").strip(),
        "academic_year": (data.get("academic_year") or "").strip(),
        "is_current": is_current,
    }
    if not doc["name"] or not doc["academic_year"]:
        return err("Thiếu tên học kỳ / năm học.")
    try:
        result = db.semesters.insert_one(doc)
    except DuplicateKeyError:
        return err("Học kỳ đã tồn tại.")
    doc["_id"] = result.inserted_id
    return ok(semester_dict(doc), 201)


@api_bp.put("/semesters/<item_id>")
@login_required(roles=["admin"])
def update_semester(user, item_id):
    data = request.get_json(force=True) or {}
    db = get_db()
    is_current = str(data.get("is_current")).lower() in ("1", "true", "yes")
    if is_current:
        db.semesters.update_many({}, {"$set": {"is_current": False}})
    db.semesters.update_one(
        {"_id": oid(item_id)},
        {"$set": {
            "name": (data.get("name") or "").strip(),
            "academic_year": (data.get("academic_year") or "").strip(),
            "is_current": is_current,
        }},
    )
    return ok(semester_dict(db.semesters.find_one({"_id": oid(item_id)})))


@api_bp.delete("/semesters/<item_id>")
@login_required(roles=["admin"])
def delete_semester(user, item_id):
    get_db().semesters.delete_one({"_id": oid(item_id)})
    return ok()


# ---------- Grades ----------
@api_bp.get("/grades")
@login_required()
def list_grades(user):
    db = get_db()
    query = {}
    if user.get("role") == "parent":
        if not user.get("student_id"):
            return ok([])
        query["student_id"] = user["student_id"]
    if request.args.get("student_id"):
        query["student_id"] = oid(request.args.get("student_id"))
    if request.args.get("semester_id"):
        query["semester_id"] = oid(request.args.get("semester_id"))

    result = []
    for doc in db.grades.find(query).sort("_id", -1):
        student = db.students.find_one({"_id": doc.get("student_id")})
        subject = db.subjects.find_one({"_id": doc.get("subject_id")})
        semester = db.semesters.find_one({"_id": doc.get("semester_id")})
        result.append(grade_dict(doc, student, subject, semester))
    return ok(result)


@api_bp.post("/grades")
@login_required(roles=["admin", "teacher"])
def create_grade(user):
    data = request.get_json(force=True) or {}
    doc = {
        "student_id": oid(data.get("student_id")),
        "subject_id": oid(data.get("subject_id")),
        "semester_id": oid(data.get("semester_id")),
        "score_mieng": num_or_none(data.get("score_mieng")),
        "score_15p": num_or_none(data.get("score_15p")),
        "score_1tiet": num_or_none(data.get("score_1tiet")),
        "score_thi": num_or_none(data.get("score_thi")),
    }
    try:
        result = get_db().grades.insert_one(doc)
    except DuplicateKeyError:
        return err("Điểm môn này đã có trong học kỳ.")
    doc["_id"] = result.inserted_id
    db = get_db()
    return ok(grade_dict(
        doc,
        db.students.find_one({"_id": doc["student_id"]}),
        db.subjects.find_one({"_id": doc["subject_id"]}),
        db.semesters.find_one({"_id": doc["semester_id"]}),
    ), 201)


@api_bp.put("/grades/<item_id>")
@login_required(roles=["admin", "teacher"])
def update_grade(user, item_id):
    data = request.get_json(force=True) or {}
    try:
        get_db().grades.update_one(
            {"_id": oid(item_id)},
            {"$set": {
                "student_id": oid(data.get("student_id")),
                "subject_id": oid(data.get("subject_id")),
                "semester_id": oid(data.get("semester_id")),
                "score_mieng": num_or_none(data.get("score_mieng")),
                "score_15p": num_or_none(data.get("score_15p")),
                "score_1tiet": num_or_none(data.get("score_1tiet")),
                "score_thi": num_or_none(data.get("score_thi")),
            }},
        )
    except DuplicateKeyError:
        return err("Điểm môn này đã có trong học kỳ.")
    db = get_db()
    doc = db.grades.find_one({"_id": oid(item_id)})
    return ok(grade_dict(
        doc,
        db.students.find_one({"_id": doc.get("student_id")}),
        db.subjects.find_one({"_id": doc.get("subject_id")}),
        db.semesters.find_one({"_id": doc.get("semester_id")}),
    ))


@api_bp.delete("/grades/<item_id>")
@login_required(roles=["admin", "teacher"])
def delete_grade(user, item_id):
    get_db().grades.delete_one({"_id": oid(item_id)})
    return ok()


# ---------- Transfers ----------
@api_bp.get("/transfers")
@login_required(roles=["admin", "teacher"])
def list_transfers(user):
    db = get_db()
    result = []
    for doc in db.transfers.find().sort("transfer_date", -1):
        result.append(transfer_dict(
            doc,
            db.students.find_one({"_id": doc.get("student_id")}),
            db.classes.find_one({"_id": doc.get("from_class_id")}),
            db.classes.find_one({"_id": doc.get("to_class_id")}),
        ))
    return ok(result)


@api_bp.post("/transfers")
@login_required(roles=["admin"])
def create_transfer(user):
    data = request.get_json(force=True) or {}
    db = get_db()
    student = db.students.find_one({"_id": oid(data.get("student_id"))})
    if not student:
        return err("Không tìm thấy học sinh.")
    to_class_id = oid(data.get("to_class_id"))
    if student.get("class_id") == to_class_id:
        return err("Học sinh đã ở lớp này.")
    doc = {
        "student_id": student["_id"],
        "from_class_id": student.get("class_id"),
        "to_class_id": to_class_id,
        "transfer_date": data.get("transfer_date") or datetime.utcnow().strftime("%Y-%m-%d"),
        "reason": data.get("reason"),
    }
    result = db.transfers.insert_one(doc)
    db.students.update_one({"_id": student["_id"]}, {"$set": {"class_id": to_class_id}})
    doc["_id"] = result.inserted_id
    return ok(transfer_dict(
        doc,
        student,
        db.classes.find_one({"_id": doc.get("from_class_id")}),
        db.classes.find_one({"_id": to_class_id}),
    ), 201)


# ---------- Users ----------
@api_bp.get("/users")
@login_required(roles=["admin"])
def list_users(user):
    return ok([user_dict(x) for x in get_db().users.find().sort([("role", 1), ("username", 1)])])


@api_bp.post("/users")
@login_required(roles=["admin"])
def create_user(user):
    data = request.get_json(force=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    role = data.get("role")
    if not username or not password or role not in ROLES:
        return err("Thiếu username/password/role hợp lệ.")
    doc = {
        "username": username,
        "full_name": (data.get("full_name") or username).strip(),
        "role": role,
        "password_hash": hash_password(password),
        "is_active": True,
        "teacher_id": oid(data.get("teacher_id")),
        "student_id": oid(data.get("student_id")),
    }
    try:
        result = get_db().users.insert_one(doc)
    except DuplicateKeyError:
        return err("Username đã tồn tại.")
    doc["_id"] = result.inserted_id
    return ok(user_dict(doc), 201)


@api_bp.put("/users/<item_id>")
@login_required(roles=["admin"])
def update_user(user, item_id):
    data = request.get_json(force=True) or {}
    updates = {
        "full_name": (data.get("full_name") or "").strip(),
        "role": data.get("role"),
        "is_active": str(data.get("is_active", True)).lower() in ("1", "true", "yes"),
        "teacher_id": oid(data.get("teacher_id")),
        "student_id": oid(data.get("student_id")),
    }
    if data.get("password"):
        updates["password_hash"] = hash_password(data["password"])
    get_db().users.update_one({"_id": oid(item_id)}, {"$set": updates})
    return ok(user_dict(get_db().users.find_one({"_id": oid(item_id)})))


@api_bp.delete("/users/<item_id>")
@login_required(roles=["admin"])
def delete_user(user, item_id):
    if sid(user["_id"]) == item_id:
        return err("Không thể xóa chính mình.")
    get_db().users.delete_one({"_id": oid(item_id)})
    return ok()
