import re
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError

from datetime import date


class Student(models.Model):
    _name = 'school.student'
    _description = 'Học sinh'

    name = fields.Char(string='Họ và tên', required=True)
    birth_date = fields.Date(string='Ngày sinh')
    gender = fields.Selection([('male', 'Nam'), ('female', 'Nữ')], string='Giới tính')
    address = fields.Text(string='Địa chỉ')
    phone = fields.Char(string='Số điện thoại')
    class_id = fields.Many2one('school.class', string='Lớp hiện tại', store=True)
    grade = fields.Selection(related="class_id.grade")
    current_academic_year = fields.Char(
        string='Năm học hiện tại', 
        related='class_id.academic_year', 
        store=True, 
        readonly=True
    )
    average_semester_1 = fields.Float(string='TB Học kỳ 1', store=True)
    average_semester_2 = fields.Float(string='TB Học kỳ 2', store=True)
    average_year = fields.Float(string='TB Cả năm', store=True)
    score_ids = fields.One2many('school.grade', 'student_id', string='Lịch sử học tập')
    
    previous_class_ids = fields.One2many('school.student.history', 'student_id', string='Lịch sử học tập')  # Liên kết với lịch sử học tập
    conduct = fields.Selection(
        [('excellent', 'Tốt'), ('good', 'Khá'), ('average', 'Trung bình'), ('poor', 'Yếu')],
        string='Hạnh kiểm'
    )
    status = fields.Selection(
        [('studying', 'Đang học'), ('graduated', 'Đã ra trường'), ('transferred', 'Chuyển cấp'), ('dropped', 'Đã nghỉ học')],
        string='Trạng thái', default='studying'
    )
    student_code = fields.Char(
        string='Mã học sinh',
        readonly=True,
        copy=False
    )
    lich_thi_ids = fields.Many2many('thpt.phongthi', string="Lịch thi")
    ban_hoc = fields.Selection([
        ('tu_nhien', 'Ban Tự nhiên'),
        ('xa_hoi', 'Ban Xã hội')
    ], string="Ban học", required=True)

    _sql_constraints = [
        ('unique_student_code', 'UNIQUE(student_code)', 'Mã học sinh phải là duy nhất!')
    ]
    
    @api.constrains('phone')
    def _check_phone_number(self):
        pattern = re.compile(r'^(03|07|09|05)\d{8}$')
        for record in self:
            if record.phone and not pattern.match(record.phone):
                raise ValidationError("Số điện thoại phải gồm 10 ký tự số và bắt đầu bằng 03, 07, 09 hoặc 05!")

    @api.model
    def create(self, vals):
        if 'name' in vals:
            vals['name'] = vals['name'].title()
        record = super(Student, self).create(vals)
        record.student_code = f'HS-{str(record.id).zfill(5)}'
        return record
    
    def write(self, vals):
        # Viết hoa chữ cái đầu của 'name' nếu có
        if 'name' in vals:
            vals['name'] = vals['name'].title()
        return super(Student, self).write(vals)
    
    @api.constrains('birth_date')
    def _check_birth_date(self):
        """Kiểm tra ngày sinh không lớn hơn năm 2008"""
        for record in self:
            if record.birth_date:
                if record.birth_date > date(2008, 12, 31):
                    raise ValidationError("Ngày sinh không được lớn hơn năm 2008!")
    
    def capitalize_name(self):
        """Hàm viết hoa chữ cái đầu cho trường name"""
        for record in self:
            if record.name:
                record.name = record.name.title()
    
    @api.depends('score_ids')
    def _compute_average_scores(self):
        for student in self:
            grades_semester_1 = student.score_ids.filtered(lambda g: g.semester == '1')
            grades_semester_2 = student.score_ids.filtered(lambda g: g.semester == '2')
    
            # Tính TB Học kỳ 1
            student.average_semester_1 = (
                sum(g.average_score for g in grades_semester_1) / len(grades_semester_1)
                if grades_semester_1 else 0
            )
    
            # Tính TB Học kỳ 2
            student.average_semester_2 = (
                sum(g.average_score for g in grades_semester_2) / len(grades_semester_2)
                if grades_semester_2 else 0
            )
    
            # Tính TB Cả năm
            total_grades = len(grades_semester_1) + len(grades_semester_2)
            total_score = (
                sum(g.average_score for g in grades_semester_1) +
                sum(g.average_score for g in grades_semester_2)
            )
            student.average_year = total_score / total_grades if total_grades > 0 else 0
