import re
from odoo import models, fields, api
from odoo.exceptions import ValidationError

class Teacher(models.Model):
    _name = 'school.teacher'
    _description = 'Teacher'
    _sql_constraints = [
        ('unique_teacher_code', 'UNIQUE(teacher_code)', 'Tên giáo viên đã tồn tại!')
    ]

    name = fields.Char(string='Tên giáo viên', required=True)
    subject_ids = fields.Many2many('school.subject', string='Môn giảng dạy')
    age = fields.Integer(string='Năm sinh')
    gender = fields.Selection(
        [('male', 'Nam'), ('female', 'Nữ'), ('other', 'Khác')],
        string='Giới tính',
    )
    phone = fields.Char(string='Số điện thoại')
    email = fields.Char(string='Email')
    address = fields.Text(string='Địa chỉ')
    
    teacher_code = fields.Char(
        string='Mã giáo viên',
        readonly=True,
        copy=False
    )
    
    @api.constrains('phone')
    def _check_phone_number(self):
        pattern = re.compile(r'^(03|07|09|05)\d{8}$')
        for record in self:
            if not pattern.match(record.phone):
                raise ValidationError("Số điện thoại phải gồm 10 ký tự số và bắt đầu bằng 03, 07, 09 hoặc 05!")

    @api.model
    def create(self, vals):
        record = super(Teacher, self).create(vals)
        record.teacher_code = f'GV-{str(record.id).zfill(5)}'
        return record
    