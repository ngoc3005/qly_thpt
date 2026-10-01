import os
import re
from datetime import datetime

from flask import Flask, flash, redirect, render_template, request, url_for
from sqlalchemy import inspect, or_

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

PHONE_RE = re.compile(r"^(03|05|07|09)\d{8}$")


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "quan-ly-thpt-azure-dev")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
        "DATABASE_URL",
        "sqlite:///" + os.path.join(os.path.dirname(__file__), "school.db"),
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    with app.app_context():
        db.create_all()
        seed_defaults()

    register_routes(app)
    return app


def seed_defaults():
    """Tạo sẵn một số môn học phổ biến nếu DB trống."""
    if Subject.query.count() == 0:
        defaults = [
            ("Toán", 4),
            ("Ngữ văn", 4),
            ("Tiếng Anh", 3),
            ("Vật lý", 2),
            ("Hóa học", 2),
            ("Sinh học", 2),
            ("Lịch sử", 2),
            ("Địa lý", 2),
            ("GDCD", 1),
            ("Thể dục", 2),
            ("Chào cờ", 1),
        ]
        for name, so_tiet in defaults:
            db.session.add(Subject(name=name, so_tiet=so_tiet))
        db.session.commit()


def parse_date(value):
    if not value:
        return None
    return datetime.strptime(value, "%Y-%m-%d").date()


def validate_phone(phone):
    if phone and not PHONE_RE.match(phone):
        return "Số điện thoại phải gồm 10 số và bắt đầu bằng 03, 05, 07 hoặc 09."
    return None


def register_routes(app):
    @app.context_processor
    def inject_labels():
        return {
            "GENDER_LABELS": GENDER_LABELS,
            "BAN_HOC_LABELS": BAN_HOC_LABELS,
            "BAN_THI_LABELS": BAN_THI_LABELS,
            "CONDUCT_LABELS": CONDUCT_LABELS,
            "STATUS_LABELS": STATUS_LABELS,
            "DAY_LABELS": DAY_LABELS,
            "GRADE_LABELS": GRADE_LABELS,
        }

    # ---------- Dashboard ----------
    @app.route("/")
    def index():
        return render_template(
            "index.html",
            student_count=Student.query.count(),
            teacher_count=Teacher.query.count(),
            class_count=SchoolClass.query.count(),
            subject_count=Subject.query.count(),
            grade_count=Grade.query.count(),
            exam_count=ExamSchedule.query.count(),
        )

    # ---------- Subjects ----------
    @app.route("/subjects")
    def subjects():
        return render_template("subjects.html", items=Subject.query.order_by(Subject.name).all())

    @app.route("/subjects/new", methods=["GET", "POST"])
    def subject_new():
        if request.method == "POST":
            name = request.form.get("name", "").strip()
            so_tiet = int(request.form.get("so_tiet") or 1)
            if not name:
                flash("Tên môn học không được để trống.", "danger")
            else:
                db.session.add(Subject(name=name, so_tiet=so_tiet))
                db.session.commit()
                flash("Đã thêm môn học.", "success")
                return redirect(url_for("subjects"))
        return render_template("subject_form.html", item=None)

    @app.route("/subjects/<int:item_id>/edit", methods=["GET", "POST"])
    def subject_edit(item_id):
        item = Subject.query.get_or_404(item_id)
        if request.method == "POST":
            item.name = request.form.get("name", "").strip()
            item.so_tiet = int(request.form.get("so_tiet") or 1)
            db.session.commit()
            flash("Đã cập nhật môn học.", "success")
            return redirect(url_for("subjects"))
        return render_template("subject_form.html", item=item)

    @app.route("/subjects/<int:item_id>/delete", methods=["POST"])
    def subject_delete(item_id):
        item = Subject.query.get_or_404(item_id)
        db.session.delete(item)
        db.session.commit()
        flash("Đã xóa môn học.", "success")
        return redirect(url_for("subjects"))

    # ---------- Teachers ----------
    @app.route("/teachers")
    def teachers():
        return render_template("teachers.html", items=Teacher.query.order_by(Teacher.name).all())

    @app.route("/teachers/new", methods=["GET", "POST"])
    def teacher_new():
        subjects_list = Subject.query.order_by(Subject.name).all()
        if request.method == "POST":
            phone = request.form.get("phone", "").strip()
            err = validate_phone(phone)
            if err:
                flash(err, "danger")
            else:
                teacher = Teacher(
                    name=request.form.get("name", "").strip().title(),
                    birth_year=int(request.form["birth_year"]) if request.form.get("birth_year") else None,
                    gender=request.form.get("gender") or None,
                    phone=phone or None,
                    email=request.form.get("email") or None,
                    address=request.form.get("address") or None,
                )
                selected = request.form.getlist("subject_ids")
                teacher.subjects = Subject.query.filter(Subject.id.in_(selected)).all() if selected else []
                db.session.add(teacher)
                db.session.flush()
                teacher.assign_code()
                db.session.commit()
                flash("Đã thêm giáo viên.", "success")
                return redirect(url_for("teachers"))
        return render_template("teacher_form.html", item=None, subjects=subjects_list)

    @app.route("/teachers/<int:item_id>/edit", methods=["GET", "POST"])
    def teacher_edit(item_id):
        item = Teacher.query.get_or_404(item_id)
        subjects_list = Subject.query.order_by(Subject.name).all()
        if request.method == "POST":
            phone = request.form.get("phone", "").strip()
            err = validate_phone(phone)
            if err:
                flash(err, "danger")
            else:
                item.name = request.form.get("name", "").strip().title()
                item.birth_year = int(request.form["birth_year"]) if request.form.get("birth_year") else None
                item.gender = request.form.get("gender") or None
                item.phone = phone or None
                item.email = request.form.get("email") or None
                item.address = request.form.get("address") or None
                selected = request.form.getlist("subject_ids")
                item.subjects = Subject.query.filter(Subject.id.in_(selected)).all() if selected else []
                db.session.commit()
                flash("Đã cập nhật giáo viên.", "success")
                return redirect(url_for("teachers"))
        return render_template("teacher_form.html", item=item, subjects=subjects_list)

    @app.route("/teachers/<int:item_id>/delete", methods=["POST"])
    def teacher_delete(item_id):
        item = Teacher.query.get_or_404(item_id)
        db.session.delete(item)
        db.session.commit()
        flash("Đã xóa giáo viên.", "success")
        return redirect(url_for("teachers"))

    # ---------- Classes ----------
    @app.route("/classes")
    def classes():
        return render_template(
            "classes.html",
            items=SchoolClass.query.order_by(SchoolClass.academic_year.desc(), SchoolClass.name).all(),
        )

    @app.route("/classes/new", methods=["GET", "POST"])
    def class_new():
        teachers_list = Teacher.query.order_by(Teacher.name).all()
        if request.method == "POST":
            school_class = SchoolClass(
                name=request.form.get("name", "").strip(),
                grade=request.form.get("grade"),
                academic_year=request.form.get("academic_year", "").strip(),
                homeroom_teacher_id=int(request.form["homeroom_teacher_id"])
                if request.form.get("homeroom_teacher_id")
                else None,
            )
            db.session.add(school_class)
            try:
                db.session.commit()
                flash("Đã thêm lớp học.", "success")
                return redirect(url_for("classes"))
            except Exception:
                db.session.rollback()
                flash("Tên lớp + năm học đã tồn tại.", "danger")
        return render_template("class_form.html", item=None, teachers=teachers_list)

    @app.route("/classes/<int:item_id>/edit", methods=["GET", "POST"])
    def class_edit(item_id):
        item = SchoolClass.query.get_or_404(item_id)
        teachers_list = Teacher.query.order_by(Teacher.name).all()
        if request.method == "POST":
            item.name = request.form.get("name", "").strip()
            item.grade = request.form.get("grade")
            item.academic_year = request.form.get("academic_year", "").strip()
            item.homeroom_teacher_id = (
                int(request.form["homeroom_teacher_id"]) if request.form.get("homeroom_teacher_id") else None
            )
            try:
                db.session.commit()
                flash("Đã cập nhật lớp học.", "success")
                return redirect(url_for("classes"))
            except Exception:
                db.session.rollback()
                flash("Tên lớp + năm học đã tồn tại.", "danger")
        return render_template("class_form.html", item=item, teachers=teachers_list)

    @app.route("/classes/<int:item_id>/delete", methods=["POST"])
    def class_delete(item_id):
        item = SchoolClass.query.get_or_404(item_id)
        db.session.delete(item)
        db.session.commit()
        flash("Đã xóa lớp học.", "success")
        return redirect(url_for("classes"))

    # ---------- Students ----------
    @app.route("/students")
    def students():
        q = request.args.get("q", "").strip()
        query = Student.query
        if q:
            query = query.filter(
                or_(Student.name.ilike(f"%{q}%"), Student.student_code.ilike(f"%{q}%"))
            )
        return render_template(
            "students.html",
            items=query.order_by(Student.name).all(),
            q=q,
        )

    @app.route("/students/new", methods=["GET", "POST"])
    def student_new():
        classes_list = SchoolClass.query.order_by(SchoolClass.name).all()
        if request.method == "POST":
            phone = request.form.get("phone", "").strip()
            err = validate_phone(phone)
            if err:
                flash(err, "danger")
            else:
                student = Student(
                    name=request.form.get("name", "").strip().title(),
                    birth_date=parse_date(request.form.get("birth_date")),
                    gender=request.form.get("gender") or None,
                    address=request.form.get("address") or None,
                    phone=phone or None,
                    ban_hoc=request.form.get("ban_hoc") or "tu_nhien",
                    conduct=request.form.get("conduct") or None,
                    status=request.form.get("status") or "studying",
                    class_id=int(request.form["class_id"]) if request.form.get("class_id") else None,
                )
                db.session.add(student)
                db.session.flush()
                student.assign_code()
                db.session.commit()
                flash("Đã thêm học sinh.", "success")
                return redirect(url_for("students"))
        return render_template("student_form.html", item=None, classes=classes_list)

    @app.route("/students/<int:item_id>/edit", methods=["GET", "POST"])
    def student_edit(item_id):
        item = Student.query.get_or_404(item_id)
        classes_list = SchoolClass.query.order_by(SchoolClass.name).all()
        if request.method == "POST":
            phone = request.form.get("phone", "").strip()
            err = validate_phone(phone)
            if err:
                flash(err, "danger")
            else:
                item.name = request.form.get("name", "").strip().title()
                item.birth_date = parse_date(request.form.get("birth_date"))
                item.gender = request.form.get("gender") or None
                item.address = request.form.get("address") or None
                item.phone = phone or None
                item.ban_hoc = request.form.get("ban_hoc") or "tu_nhien"
                item.conduct = request.form.get("conduct") or None
                item.status = request.form.get("status") or "studying"
                item.class_id = int(request.form["class_id"]) if request.form.get("class_id") else None
                db.session.commit()
                flash("Đã cập nhật học sinh.", "success")
                return redirect(url_for("students"))
        return render_template("student_form.html", item=item, classes=classes_list)

    @app.route("/students/<int:item_id>/delete", methods=["POST"])
    def student_delete(item_id):
        item = Student.query.get_or_404(item_id)
        db.session.delete(item)
        db.session.commit()
        flash("Đã xóa học sinh.", "success")
        return redirect(url_for("students"))

    # ---------- Grades ----------
    @app.route("/grades")
    def grades():
        return render_template(
            "grades.html",
            items=Grade.query.order_by(Grade.year.desc(), Grade.id.desc()).all(),
        )

    @app.route("/grades/new", methods=["GET", "POST"])
    def grade_new():
        students_list = Student.query.order_by(Student.name).all()
        subjects_list = Subject.query.order_by(Subject.name).all()
        if request.method == "POST":
            grade = Grade(
                student_id=int(request.form["student_id"]),
                subject_id=int(request.form["subject_id"]),
                year=request.form.get("year", "").strip(),
                semester_1_score=float(request.form["semester_1_score"])
                if request.form.get("semester_1_score")
                else None,
                semester_2_score=float(request.form["semester_2_score"])
                if request.form.get("semester_2_score")
                else None,
            )
            db.session.add(grade)
            try:
                db.session.commit()
                flash("Đã nhập điểm.", "success")
                return redirect(url_for("grades"))
            except Exception:
                db.session.rollback()
                flash("Điểm môn này đã tồn tại cho học sinh trong năm học.", "danger")
        return render_template(
            "grade_form.html", item=None, students=students_list, subjects=subjects_list
        )

    @app.route("/grades/<int:item_id>/edit", methods=["GET", "POST"])
    def grade_edit(item_id):
        item = Grade.query.get_or_404(item_id)
        students_list = Student.query.order_by(Student.name).all()
        subjects_list = Subject.query.order_by(Subject.name).all()
        if request.method == "POST":
            item.student_id = int(request.form["student_id"])
            item.subject_id = int(request.form["subject_id"])
            item.year = request.form.get("year", "").strip()
            item.semester_1_score = (
                float(request.form["semester_1_score"]) if request.form.get("semester_1_score") else None
            )
            item.semester_2_score = (
                float(request.form["semester_2_score"]) if request.form.get("semester_2_score") else None
            )
            try:
                db.session.commit()
                flash("Đã cập nhật điểm.", "success")
                return redirect(url_for("grades"))
            except Exception:
                db.session.rollback()
                flash("Điểm môn này đã tồn tại cho học sinh trong năm học.", "danger")
        return render_template(
            "grade_form.html", item=item, students=students_list, subjects=subjects_list
        )

    @app.route("/grades/<int:item_id>/delete", methods=["POST"])
    def grade_delete(item_id):
        item = Grade.query.get_or_404(item_id)
        db.session.delete(item)
        db.session.commit()
        flash("Đã xóa điểm.", "success")
        return redirect(url_for("grades"))

    # ---------- Schedules ----------
    @app.route("/schedules")
    def schedules():
        class_id = request.args.get("class_id", type=int)
        items = Schedule.query
        if class_id:
            items = items.filter_by(class_id=class_id)
        return render_template(
            "schedules.html",
            items=items.order_by(Schedule.day_of_week, Schedule.period).all(),
            classes=SchoolClass.query.order_by(SchoolClass.name).all(),
            selected_class_id=class_id,
        )

    @app.route("/schedules/new", methods=["GET", "POST"])
    def schedule_new():
        classes_list = SchoolClass.query.order_by(SchoolClass.name).all()
        subjects_list = Subject.query.order_by(Subject.name).all()
        teachers_list = Teacher.query.order_by(Teacher.name).all()
        if request.method == "POST":
            schedule = Schedule(
                class_id=int(request.form["class_id"]),
                subject_id=int(request.form["subject_id"]),
                teacher_id=int(request.form["teacher_id"]),
                day_of_week=request.form.get("day_of_week"),
                period=request.form.get("period"),
            )
            db.session.add(schedule)
            try:
                db.session.commit()
                flash("Đã thêm tiết học.", "success")
                return redirect(url_for("schedules", class_id=schedule.class_id))
            except Exception:
                db.session.rollback()
                flash("Tiết học này đã có môn trong lớp.", "danger")
        return render_template(
            "schedule_form.html",
            item=None,
            classes=classes_list,
            subjects=subjects_list,
            teachers=teachers_list,
        )

    @app.route("/schedules/<int:item_id>/delete", methods=["POST"])
    def schedule_delete(item_id):
        item = Schedule.query.get_or_404(item_id)
        class_id = item.class_id
        db.session.delete(item)
        db.session.commit()
        flash("Đã xóa tiết học.", "success")
        return redirect(url_for("schedules", class_id=class_id))

    # ---------- Exam schedules ----------
    @app.route("/exams")
    def exams():
        return render_template(
            "exams.html",
            items=ExamSchedule.query.order_by(ExamSchedule.exam_date.desc()).all(),
        )

    @app.route("/exams/new", methods=["GET", "POST"])
    def exam_new():
        subjects_list = Subject.query.order_by(Subject.name).all()
        if request.method == "POST":
            start = request.form.get("start_time")
            end = request.form.get("end_time")
            if start >= end:
                flash("Giờ bắt đầu phải nhỏ hơn giờ kết thúc.", "danger")
            else:
                exam = ExamSchedule(
                    name=request.form.get("name", "").strip(),
                    subject_id=int(request.form["subject_id"]),
                    grade=request.form.get("grade"),
                    exam_date=parse_date(request.form.get("exam_date")),
                    start_time=start,
                    end_time=end,
                    ban_thi=request.form.get("ban_thi") or "bat_buoc",
                )
                db.session.add(exam)
                db.session.commit()
                flash("Đã thêm lịch thi.", "success")
                return redirect(url_for("exams"))
        return render_template("exam_form.html", item=None, subjects=subjects_list)

    @app.route("/exams/<int:item_id>/edit", methods=["GET", "POST"])
    def exam_edit(item_id):
        item = ExamSchedule.query.get_or_404(item_id)
        subjects_list = Subject.query.order_by(Subject.name).all()
        if request.method == "POST":
            start = request.form.get("start_time")
            end = request.form.get("end_time")
            if start >= end:
                flash("Giờ bắt đầu phải nhỏ hơn giờ kết thúc.", "danger")
            else:
                item.name = request.form.get("name", "").strip()
                item.subject_id = int(request.form["subject_id"])
                item.grade = request.form.get("grade")
                item.exam_date = parse_date(request.form.get("exam_date"))
                item.start_time = start
                item.end_time = end
                item.ban_thi = request.form.get("ban_thi") or "bat_buoc"
                db.session.commit()
                flash("Đã cập nhật lịch thi.", "success")
                return redirect(url_for("exams"))
        return render_template("exam_form.html", item=item, subjects=subjects_list)

    @app.route("/exams/<int:item_id>/delete", methods=["POST"])
    def exam_delete(item_id):
        item = ExamSchedule.query.get_or_404(item_id)
        db.session.delete(item)
        db.session.commit()
        flash("Đã xóa lịch thi.", "success")
        return redirect(url_for("exams"))

    @app.get("/health")
    def health():
        return {"status": "ok", "db": inspect(db.engine).get_table_names()}


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG") == "1")
