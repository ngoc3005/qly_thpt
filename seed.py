from db import get_db
from models import hash_password


def seed_demo_data():
    db = get_db()
    if db.users.find_one({"username": "admin"}):
        return

    subject_ids = []
    for name, periods in [
        ("Toán", 4), ("Ngữ văn", 4), ("Tiếng Anh", 3), ("Vật lý", 2),
        ("Hóa học", 2), ("Sinh học", 2), ("Lịch sử", 2), ("Địa lý", 2),
    ]:
        subject_ids.append(db.subjects.insert_one({"name": name, "periods": periods}).inserted_id)

    t1 = db.teachers.insert_one({
        "name": "Nguyễn Văn An", "gender": "male", "phone": "0901111222",
        "email": "an.gv@thpt.vn", "subject_name": "Toán",
    }).inserted_id
    t2 = db.teachers.insert_one({
        "name": "Trần Thị Bình", "gender": "female", "phone": "0902222333",
        "email": "binh.gv@thpt.vn", "subject_name": "Ngữ văn",
    }).inserted_id
    t3 = db.teachers.insert_one({
        "name": "Lê Minh Châu", "gender": "female", "phone": "0903333444",
        "email": "chau.gv@thpt.vn", "subject_name": "Tiếng Anh",
    }).inserted_id
    db.teachers.update_one({"_id": t1}, {"$set": {"code": f"GV-{str(t1)[-5:].upper()}"}})
    db.teachers.update_one({"_id": t2}, {"$set": {"code": f"GV-{str(t2)[-5:].upper()}"}})
    db.teachers.update_one({"_id": t3}, {"$set": {"code": f"GV-{str(t3)[-5:].upper()}"}})

    c10a1 = db.classes.insert_one({
        "name": "10A1", "grade_level": "10", "academic_year": "2025-2026",
        "homeroom_teacher_id": t1,
    }).inserted_id
    c10a2 = db.classes.insert_one({
        "name": "10A2", "grade_level": "10", "academic_year": "2025-2026",
        "homeroom_teacher_id": t2,
    }).inserted_id
    db.classes.insert_one({
        "name": "11A1", "grade_level": "11", "academic_year": "2025-2026",
        "homeroom_teacher_id": t3,
    })

    s1 = db.students.insert_one({
        "name": "Phạm Minh Đức", "birth_date": "2009-05-12", "gender": "male",
        "ban_hoc": "tu_nhien", "parent_name": "Phạm Văn Hùng", "class_id": c10a1,
        "phone": "0911111111", "address": "Hà Nội", "conduct": "tot", "status": "studying",
    }).inserted_id
    s2 = db.students.insert_one({
        "name": "Hoàng Thị Em", "birth_date": "2009-08-20", "gender": "female",
        "ban_hoc": "xa_hoi", "parent_name": "Hoàng Văn Nam", "class_id": c10a1,
        "phone": "0912222222", "address": "Hà Nội", "conduct": "tot", "status": "studying",
    }).inserted_id
    s3 = db.students.insert_one({
        "name": "Vũ Quốc Phong", "birth_date": "2009-03-03", "gender": "male",
        "ban_hoc": "tu_nhien", "parent_name": "Vũ Thị Lan", "class_id": c10a2,
        "phone": "0913333333", "address": "Hải Phòng", "conduct": "kha", "status": "studying",
    }).inserted_id
    for i, sid in enumerate((s1, s2, s3), start=1):
        db.students.update_one({"_id": sid}, {"$set": {"code": f"HS-{i:05d}"}})

    hk1 = db.semesters.insert_one({
        "name": "Học kỳ 1", "academic_year": "2025-2026", "is_current": True,
    }).inserted_id
    db.semesters.insert_one({
        "name": "Học kỳ 2", "academic_year": "2025-2026", "is_current": False,
    })

    db.grades.insert_many([
        {
            "student_id": s1, "subject_id": subject_ids[0], "semester_id": hk1,
            "score_mieng": 8, "score_15p": 8.5, "score_1tiet": 9, "score_thi": 8.5,
        },
        {
            "student_id": s1, "subject_id": subject_ids[1], "semester_id": hk1,
            "score_mieng": 7, "score_15p": 7.5, "score_1tiet": 8, "score_thi": 7.5,
        },
        {
            "student_id": s2, "subject_id": subject_ids[0], "semester_id": hk1,
            "score_mieng": 9, "score_15p": 8, "score_1tiet": 8.5, "score_thi": 9,
        },
        {
            "student_id": s3, "subject_id": subject_ids[2], "semester_id": hk1,
            "score_mieng": 8, "score_15p": 8, "score_1tiet": 7.5, "score_thi": 8,
        },
    ])

    db.transfers.insert_one({
        "student_id": s3,
        "from_class_id": c10a1,
        "to_class_id": c10a2,
        "transfer_date": "2025-09-15",
        "reason": "Điều chỉnh sĩ số lớp",
    })

    db.users.insert_many([
        {
            "username": "admin",
            "full_name": "Quản trị viên",
            "role": "admin",
            "password_hash": hash_password("admin123"),
            "is_active": True,
        },
        {
            "username": "gv01",
            "full_name": "Nguyễn Văn An",
            "role": "teacher",
            "teacher_id": t1,
            "password_hash": hash_password("gv123"),
            "is_active": True,
        },
        {
            "username": "phuhuynh01",
            "full_name": "Phạm Văn Hùng",
            "role": "parent",
            "student_id": s1,
            "password_hash": hash_password("ph123"),
            "is_active": True,
        },
    ])
