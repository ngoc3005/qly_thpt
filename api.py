from datetime import datetime
from functools import wraps

from flask import Blueprint, jsonify, request, session
from sqlalchemy.exc import IntegrityError

from models import (
    BAN_HOC,
    CONDUCT,
    GENDER,
    GRADE_LEVEL,
    ROLES,
    STATUS,
    ClassTransfer,
    Grade,
    SchoolClass,
    Semester,
    Student,
    Subject,
    Teacher,
    User,
    db,
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
    return User.query.get(uid)


def login_required(roles=None):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = current_user()
            if not user or not user.is_active:
                return err("Chưa đăng nhập.", 401)
            if roles and user.role not in roles:
                return err("Không có quyền thực hiện.", 403)
            return fn(user, *args, **kwargs)

        return wrapper

    return decorator


def parse_date(value):
    if not value:
        return None
    return datetime.strptime(value[:10], "%Y-%m-%d").date()


def num_or_none(value):
    if value in (None, ""):
        return None
    return float(value)


# ---------- Auth ----------
@api_bp.post("/auth/login")
def login():
    data = request.get_json(force=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password) or not user.is_active:
        return err("Sai tên đăng nhập hoặc mật khẩu.", 401)
    session["user_id"] = user.id
    return ok(user.to_dict())


@api_bp.post("/auth/logout")
def logout():
    session.clear()
    return ok()


@api_bp.get("/auth/me")
def me():
    user = current_user()
    if not user:
        return ok({"user": None})
    return ok({"user": user.to_dict()})


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
        "role": user.role,
    })


@api_bp.get("/stats")
@login_required(roles=["admin", "teacher"])
def stats(user):
    return ok({
        "teachers": Teacher.query.count(),
        "students": Student.query.count(),
        "classes": SchoolClass.query.count(),
        "subjects": Subject.query.count(),
        "semesters": Semester.query.count(),
        "grades": Grade.query.count(),
        "transfers": ClassTransfer.query.count(),
        "users": User.query.count(),
    })


# ---------- Teachers ----------
@api_bp.get("/teachers")
@login_required(roles=["admin", "teacher"])
def list_teachers(user):
    return ok([t.to_dict() for t in Teacher.query.order_by(Teacher.name).all()])


@api_bp.post("/teachers")
@login_required(roles=["admin"])
def create_teacher(user):
    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip().title()
    if not name:
        return err("Tên giáo viên bắt buộc.")
    item = Teacher(
        name=name,
        gender=data.get("gender"),
        phone=data.get("phone"),
        email=data.get("email"),
        subject_name=data.get("subject_name"),
    )
    db.session.add(item)
    db.session.flush()
    item.assign_code()
    db.session.commit()
    return ok(item.to_dict(), 201)


@api_bp.put("/teachers/<int:item_id>")
@login_required(roles=["admin"])
def update_teacher(user, item_id):
    item = Teacher.query.get_or_404(item_id)
    data = request.get_json(force=True) or {}
    item.name = (data.get("name") or item.name).strip().title()
    item.gender = data.get("gender")
    item.phone = data.get("phone")
    item.email = data.get("email")
    item.subject_name = data.get("subject_name")
    db.session.commit()
    return ok(item.to_dict())


@api_bp.delete("/teachers/<int:item_id>")
@login_required(roles=["admin"])
def delete_teacher(user, item_id):
    item = Teacher.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return ok()


# ---------- Classes ----------
@api_bp.get("/classes")
@login_required()
def list_classes(user):
    items = SchoolClass.query.order_by(SchoolClass.academic_year.desc(), SchoolClass.name).all()
    return ok([c.to_dict() for c in items])


@api_bp.post("/classes")
@login_required(roles=["admin"])
def create_class(user):
    data = request.get_json(force=True) or {}
    item = SchoolClass(
        name=(data.get("name") or "").strip(),
        grade_level=data.get("grade_level"),
        academic_year=(data.get("academic_year") or "").strip(),
        homeroom_teacher_id=int(data["homeroom_teacher_id"]) if data.get("homeroom_teacher_id") else None,
    )
    if not item.name or not item.grade_level or not item.academic_year:
        return err("Thiếu tên lớp / khối / năm học.")
    db.session.add(item)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return err("Lớp + năm học đã tồn tại.")
    return ok(item.to_dict(), 201)


@api_bp.put("/classes/<int:item_id>")
@login_required(roles=["admin"])
def update_class(user, item_id):
    item = SchoolClass.query.get_or_404(item_id)
    data = request.get_json(force=True) or {}
    item.name = (data.get("name") or item.name).strip()
    item.grade_level = data.get("grade_level") or item.grade_level
    item.academic_year = (data.get("academic_year") or item.academic_year).strip()
    item.homeroom_teacher_id = int(data["homeroom_teacher_id"]) if data.get("homeroom_teacher_id") else None
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return err("Lớp + năm học đã tồn tại.")
    return ok(item.to_dict())


@api_bp.delete("/classes/<int:item_id>")
@login_required(roles=["admin"])
def delete_class(user, item_id):
    item = SchoolClass.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return ok()


# ---------- Students ----------
@api_bp.get("/students")
@login_required()
def list_students(user):
    if user.role == "parent":
        if not user.student_id:
            return ok([])
        s = Student.query.get(user.student_id)
        return ok([s.to_dict()] if s else [])
    q = (request.args.get("q") or "").strip()
    query = Student.query
    if q:
        from sqlalchemy import or_
        query = query.filter(or_(Student.name.ilike(f"%{q}%"), Student.code.ilike(f"%{q}%")))
    return ok([s.to_dict() for s in query.order_by(Student.name).all()])


@api_bp.post("/students")
@login_required(roles=["admin"])
def create_student(user):
    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip().title()
    if not name:
        return err("Tên học sinh bắt buộc.")
    item = Student(
        name=name,
        birth_date=parse_date(data.get("birth_date")),
        gender=data.get("gender"),
        phone=data.get("phone"),
        address=data.get("address"),
        ban_hoc=data.get("ban_hoc") or "tu_nhien",
        conduct=data.get("conduct") or "tot",
        status=data.get("status") or "studying",
        parent_name=data.get("parent_name"),
        class_id=int(data["class_id"]) if data.get("class_id") else None,
    )
    db.session.add(item)
    db.session.flush()
    item.assign_code()
    db.session.commit()
    return ok(item.to_dict(), 201)


@api_bp.put("/students/<int:item_id>")
@login_required(roles=["admin"])
def update_student(user, item_id):
    item = Student.query.get_or_404(item_id)
    data = request.get_json(force=True) or {}
    item.name = (data.get("name") or item.name).strip().title()
    item.birth_date = parse_date(data.get("birth_date"))
    item.gender = data.get("gender")
    item.phone = data.get("phone")
    item.address = data.get("address")
    item.ban_hoc = data.get("ban_hoc") or item.ban_hoc
    item.conduct = data.get("conduct") or item.conduct
    item.status = data.get("status") or item.status
    item.parent_name = data.get("parent_name")
    item.class_id = int(data["class_id"]) if data.get("class_id") else None
    db.session.commit()
    return ok(item.to_dict())


@api_bp.delete("/students/<int:item_id>")
@login_required(roles=["admin"])
def delete_student(user, item_id):
    item = Student.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return ok()


# ---------- Subjects ----------
@api_bp.get("/subjects")
@login_required()
def list_subjects(user):
    return ok([s.to_dict() for s in Subject.query.order_by(Subject.name).all()])


@api_bp.post("/subjects")
@login_required(roles=["admin"])
def create_subject(user):
    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return err("Tên môn bắt buộc.")
    item = Subject(name=name, periods=int(data.get("periods") or 2))
    db.session.add(item)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return err("Môn đã tồn tại.")
    return ok(item.to_dict(), 201)


@api_bp.put("/subjects/<int:item_id>")
@login_required(roles=["admin"])
def update_subject(user, item_id):
    item = Subject.query.get_or_404(item_id)
    data = request.get_json(force=True) or {}
    item.name = (data.get("name") or item.name).strip()
    item.periods = int(data.get("periods") or item.periods)
    db.session.commit()
    return ok(item.to_dict())


@api_bp.delete("/subjects/<int:item_id>")
@login_required(roles=["admin"])
def delete_subject(user, item_id):
    item = Subject.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return ok()


# ---------- Semesters ----------
@api_bp.get("/semesters")
@login_required()
def list_semesters(user):
    items = Semester.query.order_by(Semester.academic_year.desc(), Semester.name).all()
    return ok([s.to_dict() for s in items])


@api_bp.post("/semesters")
@login_required(roles=["admin"])
def create_semester(user):
    data = request.get_json(force=True) or {}
    item = Semester(
        name=(data.get("name") or "").strip(),
        academic_year=(data.get("academic_year") or "").strip(),
        is_current=bool(data.get("is_current")),
    )
    if not item.name or not item.academic_year:
        return err("Thiếu tên học kỳ / năm học.")
    if item.is_current:
        Semester.query.update({Semester.is_current: False})
    db.session.add(item)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return err("Học kỳ đã tồn tại.")
    return ok(item.to_dict(), 201)


@api_bp.put("/semesters/<int:item_id>")
@login_required(roles=["admin"])
def update_semester(user, item_id):
    item = Semester.query.get_or_404(item_id)
    data = request.get_json(force=True) or {}
    item.name = (data.get("name") or item.name).strip()
    item.academic_year = (data.get("academic_year") or item.academic_year).strip()
    item.is_current = bool(data.get("is_current"))
    if item.is_current:
        Semester.query.filter(Semester.id != item.id).update({Semester.is_current: False})
    db.session.commit()
    return ok(item.to_dict())


@api_bp.delete("/semesters/<int:item_id>")
@login_required(roles=["admin"])
def delete_semester(user, item_id):
    item = Semester.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return ok()


# ---------- Grades ----------
@api_bp.get("/grades")
@login_required()
def list_grades(user):
    query = Grade.query
    if user.role == "parent":
        if not user.student_id:
            return ok([])
        query = query.filter_by(student_id=user.student_id)
    student_id = request.args.get("student_id", type=int)
    semester_id = request.args.get("semester_id", type=int)
    if student_id:
        query = query.filter_by(student_id=student_id)
    if semester_id:
        query = query.filter_by(semester_id=semester_id)
    items = query.order_by(Grade.id.desc()).all()
    return ok([g.to_dict() for g in items])


@api_bp.post("/grades")
@login_required(roles=["admin", "teacher"])
def create_grade(user):
    data = request.get_json(force=True) or {}
    item = Grade(
        student_id=int(data["student_id"]),
        subject_id=int(data["subject_id"]),
        semester_id=int(data["semester_id"]),
        score_mieng=num_or_none(data.get("score_mieng")),
        score_15p=num_or_none(data.get("score_15p")),
        score_1tiet=num_or_none(data.get("score_1tiet")),
        score_thi=num_or_none(data.get("score_thi")),
    )
    db.session.add(item)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return err("Điểm môn này đã có trong học kỳ.")
    return ok(item.to_dict(), 201)


@api_bp.put("/grades/<int:item_id>")
@login_required(roles=["admin", "teacher"])
def update_grade(user, item_id):
    item = Grade.query.get_or_404(item_id)
    data = request.get_json(force=True) or {}
    item.student_id = int(data["student_id"])
    item.subject_id = int(data["subject_id"])
    item.semester_id = int(data["semester_id"])
    item.score_mieng = num_or_none(data.get("score_mieng"))
    item.score_15p = num_or_none(data.get("score_15p"))
    item.score_1tiet = num_or_none(data.get("score_1tiet"))
    item.score_thi = num_or_none(data.get("score_thi"))
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return err("Điểm môn này đã có trong học kỳ.")
    return ok(item.to_dict())


@api_bp.delete("/grades/<int:item_id>")
@login_required(roles=["admin", "teacher"])
def delete_grade(user, item_id):
    item = Grade.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return ok()


# ---------- Class transfer ----------
@api_bp.get("/transfers")
@login_required(roles=["admin", "teacher"])
def list_transfers(user):
    items = ClassTransfer.query.order_by(ClassTransfer.transfer_date.desc()).all()
    return ok([t.to_dict() for t in items])


@api_bp.post("/transfers")
@login_required(roles=["admin"])
def create_transfer(user):
    data = request.get_json(force=True) or {}
    student = Student.query.get_or_404(int(data["student_id"]))
    to_class_id = int(data["to_class_id"])
    if student.class_id == to_class_id:
        return err("Học sinh đã ở lớp này.")
    transfer = ClassTransfer(
        student_id=student.id,
        from_class_id=student.class_id,
        to_class_id=to_class_id,
        transfer_date=parse_date(data.get("transfer_date")) or datetime.utcnow().date(),
        reason=data.get("reason"),
    )
    student.class_id = to_class_id
    db.session.add(transfer)
    db.session.commit()
    return ok(transfer.to_dict(), 201)


# ---------- Users / accounts ----------
@api_bp.get("/users")
@login_required(roles=["admin"])
def list_users(user):
    return ok([u.to_dict() for u in User.query.order_by(User.role, User.username).all()])


@api_bp.post("/users")
@login_required(roles=["admin"])
def create_user(user):
    data = request.get_json(force=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    role = data.get("role")
    if not username or not password or role not in ROLES:
        return err("Thiếu username/password/role hợp lệ.")
    item = User(
        username=username,
        full_name=(data.get("full_name") or username).strip(),
        role=role,
        teacher_id=int(data["teacher_id"]) if data.get("teacher_id") else None,
        student_id=int(data["student_id"]) if data.get("student_id") else None,
        is_active=True,
    )
    item.set_password(password)
    db.session.add(item)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return err("Username đã tồn tại.")
    return ok(item.to_dict(), 201)


@api_bp.put("/users/<int:item_id>")
@login_required(roles=["admin"])
def update_user(user, item_id):
    item = User.query.get_or_404(item_id)
    data = request.get_json(force=True) or {}
    item.full_name = (data.get("full_name") or item.full_name).strip()
    item.role = data.get("role") or item.role
    item.is_active = bool(data.get("is_active", item.is_active))
    item.teacher_id = int(data["teacher_id"]) if data.get("teacher_id") else None
    item.student_id = int(data["student_id"]) if data.get("student_id") else None
    if data.get("password"):
        item.set_password(data["password"])
    db.session.commit()
    return ok(item.to_dict())


@api_bp.delete("/users/<int:item_id>")
@login_required(roles=["admin"])
def delete_user(user, item_id):
    item = User.query.get_or_404(item_id)
    if item.id == user.id:
        return err("Không thể xóa chính mình.")
    db.session.delete(item)
    db.session.commit()
    return ok()
