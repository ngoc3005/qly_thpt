from odoo import models, fields


class Users(models.Model):
    _inherit = "res.users"

    lop_id = fields.Many2one('school.class', string='Chủ nhiệm lớp', store=True)
    teacher_id = fields.Many2one(related='lop_id.homeroom_teacher_id', string='Giáo viên', store=True)
