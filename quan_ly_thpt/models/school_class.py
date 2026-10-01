import random
from odoo.exceptions import UserError
from odoo import models, fields, api


class Class(models.Model):
    _name = 'school.class'
    _description = 'Lớp học'

    name = fields.Char(string='Tên lớp', required=True)
    grade = fields.Selection(
        [('10', 'Khối 10'), ('11', 'Khối 11'), ('12', 'Khối 12')],
        string='Khối', required=True
    )
    academic_year = fields.Char(string='Năm học', required=True, help="Ví dụ: 2024-2025")
    size = fields.Integer(string='Sĩ số', compute='_compute_size')
    homeroom_teacher_id = fields.Many2one('school.teacher', string='Giáo viên chủ nhiệm', required=True)
    student_ids = fields.One2many('school.student', 'class_id', string='Danh sách học sinh')

    _sql_constraints = [
        ('unique_class_year', 'unique(name, academic_year)', 'Tên lớp và năm học phải là duy nhất.')
    ]

    @api.depends('student_ids')
    def _compute_size(self):
        for record in self:
            if record.student_ids:
                record.size = len(record.student_ids)
            else:
                record.size=0
            
    def promote_students_to_next_year(self, next_academic_year):
        """
        Hàm chuyển học sinh sang lớp tương ứng trong năm học mới.
        """
        for school_class in self:
            if school_class.student_ids:
                for student in school_class.student_ids:
                    next_class = self.env['school.class'].search([
                        ('name', '=', school_class.name),
                        ('grade', '=', str(int(school_class.grade) + 1)),
                        ('academic_year', '=', next_academic_year)
                    ], limit=1)
                    if next_class:
                        self.env['school.student.history'].create({
                            'student_id': student.id,
                            'class_id': school_class.id,
                            'start_date': fields.Date.today(),
                            'end_date': fields.Date.today()
                        })
                        student.class_id = next_class.id
                    else:
                        student.status = 'transferred'
    
    def create_new_year_class(self, next_academic_year):
        """
        Tạo lớp mới cho năm học tiếp theo.
        """
        for school_class in self:
            self.create({
                'name': school_class.name,
                'grade': school_class.grade,
                'academic_year': next_academic_year,
                'homeroom_teacher_id': school_class.homeroom_teacher_id.id
            })
    schedule_ids = fields.One2many('school.schedule', 'class_id', string='Thời khóa biểu')

class Schedule(models.Model):
    _name = 'school.schedule'
    _description = 'Schedule'

    class_id = fields.Many2one('school.class', string='Lớp học', required=True)
    subject_id = fields.Many2one('school.subject', string='Môn học', required=True)
    teacher_id = fields.Many2one('school.teacher', string='Giáo viên', required=True)
    day_of_week = fields.Selection(
        [('monday', 'Thứ Hai'),
         ('tuesday', 'Thứ Ba'),
         ('wednesday', 'Thứ Tư'),
         ('thursday', 'Thứ Năm'),
         ('friday', 'Thứ Sáu'),
        ('saturday', 'Thứ Bảy')],
        string='Ngày trong tuần',
        required=True
    )
    period = fields.Selection(
        [('1', 'Tiết 1'), ('2', 'Tiết 2'), ('3', 'Tiết 3'), ('4', 'Tiết 4'), ('5', 'Tiết 5')],
        string='Tiết học',
        required=True
    )

    _sql_constraints = [
        ('unique_schedule', 'unique(class_id, day_of_week, period)',
         'Một lớp học chỉ có thể có một môn học trong cùng một tiết học!'),
    ]


class AutoScheduler(models.Model):
    _name = 'school.auto_scheduler'
    _description = 'Auto Scheduler'

    @api.model
    def generate_schedule(self):
        # Lấy danh sách lớp, môn học, và giáo viên
        classes = self.env['school.class'].search([])
        subjects = self.env['school.subject'].search([])
        teachers = self.env['school.teacher'].search([])

        # Các ngày trong tuần và các tiết học
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        periods = ['1', '2', '3', '4', '5']

        # Tạo lịch cho từng lớp học
        for class_obj in classes:
            # Gán tiết chào cờ (tiết 1, thứ 2) cho giáo viên chủ nhiệm
            homeroom_teacher = class_obj.homeroom_teacher_id  # Giáo viên chủ nhiệm
            if homeroom_teacher:
                self.env['school.schedule'].create({
                    'class_id': class_obj.id,
                    'subject_id': 14,  # Môn chào cờ
                    'teacher_id': homeroom_teacher.id,
                    'day_of_week': 'monday',
                    'period': '1',
                })

            # Xóa tiết 1 thứ 2 khỏi danh sách để không bị xếp lại
            available_slots = [(day, period) for day in days for period in periods if not (day == 'monday' and period == '1')]

            # Sắp xếp môn học theo số tiết
            subject_schedule = {}
            for subject in subjects:
                subject_schedule[subject.id] = subject.so_tiet

            # Duyệt qua các môn học và phân bổ tiết
            while any(subject_schedule.values()):
                # Nếu không còn slot trống để xếp lịch, dừng lại
                if not available_slots:
                    break

                random.shuffle(available_slots)
                for subject_id, so_tiet in subject_schedule.items():
                    if so_tiet == 0:
                        continue

                    # Xếp giáo viên cho môn học
                    teacher_for_class = {}
                    for teacher in teachers:
                        teacher_for_class[teacher.id] = teacher.subject_ids.ids  # Môn mà giáo viên dạy

                    # Nếu môn có 3 tiết, xếp 1 tiết vào 1 ngày, 2 tiết vào ngày khác
                    if so_tiet == 3:
                        # Lấy giáo viên dạy môn này cho lớp học cụ thể
                        teacher = self.get_teacher_for_class(class_obj.id, subject_id, teacher_for_class)
                        if teacher:
                            # Xếp 1 tiết vào một ngày
                            for slot in available_slots:
                                day, period = slot
                                # Kiểm tra nếu chưa có lịch cho môn này vào khung giờ đó
                                existing_schedule = self.env['school.schedule'].search([
                                    ('class_id', '=', class_obj.id),
                                    ('day_of_week', '=', day),
                                    ('period', '=', period)
                                ])
                                if not existing_schedule:
                                    # Tạo lịch học cho môn này
                                    self.env['school.schedule'].create({
                                        'class_id': class_obj.id,
                                        'subject_id': subject_id,
                                        'teacher_id': teacher,
                                        'day_of_week': day,
                                        'period': period,
                                    })
                                    # Giảm số tiết còn lại
                                    subject_schedule[subject_id] -= 1
                                    # Loại bỏ slot đã sử dụng
                                    available_slots.remove(slot)
                                    break

                            # Sau khi xếp xong 1 tiết, xếp 2 tiết liền nhau vào ngày khác
                            for slot in available_slots:
                                day, period = slot
                                next_period = str(int(period) + 1)  # Lấy tiết tiếp theo
                                if next_period in periods:
                                    # Kiểm tra nếu chưa có lịch cho cả 2 tiết liền nhau này
                                    existing_schedule_1 = self.env['school.schedule'].search([
                                        ('class_id', '=', class_obj.id),
                                        ('day_of_week', '=', day),
                                        ('period', '=', period)
                                    ])
                                    existing_schedule_2 = self.env['school.schedule'].search([
                                        ('class_id', '=', class_obj.id),
                                        ('day_of_week', '=', day),
                                        ('period', '=', next_period)
                                    ])
                                    if not existing_schedule_1 and not existing_schedule_2:
                                        # Tạo lịch học cho môn này với 2 tiết liền nhau
                                        self.env['school.schedule'].create({
                                            'class_id': class_obj.id,
                                            'subject_id': subject_id,
                                            'teacher_id': teacher,
                                            'day_of_week': day,
                                            'period': period,
                                        })
                                        self.env['school.schedule'].create({
                                            'class_id': class_obj.id,
                                            'subject_id': subject_id,
                                            'teacher_id': teacher,
                                            'day_of_week': day,
                                            'period': next_period,
                                        })
                                        # Giảm số tiết còn lại
                                        subject_schedule[subject_id] -= 2
                                        # Loại bỏ các slot đã sử dụng
                                        available_slots.remove(slot)
                                        available_slots = [s for s in available_slots if s != (day, next_period)]
                                        break
                    else:
                        # Xếp một tiết duy nhất vào một slot
                        teacher = self.get_teacher_for_class(class_obj.id, subject_id, teacher_for_class)
                        if teacher:
                            for slot in available_slots:
                                day, period = slot
                                # Kiểm tra nếu chưa có lịch cho môn này vào khung giờ đó
                                existing_schedule = self.env['school.schedule'].search([
                                    ('class_id', '=', class_obj.id),
                                    ('day_of_week', '=', day),
                                    ('period', '=', period)
                                ])
                                if not existing_schedule:
                                    # Tạo lịch học cho môn này
                                    self.env['school.schedule'].create({
                                        'class_id': class_obj.id,
                                        'subject_id': subject_id,
                                        'teacher_id': teacher,
                                        'day_of_week': day,
                                        'period': period,
                                    })
                                    # Giảm số tiết còn lại
                                    subject_schedule[subject_id] -= 1
                                    # Loại bỏ slot đã sử dụng
                                    available_slots.remove(slot)
                                    break

    def get_teacher_for_class(self, class_id, subject_id, teacher_for_class):
        """
        Tìm giáo viên dạy cho lớp học và môn học cụ thể.
        """
        teachers_for_subject = [teacher_id for teacher_id, subjects in teacher_for_class.items() if subject_id in subjects]
        # Nếu có nhiều giáo viên cho môn học này, chọn ngẫu nhiên một giáo viên cho lớp học
        if teachers_for_subject:
            return random.choice(teachers_for_subject)
        return None


