from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Subject(db.Model):
    __tablename__ = "subjects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    so_tiet = db.Column(db.Integer, nullable=False, default=1)

    grades = db.relationship("Grade", back_populates="subject", cascade="all, delete-orphan")
    schedules = db.relationship("Schedule", back_populates="subject", cascade="all, delete-orphan")

    def __repr__(self):
        return self.name


teacher_subjects = db.Table(
    "teacher_subjects",
    db.Column("teacher_id", db.Integer, db.ForeignKey("teachers.id"), primary_key=True),
    db.Column("subject_id", db.Integer, db.ForeignKey("subjects.id"), primary_key=True),
)


class Teacher(db.Model):
    __tablename__ = "teachers"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    teacher_code = db.Column(db.String(20), unique=True)
    birth_year = db.Column(db.Integer)
    gender = db.Column(db.String(10))  # male / female / other
    phone = db.Column(db.String(15))
    email = db.Column(db.String(120))
    address = db.Column(db.Text)

    subjects = db.relationship("Subject", secondary=teacher_subjects, lazy="joined")
    classes = db.relationship("SchoolClass", back_populates="homeroom_teacher")
    schedules = db.relationship("Schedule", back_populates="teacher")

    def assign_code(self):
        if not self.teacher_code and self.id:
            self.teacher_code = f"GV-{str(self.id).zfill(5)}"


class SchoolClass(db.Model):
    __tablename__ = "classes"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    grade = db.Column(db.String(2), nullable=False)  # 10 / 11 / 12
    academic_year = db.Column(db.String(20), nullable=False)
    homeroom_teacher_id = db.Column(db.Integer, db.ForeignKey("teachers.id"))

    homeroom_teacher = db.relationship("Teacher", back_populates="classes")
    students = db.relationship("Student", back_populates="school_class")
    schedules = db.relationship("Schedule", back_populates="school_class", cascade="all, delete-orphan")

    __table_args__ = (
        db.UniqueConstraint("name", "academic_year", name="uq_class_year"),
    )

    @property
    def size(self):
        return len(self.students)


class Student(db.Model):
    __tablename__ = "students"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    student_code = db.Column(db.String(20), unique=True)
    birth_date = db.Column(db.Date)
    gender = db.Column(db.String(10))  # male / female
    address = db.Column(db.Text)
    phone = db.Column(db.String(15))
    ban_hoc = db.Column(db.String(20), nullable=False, default="tu_nhien")  # tu_nhien / xa_hoi
    conduct = db.Column(db.String(20))  # excellent / good / average / poor
    status = db.Column(db.String(20), default="studying")
    class_id = db.Column(db.Integer, db.ForeignKey("classes.id"))

    school_class = db.relationship("SchoolClass", back_populates="students")
    grades = db.relationship("Grade", back_populates="student", cascade="all, delete-orphan")

    def assign_code(self):
        if not self.student_code and self.id:
            self.student_code = f"HS-{str(self.id).zfill(5)}"

    @property
    def average_year(self):
        if not self.grades:
            return 0.0
        scores = [g.average_score for g in self.grades if g.average_score]
        return round(sum(scores) / len(scores), 2) if scores else 0.0


class Grade(db.Model):
    __tablename__ = "grades"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=False)
    year = db.Column(db.String(20), nullable=False)
    semester_1_score = db.Column(db.Float)
    semester_2_score = db.Column(db.Float)

    student = db.relationship("Student", back_populates="grades")
    subject = db.relationship("Subject", back_populates="grades")

    __table_args__ = (
        db.UniqueConstraint("student_id", "subject_id", "year", name="uq_grade_student_subject_year"),
    )

    @property
    def average_score(self):
        scores = [s for s in (self.semester_1_score, self.semester_2_score) if s is not None]
        return round(sum(scores) / len(scores), 2) if scores else 0.0


class Schedule(db.Model):
    __tablename__ = "schedules"

    id = db.Column(db.Integer, primary_key=True)
    class_id = db.Column(db.Integer, db.ForeignKey("classes.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey("teachers.id"), nullable=False)
    day_of_week = db.Column(db.String(15), nullable=False)
    period = db.Column(db.String(2), nullable=False)

    school_class = db.relationship("SchoolClass", back_populates="schedules")
    subject = db.relationship("Subject", back_populates="schedules")
    teacher = db.relationship("Teacher", back_populates="schedules")

    __table_args__ = (
        db.UniqueConstraint("class_id", "day_of_week", "period", name="uq_schedule_slot"),
    )


class ExamSchedule(db.Model):
    __tablename__ = "exam_schedules"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=False)
    grade = db.Column(db.String(2), nullable=False)
    exam_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.String(10), nullable=False)  # HH:MM
    end_time = db.Column(db.String(10), nullable=False)
    ban_thi = db.Column(db.String(20), nullable=False, default="bat_buoc")

    subject = db.relationship("Subject")


# Labels dùng chung cho UI
GENDER_LABELS = {"male": "Nam", "female": "Nữ", "other": "Khác"}
BAN_HOC_LABELS = {"tu_nhien": "Ban Tự nhiên", "xa_hoi": "Ban Xã hội"}
BAN_THI_LABELS = {
    "tu_nhien": "Ban Tự nhiên",
    "xa_hoi": "Ban Xã hội",
    "bat_buoc": "Môn Bắt buộc",
}
CONDUCT_LABELS = {
    "excellent": "Tốt",
    "good": "Khá",
    "average": "Trung bình",
    "poor": "Yếu",
}
STATUS_LABELS = {
    "studying": "Đang học",
    "graduated": "Đã ra trường",
    "transferred": "Chuyển cấp",
    "dropped": "Đã nghỉ học",
}
DAY_LABELS = {
    "monday": "Thứ Hai",
    "tuesday": "Thứ Ba",
    "wednesday": "Thứ Tư",
    "thursday": "Thứ Năm",
    "friday": "Thứ Sáu",
    "saturday": "Thứ Bảy",
}
GRADE_LABELS = {"10": "Khối 10", "11": "Khối 11", "12": "Khối 12"}
