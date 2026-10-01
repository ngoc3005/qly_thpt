from odoo import models, fields, api

class Subject(models.Model):
    _name = 'school.subject'
    _description = 'Subject'

    name = fields.Char(string='Tên môn học', required=True)
    code = fields.Char(string='Số tiết')
    so_tiet = fields.Integer(string='Số tiết', required=True)
