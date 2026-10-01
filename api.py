import re
from datetime import datetime

from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError

from models import (
    BAN_HOC_LABELS,
    BAN_THI_LABELS,
    CONDUCT_LABELS,
    DAY_LABELS,
    GENDER_LABELS,
    GRADE_LABELS,
    STATUS_LABELS,
    ExamSchedule,
    Grade,
    Schedule,
    SchoolClass,
    Student,
    Subject,
    Teacher,
    db,
)

api_bp = Blueprint("api", __name__, url_prefix="/api")
PHONE_RE = re.compile(r"^(03|05|07|09)\d{8}$")


def parse_date(value):
    if not value:
        return None
    if isinstance(value, str):
        return datetime.strptime(value[:10], "%Y-%m-%d").date()
    return value


def ok(data=None, status=200):
    return jsonify(data if data is not None else {"ok": True}), status


def err(message, status=400):
    return jsonify({"error": message}), status


def seed_defaults():
    if Subject.query.count() == 0:
        defaults = [
            ("Toán", 4), ("Ngữ văn", 4), ("Tiếng Anh", 3),
            ("Vật lý", 2), ("Hóa học", 2), ("Sinh học", 2),
            ("Lịch sử", 2), ("Địa lý", 2), ("GDCD", 1),
            ("Thể dục", 2), ("Chào cờ", 1),
        ]
        for name, so_tiet in defaults:
            db.session.add(Subject(name=name, so_tiet=so_tiet))
        db.session.commit()


# ---------- Meta / Dashboard ----------
@api_bp.get("/health")
def health():
    return ok({"status": "ok"})


@api_bp.get("/meta")
def meta():
    return ok({
        "gender": GENDER_LABELS,
        "ban_hoc": BAN_HOC_LABELS,
        "ban_thi": BAN_THI_LABELS,
        "conduct": CONDUCT_LABELS,
        "status": STATUS_LABELS,
        "day": DAY_LABELS,
        "grade": GRADE_LABELS,
    })


@api_bp.get("/stats")
def stats():
    return ok({
        "teachers": Teacher.query.count(),
        "classes": SchoolClass.query.count(),
        "students": Student.query.count(),
        "subjects": Subject.query.count(),
        "grades": Grade.query.count(),
        "exams": ExamSchedule.query.count(),
    })


# ---------- Subjects ----------
def subject_to_dict(item):
    return {"id": item.id, "name": item.name, "so_tiet": item.so_tiet}


@api_bp.get("/subjects")
def list_subjects():
    return ok([subject_to_dict(x) for x in Subject.query.order_by(Subject.name).all()])


@api_bp.post("/subjects")
def create_subject():
    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return err("Tên môn học không được để trống.")
    item = Subject(name=name, so_tiet=int(data.get("so_tiet") or 1))
    db.session.add(item)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return err("Môn học đã tồn tại.")
    return ok(subject_to_dict(item), 201)


@api_bp.put("/subjects/<int:item_id>")
def update_subject(item_id):
    item = Subject.query.get_or_404(item_id)
    data = request.get_json(force=True) or {}
    item.name = (data.get("name") or item.name).strip()
    item.so_tiet = int(data.get("so_tiet") or item.so_tiet)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return err("Môn học đã tồn tại.")
    return ok(subject_to_dict(item))


@api_bp.delete("/subjects/<int:item_id>")
def delete_subject(item_id):
    item = Subject.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return ok()


# ---------- Teachers ----------
def teacher_to_dict(item):
    return {
        "id": item.id,
        "name": item.name,
        "teacher_code": item.teacher_code,
        "birth_year": item.birth_year,
        "gender": item.gender,
        "phone": item.phone,
        "email": item.email,
        "address": item.address,
        "subject_ids": [s.id for s in item.subjects],
        "subjects": [s.name for s in item.subjects],
    }


@api_bp.get("/teachers")
def list_teachers():
    return ok([teacher_to_dict(x) for x in Teacher.query.order_by(Teacher.name).all()])


@api_bp.post("/teachers")
def create_teacher():
    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip().title()
    phone = (data.get("phone") or "").strip() or None
    if not name:
        return err("Tên giáo viên không được để trống.")
    if phone and not PHONE_RE.match(phone):
        return err("Số điện thoại không hợp lệ.")
    item = Teacher(
        name=name,
        birth_year=int(data["birth_year"]) if data.get("birth_year") else None,
        gender=data.get("gender") or None,
        phone=phone,
        email=data.get("email") or None,
        address=data.get("address") or None,
    )
    ids = data.get("subject_ids") or []
    if ids:
        item.subjects = Subject.query.filter(Subject.id.in_(ids)).all()
    db.session.add(item)
    db.session.flush()
    item.assign_code()
    db.session.commit()
    return ok(teacher_to_dict(item), 201)


@api_bp.put("/teachers/<int:item_id>")
def update_teacher(item_id):
    item = Teacher.query.get_or_404(item_id)
    data = request.get_json(force=True) or {}
    phone = (data.get("phone") or "").strip() or None
    if phone and not PHONE_RE.match(phone):
        return err("Số điện thoại không hợp lệ.")
    item.name = (data.get("name") or item.name).strip().title()
    item.birth_year = int(data["birth_year"]) if data.get("birth_year") else None
    item.gender = data.get("gender") or None
    item.phone = phone
    item.email = data.get("email") or None
    item.address = data.get("address") or None
    ids = data.get("subject_ids") or []
    item.subjects = Subject.query.filter(Subject.id.in_(ids)).all() if ids else []
    db.session.commit()
    return ok(teacher_to_dict(item))


@api_bp.delete("/teachers/<int:item_id>")
def delete_teacher(item_id):
    item = Teacher.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return ok()


# ---------- Classes ----------
def class_to_dict(item):
    return {
        "id": item.id,
        "name": item.name,
        "grade": item.grade,
        "academic_year": item.academic_year,
        "homeroom_teacher_id": item.homeroom_teacher_id,
        "homeroom_teacher": item.homeroom_teacher.name if item.homeroom_teacher else None,
        "size": item.size,
    }


@api_bp.get("/classes")
def list_classes():
    items = SchoolClass.query.order_by(SchoolClass.academic_year.desc(), SchoolClass.name).all()
    return ok([class_to_dict(x) for x in items])


@api_bp.post("/classes")
def create_class():
    data = request.get_json(force=True) or {}
    item = SchoolClass(
        name=(data.get("name") or "").strip(),
        grade=data.get("grade"),
        academic_year=(data.get("academic_year") or "").strip(),
        homeroom_teacher_id=int(data["homeroom_teacher_id"]) if data.get("homeroom_teacher_id") else None,
    )
    if not item.name or not item.grade or not item.academic_year:
        return err("Thiếu tên lớp / khối / năm học.")
    db.session.add(item)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return err("Tên lớp + năm học đã tồn tại.")
    return ok(class_to_dict(item), 201)


@api_bp.put("/classes/<int:item_id>")
def update_class(item_id):
    item = SchoolClass.query.get_or_404(item_id)
    data = request.get_json(force=True) or {}
    item.name = (data.get("name") or item.name).strip()
    item.grade = data.get("grade") or item.grade
    item.academic_year = (data.get("academic_year") or item.academic_year).strip()
    item.homeroom_teacher_id = (
        int(data["homeroom_teacher_id"]) if data.get("homeroom_teacher_id") else None
    )
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return err("Tên lớp + năm học đã tồn tại.")
    return ok(class_to_dict(item))


@api_bp.delete("/classes/<int:item_id>")
def delete_class(item_id):
    item = SchoolClass.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return ok()


# ---------- Students ----------
def student_to_dict(item):
    return {
        "id": item.id,
        "name": item.name,
        "student_code": item.student_code,
        "birth_date": item.birth_date.isoformat() if item.birth_date else None,
        "gender": item.gender,
        "address": item.address,
        "phone": item.phone,
        "ban_hoc": item.ban_hoc,
        "conduct": item.conduct,
        "status": item.status,
        "class_id": item.class_id,
        "class_name": item.school_class.name if item.school_class else None,
        "average_year": item.average_year,
    }


@api_bp.get("/students")
def list_students():
    q = (request.args.get("q") or "").strip()
    query = Student.query
    if q:
        from sqlalchemy import or_
        query = query.filter(
            or_(Student.name.ilike(f"%{q}%"), Student.student_code.ilike(f"%{q}%"))
        )
    return ok([student_to_dict(x) for x in query.order_by(Student.name).all()])


@api_bp.post("/students")
def create_student():
    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip().title()
    phone = (data.get("phone") or "").strip() or None
    if not name:
        return err("Tên học sinh không được để trống.")
    if phone and not PHONE_RE.match(phone):
        return err("Số điện thoại không hợp lệ.")
    item = Student(
        name=name,
        birth_date=parse_date(data.get("birth_date")),
        gender=data.get("gender") or None,
        address=data.get("address") or None,
        phone=phone,
        ban_hoc=data.get("ban_hoc") or "tu_nhien",
        conduct=data.get("conduct") or None,
        status=data.get("status") or "studying",
        class_id=int(data["class_id"]) if data.get("class_id") else None,
    )
    db.session.add(item)
    db.session.flush()
    item.assign_code()
    db.session.commit()
    return ok(student_to_dict(item), 201)


@api_bp.put("/students/<int:item_id>")
def update_student(item_id):
    item = Student.query.get_or_404(item_id)
    data = request.get_json(force=True) or {}
    phone = (data.get("phone") or "").strip() or None
    if phone and not PHONE_RE.match(phone):
        return err("Số điện thoại không hợp lệ.")
    item.name = (data.get("name") or item.name).strip().title()
    item.birth_date = parse_date(data.get("birth_date"))
    item.gender = data.get("gender") or None
    item.address = data.get("address") or None
    item.phone = phone
    item.ban_hoc = data.get("ban_hoc") or "tu_nhien"
    item.conduct = data.get("conduct") or None
    item.status = data.get("status") or "studying"
    item.class_id = int(data["class_id"]) if data.get("class_id") else None
    db.session.commit()
    return ok(student_to_dict(item))


@api_bp.delete("/students/<int:item_id>")
def delete_student(item_id):
    item = Student.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return ok()


# ---------- Grades ----------
def grade_to_dict(item):
    return {
        "id": item.id,
        "student_id": item.student_id,
        "student_name": item.student.name if item.student else None,
        "student_code": item.student.student_code if item.student else None,
        "subject_id": item.subject_id,
        "subject_name": item.subject.name if item.subject else None,
        "year": item.year,
        "semester_1_score": item.semester_1_score,
        "semester_2_score": item.semester_2_score,
        "average_score": item.average_score,
    }


@api_bp.get("/grades")
def list_grades():
    items = Grade.query.order_by(Grade.year.desc(), Grade.id.desc()).all()
    return ok([grade_to_dict(x) for x in items])


@api_bp.post("/grades")
def create_grade():
    data = request.get_json(force=True) or {}
    item = Grade(
        student_id=int(data["student_id"]),
        subject_id=int(data["subject_id"]),
        year=(data.get("year") or "").strip(),
        semester_1_score=float(data["semester_1_score"]) if data.get("semester_1_score") not in (None, "") else None,
        semester_2_score=float(data["semester_2_score"]) if data.get("semester_2_score") not in (None, "") else None,
    )
    db.session.add(item)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return err("Điểm môn này đã tồn tại cho học sinh trong năm học.")
    return ok(grade_to_dict(item), 201)


@api_bp.put("/grades/<int:item_id>")
def update_grade(item_id):
    item = Grade.query.get_or_404(item_id)
    data = request.get_json(force=True) or {}
    item.student_id = int(data["student_id"])
    item.subject_id = int(data["subject_id"])
    item.year = (data.get("year") or item.year).strip()
    item.semester_1_score = (
        float(data["semester_1_score"]) if data.get("semester_1_score") not in (None, "") else None
    )
    item.semester_2_score = (
        float(data["semester_2_score"]) if data.get("semester_2_score") not in (None, "") else None
    )
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return err("Điểm môn này đã tồn tại cho học sinh trong năm học.")
    return ok(grade_to_dict(item))


@api_bp.delete("/grades/<int:item_id>")
def delete_grade(item_id):
    item = Grade.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return ok()


# ---------- Schedules ----------
def schedule_to_dict(item):
    return {
        "id": item.id,
        "class_id": item.class_id,
        "class_name": item.school_class.name if item.school_class else None,
        "subject_id": item.subject_id,
        "subject_name": item.subject.name if item.subject else None,
        "teacher_id": item.teacher_id,
        "teacher_name": item.teacher.name if item.teacher else None,
        "day_of_week": item.day_of_week,
        "period": item.period,
    }


@api_bp.get("/schedules")
def list_schedules():
    class_id = request.args.get("class_id", type=int)
    query = Schedule.query
    if class_id:
        query = query.filter_by(class_id=class_id)
    items = query.order_by(Schedule.day_of_week, Schedule.period).all()
    return ok([schedule_to_dict(x) for x in items])


@api_bp.post("/schedules")
def create_schedule():
    data = request.get_json(force=True) or {}
    item = Schedule(
        class_id=int(data["class_id"]),
        subject_id=int(data["subject_id"]),
        teacher_id=int(data["teacher_id"]),
        day_of_week=data.get("day_of_week"),
        period=str(data.get("period")),
    )
    db.session.add(item)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return err("Tiết học này đã có môn trong lớp.")
    return ok(schedule_to_dict(item), 201)


@api_bp.delete("/schedules/<int:item_id>")
def delete_schedule(item_id):
    item = Schedule.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return ok()


# ---------- Exams ----------
def exam_to_dict(item):
    return {
        "id": item.id,
        "name": item.name,
        "subject_id": item.subject_id,
        "subject_name": item.subject.name if item.subject else None,
        "grade": item.grade,
        "exam_date": item.exam_date.isoformat() if item.exam_date else None,
        "start_time": item.start_time,
        "end_time": item.end_time,
        "ban_thi": item.ban_thi,
    }


@api_bp.get("/exams")
def list_exams():
    items = ExamSchedule.query.order_by(ExamSchedule.exam_date.desc()).all()
    return ok([exam_to_dict(x) for x in items])


@api_bp.post("/exams")
def create_exam():
    data = request.get_json(force=True) or {}
    start = data.get("start_time")
    end = data.get("end_time")
    if start and end and start >= end:
        return err("Giờ bắt đầu phải nhỏ hơn giờ kết thúc.")
    item = ExamSchedule(
        name=(data.get("name") or "").strip(),
        subject_id=int(data["subject_id"]),
        grade=data.get("grade"),
        exam_date=parse_date(data.get("exam_date")),
        start_time=start,
        end_time=end,
        ban_thi=data.get("ban_thi") or "bat_buoc",
    )
    db.session.add(item)
    db.session.commit()
    return ok(exam_to_dict(item), 201)


@api_bp.put("/exams/<int:item_id>")
def update_exam(item_id):
    item = ExamSchedule.query.get_or_404(item_id)
    data = request.get_json(force=True) or {}
    start = data.get("start_time")
    end = data.get("end_time")
    if start and end and start >= end:
        return err("Giờ bắt đầu phải nhỏ hơn giờ kết thúc.")
    item.name = (data.get("name") or item.name).strip()
    item.subject_id = int(data["subject_id"])
    item.grade = data.get("grade") or item.grade
    item.exam_date = parse_date(data.get("exam_date"))
    item.start_time = start
    item.end_time = end
    item.ban_thi = data.get("ban_thi") or "bat_buoc"
    db.session.commit()
    return ok(exam_to_dict(item))


@api_bp.delete("/exams/<int:item_id>")
def delete_exam(item_id):
    item = ExamSchedule.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return ok()
