from bson import ObjectId
from werkzeug.security import check_password_hash, generate_password_hash

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


def oid(value):
    if value is None or value == "":
        return None
    if isinstance(value, ObjectId):
        return value
    return ObjectId(str(value))


def sid(value):
    return str(value) if value is not None else None


def hash_password(password):
    return generate_password_hash(password)


def verify_password(password_hash, password):
    return check_password_hash(password_hash, password)


def avg_grade(doc):
    parts = []
    if doc.get("score_mieng") is not None:
        parts.append(float(doc["score_mieng"]))
    if doc.get("score_15p") is not None:
        parts.append(float(doc["score_15p"]))
    if doc.get("score_1tiet") is not None:
        parts.extend([float(doc["score_1tiet"])] * 2)
    if doc.get("score_thi") is not None:
        parts.extend([float(doc["score_thi"])] * 3)
    return round(sum(parts) / len(parts), 2) if parts else None


def user_dict(doc):
    if not doc:
        return None
    return {
        "id": sid(doc["_id"]),
        "username": doc.get("username"),
        "full_name": doc.get("full_name"),
        "role": doc.get("role"),
        "role_label": ROLES.get(doc.get("role"), doc.get("role")),
        "is_active": bool(doc.get("is_active", True)),
        "teacher_id": sid(doc.get("teacher_id")),
        "student_id": sid(doc.get("student_id")),
    }


def teacher_dict(doc):
    return {
        "id": sid(doc["_id"]),
        "code": doc.get("code"),
        "name": doc.get("name"),
        "gender": doc.get("gender"),
        "phone": doc.get("phone"),
        "email": doc.get("email"),
        "subject_name": doc.get("subject_name"),
    }


def class_dict(doc, size=0, teacher_name=None):
    return {
        "id": sid(doc["_id"]),
        "name": doc.get("name"),
        "grade_level": doc.get("grade_level"),
        "academic_year": doc.get("academic_year"),
        "homeroom_teacher_id": sid(doc.get("homeroom_teacher_id")),
        "homeroom_teacher": teacher_name,
        "size": size,
    }


def student_dict(doc, class_name=None):
    return {
        "id": sid(doc["_id"]),
        "code": doc.get("code"),
        "name": doc.get("name"),
        "birth_date": doc.get("birth_date"),
        "gender": doc.get("gender"),
        "phone": doc.get("phone"),
        "address": doc.get("address"),
        "ban_hoc": doc.get("ban_hoc"),
        "conduct": doc.get("conduct"),
        "status": doc.get("status"),
        "parent_name": doc.get("parent_name"),
        "class_id": sid(doc.get("class_id")),
        "class_name": class_name,
    }


def subject_dict(doc):
    return {"id": sid(doc["_id"]), "name": doc.get("name"), "periods": doc.get("periods", 2)}


def semester_dict(doc):
    return {
        "id": sid(doc["_id"]),
        "name": doc.get("name"),
        "academic_year": doc.get("academic_year"),
        "is_current": bool(doc.get("is_current")),
    }


def grade_dict(doc, student=None, subject=None, semester=None):
    return {
        "id": sid(doc["_id"]),
        "student_id": sid(doc.get("student_id")),
        "student_name": student.get("name") if student else None,
        "student_code": student.get("code") if student else None,
        "subject_id": sid(doc.get("subject_id")),
        "subject_name": subject.get("name") if subject else None,
        "semester_id": sid(doc.get("semester_id")),
        "semester_name": (
            f"{semester.get('name')} ({semester.get('academic_year')})" if semester else None
        ),
        "score_mieng": doc.get("score_mieng"),
        "score_15p": doc.get("score_15p"),
        "score_1tiet": doc.get("score_1tiet"),
        "score_thi": doc.get("score_thi"),
        "average": avg_grade(doc),
    }


def transfer_dict(doc, student=None, from_class=None, to_class=None):
    return {
        "id": sid(doc["_id"]),
        "student_id": sid(doc.get("student_id")),
        "student_name": student.get("name") if student else None,
        "from_class": from_class.get("name") if from_class else None,
        "to_class": to_class.get("name") if to_class else None,
        "transfer_date": doc.get("transfer_date"),
        "reason": doc.get("reason"),
    }
