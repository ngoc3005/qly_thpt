from odoo import models, fields, api

class StudentHistory(models.Model):
    _name = 'school.student.history'
    _description = 'Lịch sử học tập của học sinh'
    _rec_name = 'history_display_name' 

    student_id = fields.Many2one('school.student', string='Học sinh', required=True)
    academic_year = fields.Char(string='Năm học', required=True)  # Năm học (ví dụ: 2020-2021)
    hk_k1 = fields.Selection([
        ('tốt', 'Tốt'),
        ('khá', 'Khá'),
        ('trung_bình', 'Trung bình'),
        ('yếu', 'Yếu')
    ], string='Hạnh kiểm kì 1')
    
    hk_k2 = fields.Selection([
        ('tốt', 'Tốt'),
        ('khá', 'Khá'),
        ('trung_bình', 'Trung bình'),
        ('yếu', 'Yếu')
    ], string='Hạnh kiểm kì 2')
    
    hl_k1 = fields.Selection([
        ('giỏi', 'Giỏi'),
        ('khá', 'Khá'),
        ('trung_bình', 'Trung bình'),
        ('yếu', 'Yếu')
    ], string='Học lực kì 1')
    
    hl_k2 = fields.Selection([
        ('giỏi', 'Giỏi'),
        ('khá', 'Khá'),
        ('trung_bình', 'Trung bình'),
        ('yếu', 'Yếu')
    ], string='Học lực kì 2')
    
    hk_cn = fields.Selection([
        ('tốt', 'Tốt'),
        ('khá', 'Khá'),
        ('trung_bình', 'Trung bình'),
        ('yếu', 'Yếu')
    ], string='Học lực cả năm')
    
    hl_cn = fields.Selection([
        ('giỏi', 'Giỏi'),
        ('khá', 'Khá'),
        ('trung_bình', 'Trung bình'),
        ('yếu', 'Yếu')
    ], string='Hạnh kiểm cả năm')
    nhan_xet = fields.Text(string='Nhận xét')
    ket_luan = fields.Text(string='Kết luận')

    average_semester_1 = fields.Float(string='TB Học kỳ 1', digits=(4, 2), compute='_compute_average_scores')  # Điểm học kỳ 1 năm trước
    average_semester_2 = fields.Float(string='TB Học kỳ 2', digits=(4, 2), compute='_compute_average_scores')  # Điểm học kỳ 2 năm trước
    average_year = fields.Float(string='TB Cả năm', digits=(4, 2), compute='_compute_average_scores')
    score_ids = fields.One2many('school.grade', 'history_id', string='Chi tiết điểm các môn')
    
    @api.depends('student_id.name', 'academic_year')
    def _compute_history_display_name(self):
        for record in self:
            record.history_display_name = f"{record.student_id.name} - {record.academic_year}"

    history_display_name = fields.Char(string='Tên hiển thị', compute='_compute_history_display_name', store=True)

    
    @api.model
    def create(self, vals):
        record = super(StudentHistory, self).create(vals)

        subjects = self.env['school.subject'].search([('name', '!=', 'Chào cờ')])  # Lấy tất cả các môn học từ bảng school.subject
        for subject in subjects:
            self.env['school.grade'].create({
                'student_id': record.student_id.id,
                'subject_id': subject.id,
                'year': record.academic_year,
                'history_id': record.id,
            })
        
        return record

    @api.depends('score_ids.semester_1_score', 'score_ids.semester_2_score')
    def _compute_average_scores(self):
        for history in self:
            grades_semester_1 = history.score_ids.filtered(lambda g: g.semester_1_score)
            grades_semester_2 = history.score_ids.filtered(lambda g: g.semester_2_score)
            
            # Tính TB Học kỳ 1 (tính trung bình điểm các môn học kỳ 1)
            if grades_semester_1:
                total_score_1 = sum(g.semester_1_score for g in grades_semester_1)
                history.average_semester_1 = total_score_1 / len(grades_semester_1)
            else:
                history.average_semester_1 = 0

            # Tính TB Học kỳ 2 (tính trung bình điểm các môn học kỳ 2)
            if grades_semester_2:
                total_score_2 = sum(g.semester_2_score for g in grades_semester_2)
                history.average_semester_2 = total_score_2 / len(grades_semester_2)
            else:
                history.average_semester_2 = 0

            # Tính TB Cả năm (tính trung bình điểm của 2 học kỳ)
            if grades_semester_1 or grades_semester_2:
                total_score = sum(g.semester_1_score for g in grades_semester_1) + sum(g.semester_2_score for g in grades_semester_2)
                total_subjects = len(grades_semester_1) + len(grades_semester_2)
                history.average_year = total_score / total_subjects if total_subjects > 0 else 0
            else:
                history.average_year = 0

