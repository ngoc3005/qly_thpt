# -*- coding: utf-8 -*-
from odoo import models, fields, api, exceptions


class ThiTHPTLichThi(models.Model):
    _name = 'thpt.lichthi'
    _description = 'Lịch thi THPT'
    
    name = fields.Char(string='Tên lớp')

    mon_id = fields.Many2many('school.subject', string="Môn thi", required=True)
    grade = fields.Selection(
        [('10', 'Khối 10'), ('11', 'Khối 11'), ('12', 'Khối 12')],
        string='Khối', required=True
    )
    ngay_thi = fields.Date(string="Ngày thi", required=True)
    gio_bat_dau = fields.Float(string="Giờ bắt đầu", required=True, help="Giờ bắt đầu thi, định dạng 24h (vd: 13.5 là 13:30)")
    gio_ket_thuc = fields.Float(string="Giờ kết thúc", required=True, help="Giờ kết thúc thi, định dạng 24h")
    phong_thi_ids = fields.One2many('thpt.phongthi', 'lich_thi_id', string="Phòng thi")
    giam_thi_ids = fields.Many2many('res.users', string="Giám thị")
    ban_thi = fields.Selection([
        ('tu_nhien', 'Ban Tự nhiên'),
        ('xa_hoi', 'Ban Xã hội'),
        ('bat_buoc', 'Môn Bắt buộc')
    ], string="Ban thi", required=True)

    @api.constrains('gio_bat_dau', 'gio_ket_thuc')
    def _check_gio_thi(self):
        for record in self:
            if record.gio_bat_dau >= record.gio_ket_thuc:
                raise exceptions.ValidationError("Giờ bắt đầu phải nhỏ hơn giờ kết thúc.")

    def action_tao_phong_thi(self):
        self.phong_thi_ids.unlink()
    
        if self.ban_thi == 'bat_buoc':
            hoc_sinh_list = self.env['school.student'].search([('grade', '=', self.grade)], order='name asc')
        else:
            hoc_sinh_list = self.env['school.student'].search([('ban_hoc', '=', self.ban_thi), ('grade', '=', self.grade)], order='name asc')
    
        if not hoc_sinh_list:
            raise exceptions.UserError("Không có học sinh nào trong ban thi này.")
    
        # Chia học sinh vào phòng, mỗi phòng tối đa 20 học sinh
        phong_counter = 1
        while hoc_sinh_list:
            phong = self.env['thpt.phongthi'].create({
                'name': f"Phòng {phong_counter}",
                'lich_thi_id': self.id,
                'hoc_sinh_ids': [(6, 0, hoc_sinh_list[:20].ids)]
            })
            hoc_sinh_list = hoc_sinh_list[20:]
            phong_counter += 1


class ThiTHPTKetQua(models.Model):
    _name = 'thpt.ketqua'
    _description = 'Kết quả thi THPT'

    hoc_sinh_id = fields.Many2one('school.student', string="Học sinh", required=True)
    lich_thi_id = fields.Many2one('thpt.lichthi', string="Lịch thi", required=True)
    diem_so = fields.Float(string="Điểm số", required=True)
    ket_qua = fields.Selection([
        ('dat', 'Đạt'),
        ('khong_dat', 'Không đạt')
    ], string="Kết quả", compute="_compute_ket_qua", store=True)

    @api.depends('diem_so')
    def _compute_ket_qua(self):
        for record in self:
            record.ket_qua = 'dat' if record.diem_so >= 5 else 'khong_dat'


class ThiTHPTPhongThi(models.Model):
    _name = 'thpt.phongthi'
    _description = 'Phòng thi THPT'

    name = fields.Char(string="Phòng thi", required=True)
    lich_thi_id = fields.Many2one('thpt.lichthi', string="Lịch thi", required=True)
    hoc_sinh_ids = fields.Many2many('school.student', string="Học sinh")
