from datetime import date

from models import (
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


def seed_demo_data():
    """Tạo dữ liệu + tài khoản demo nếu DB trống."""
    if User.query.filter_by(username="admin").first():
        return

    subjects = [
        Subject(name="Toán", periods=4),
        Subject(name="Ngữ văn", periods=4),
        Subject(name="Tiếng Anh", periods=3),
        Subject(name="Vật lý", periods=2),
        Subject(name="Hóa học", periods=2),
        Subject(name="Sinh học", periods=2),
        Subject(name="Lịch sử", periods=2),
        Subject(name="Địa lý", periods=2),
    ]
    db.session.add_all(subjects)

    t1 = Teacher(name="Nguyễn Văn An", gender="male", phone="0901111222", email="an.gv@thpt.vn", subject_name="Toán")
    t2 = Teacher(name="Trần Thị Bình", gender="female", phone="0902222333", email="binh.gv@thpt.vn", subject_name="Ngữ văn")
    t3 = Teacher(name="Lê Minh Châu", gender="female", phone="0903333444", email="chau.gv@thpt.vn", subject_name="Tiếng Anh")
    db.session.add_all([t1, t2, t3])
    db.session.flush()
    for t in (t1, t2, t3):
        t.assign_code()

    c10a1 = SchoolClass(name="10A1", grade_level="10", academic_year="2025-2026", homeroom_teacher_id=t1.id)
    c10a2 = SchoolClass(name="10A2", grade_level="10", academic_year="2025-2026", homeroom_teacher_id=t2.id)
    c11a1 = SchoolClass(name="11A1", grade_level="11", academic_year="2025-2026", homeroom_teacher_id=t3.id)
    db.session.add_all([c10a1, c10a2, c11a1])
    db.session.flush()

    s1 = Student(
        name="Phạm Minh Đức", birth_date=date(2009, 5, 12), gender="male",
        ban_hoc="tu_nhien", parent_name="Phạm Văn Hùng", class_id=c10a1.id, phone="0911111111",
        address="Hà Nội",
    )
    s2 = Student(
        name="Hoàng Thị Em", birth_date=date(2009, 8, 20), gender="female",
        ban_hoc="xa_hoi", parent_name="Hoàng Văn Nam", class_id=c10a1.id, phone="0912222222",
        address="Hà Nội",
    )
    s3 = Student(
        name="Vũ Quốc Phong", birth_date=date(2009, 3, 3), gender="male",
        ban_hoc="tu_nhien", parent_name="Vũ Thị Lan", class_id=c10a2.id, phone="0913333333",
        address="Hải Phòng",
    )
    db.session.add_all([s1, s2, s3])
    db.session.flush()
    for s in (s1, s2, s3):
        s.assign_code()

    hk1 = Semester(name="Học kỳ 1", academic_year="2025-2026", is_current=True)
    hk2 = Semester(name="Học kỳ 2", academic_year="2025-2026", is_current=False)
    db.session.add_all([hk1, hk2])
    db.session.flush()

    db.session.add_all([
        Grade(student_id=s1.id, subject_id=subjects[0].id, semester_id=hk1.id,
              score_mieng=8, score_15p=8.5, score_1tiet=9, score_thi=8.5),
        Grade(student_id=s1.id, subject_id=subjects[1].id, semester_id=hk1.id,
              score_mieng=7, score_15p=7.5, score_1tiet=8, score_thi=7.5),
        Grade(student_id=s2.id, subject_id=subjects[0].id, semester_id=hk1.id,
              score_mieng=9, score_15p=8, score_1tiet=8.5, score_thi=9),
        Grade(student_id=s3.id, subject_id=subjects[2].id, semester_id=hk1.id,
              score_mieng=8, score_15p=8, score_1tiet=7.5, score_thi=8),
    ])

    db.session.add(ClassTransfer(
        student_id=s3.id,
        from_class_id=c10a1.id,
        to_class_id=c10a2.id,
        transfer_date=date(2025, 9, 15),
        reason="Điều chỉnh sĩ số lớp",
    ))

    admin = User(username="admin", full_name="Quản trị viên", role="admin")
    admin.set_password("admin123")

    teacher_user = User(username="gv01", full_name=t1.name, role="teacher", teacher_id=t1.id)
    teacher_user.set_password("gv123")

    parent_user = User(username="phuhuynh01", full_name=s1.parent_name, role="parent", student_id=s1.id)
    parent_user.set_password("ph123")

    db.session.add_all([admin, teacher_user, parent_user])
    db.session.commit()
