from datetime import datetime

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash

db = SQLAlchemy()

GENDER = {"male": "Nam", "female": "Nữ"}
BAN_HOC = {"tu_nhien": "Ban Tự nhiên", "xa_hoi": "Ban Xã hội"}
CONDUCT = {"tot": "Tốt", "kha": "Khá", "tb": "Trung bình", "yeu": "Yếu"}
STATUS = {
    "studying": "Đang học",
    "graduated": "Đã tốt nghiệp",
    "transferred": "Chuyển trường",
    "dropped": "Nghỉ học",
}
GRADE_LEVEL = {"10": "Khối 10", "11": "Khối 11", "12": "Khối 12"}
ROLES = {"admin": "Quản trị", "teacher": "Giáo viên", "parent": "Phụ huynh"}


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # admin / teacher / parent
    is_active = db.Column(db.Boolean, default=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey("teachers.id"), nullable=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    teacher = db.relationship("Teacher", foreign_keys=[teacher_id])
    student = db.relationship("Student", foreign_keys=[student_id])

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "full_name": self.full_name,
            "role": self.role,
            "role_label": ROLES.get(self.role, self.role),
            "is_active": self.is_active,
            "teacher_id": self.teacher_id,
            "student_id": self.student_id,
        }


class Teacher(db.Model):
    __tablename__ = "teachers"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True)
    name = db.Column(db.String(120), nullable=False)
    gender = db.Column(db.String(10))
    phone = db.Column(db.String(15))
    email = db.Column(db.String(120))
    subject_name = db.Column(db.String(80))

    classes = db.relationship("SchoolClass", back_populates="homeroom_teacher")

    def assign_code(self):
        if not self.code and self.id:
            self.code = f"GV-{self.id:05d}"

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "name": self.name,
            "gender": self.gender,
            "phone": self.phone,
            "email": self.email,
            "subject_name": self.subject_name,
        }


class SchoolClass(db.Model):
    __tablename__ = "classes"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    grade_level = db.Column(db.String(2), nullable=False)
    academic_year = db.Column(db.String(20), nullable=False)
    homeroom_teacher_id = db.Column(db.Integer, db.ForeignKey("teachers.id"))

    homeroom_teacher = db.relationship("Teacher", back_populates="classes")
    students = db.relationship("Student", back_populates="school_class")

    __table_args__ = (db.UniqueConstraint("name", "academic_year", name="uq_class_year"),)

    @property
    def size(self):
        return len(self.students)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "grade_level": self.grade_level,
            "academic_year": self.academic_year,
            "homeroom_teacher_id": self.homeroom_teacher_id,
            "homeroom_teacher": self.homeroom_teacher.name if self.homeroom_teacher else None,
            "size": self.size,
        }


class Student(db.Model):
    __tablename__ = "students"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True)
    name = db.Column(db.String(120), nullable=False)
    birth_date = db.Column(db.Date)
    gender = db.Column(db.String(10))
    phone = db.Column(db.String(15))
    address = db.Column(db.Text)
    ban_hoc = db.Column(db.String(20), default="tu_nhien")
    conduct = db.Column(db.String(20), default="tot")
    status = db.Column(db.String(20), default="studying")
    parent_name = db.Column(db.String(120))
    class_id = db.Column(db.Integer, db.ForeignKey("classes.id"))

    school_class = db.relationship("SchoolClass", back_populates="students")
    grades = db.relationship("Grade", back_populates="student", cascade="all, delete-orphan")
    transfers = db.relationship("ClassTransfer", back_populates="student", cascade="all, delete-orphan")

    def assign_code(self):
        if not self.code and self.id:
            self.code = f"HS-{self.id:05d}"

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "name": self.name,
            "birth_date": self.birth_date.isoformat() if self.birth_date else None,
            "gender": self.gender,
            "phone": self.phone,
            "address": self.address,
            "ban_hoc": self.ban_hoc,
            "conduct": self.conduct,
            "status": self.status,
            "parent_name": self.parent_name,
            "class_id": self.class_id,
            "class_name": self.school_class.name if self.school_class else None,
        }


class Subject(db.Model):
    __tablename__ = "subjects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    periods = db.Column(db.Integer, default=2)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "periods": self.periods}


class Semester(db.Model):
    __tablename__ = "semesters"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)  # Học kỳ 1 / Học kỳ 2
    academic_year = db.Column(db.String(20), nullable=False)
    is_current = db.Column(db.Boolean, default=False)

    __table_args__ = (db.UniqueConstraint("name", "academic_year", name="uq_semester"),)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "academic_year": self.academic_year,
            "is_current": self.is_current,
        }


class Grade(db.Model):
    __tablename__ = "grades"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id"), nullable=False)
    semester_id = db.Column(db.Integer, db.ForeignKey("semesters.id"), nullable=False)
    score_mieng = db.Column(db.Float)
    score_15p = db.Column(db.Float)
    score_1tiet = db.Column(db.Float)
    score_thi = db.Column(db.Float)

    student = db.relationship("Student", back_populates="grades")
    subject = db.relationship("Subject")
    semester = db.relationship("Semester")

    __table_args__ = (
        db.UniqueConstraint("student_id", "subject_id", "semester_id", name="uq_grade"),
    )

    @property
    def average(self):
        parts = []
        if self.score_mieng is not None:
            parts.append(self.score_mieng)
        if self.score_15p is not None:
            parts.append(self.score_15p)
        if self.score_1tiet is not None:
            parts.extend([self.score_1tiet, self.score_1tiet])
        if self.score_thi is not None:
            parts.extend([self.score_thi, self.score_thi, self.score_thi])
        return round(sum(parts) / len(parts), 2) if parts else None

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "student_name": self.student.name if self.student else None,
            "student_code": self.student.code if self.student else None,
            "subject_id": self.subject_id,
            "subject_name": self.subject.name if self.subject else None,
            "semester_id": self.semester_id,
            "semester_name": f"{self.semester.name} ({self.semester.academic_year})" if self.semester else None,
            "score_mieng": self.score_mieng,
            "score_15p": self.score_15p,
            "score_1tiet": self.score_1tiet,
            "score_thi": self.score_thi,
            "average": self.average,
        }


class ClassTransfer(db.Model):
    __tablename__ = "class_transfers"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id"), nullable=False)
    from_class_id = db.Column(db.Integer, db.ForeignKey("classes.id"))
    to_class_id = db.Column(db.Integer, db.ForeignKey("classes.id"), nullable=False)
    transfer_date = db.Column(db.Date, nullable=False)
    reason = db.Column(db.String(255))

    student = db.relationship("Student", back_populates="transfers")
    from_class = db.relationship("SchoolClass", foreign_keys=[from_class_id])
    to_class = db.relationship("SchoolClass", foreign_keys=[to_class_id])

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "student_name": self.student.name if self.student else None,
            "from_class": self.from_class.name if self.from_class else None,
            "to_class": self.to_class.name if self.to_class else None,
            "transfer_date": self.transfer_date.isoformat() if self.transfer_date else None,
            "reason": self.reason,
        }
