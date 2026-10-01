from odoo import models, fields, api

class Grade(models.Model):
    _name = 'school.grade'
    _description = 'Student Grade'
    _rec_name = 'student_id'

    student_id = fields.Many2one('school.student', string='Học sinh', required=True)
    subject_id = fields.Many2one('school.subject', string='Môn học', required=True)
    history_id = fields.Many2one('school.student.history', string='Bảng điểm', required=True)
    year = fields.Char(string='Năm học')
    
    semester_1_score = fields.Float(string='Điểm học kỳ 1', digits=(4, 2))  # Điểm học kỳ 1
    semester_2_score = fields.Float(string='Điểm học kỳ 2', digits=(4, 2))  # Điểm học kỳ 2
    average_score = fields.Float(string='Điểm trung bình cả năm', compute='_compute_average_score')
    
    @api.depends('semester_1_score', 'semester_2_score')
    def _compute_average_score(self):
        for grade in self:
            # Compute the average score for both semesters
            total_score = 0
            count = 0
            if grade.semester_1_score:
                total_score += grade.semester_1_score
                count += 1
            if grade.semester_2_score:
                total_score += grade.semester_2_score
                count += 1
            if count > 0:
                grade.average_score = total_score / count
            else:
                grade.average_score = 0
                
    @api.constrains('student_id', 'subject_id', 'year')
    def _check_unique_subject_per_year(self):
        for grade in self:
            existing_grade = self.search([
                ('student_id', '=', grade.student_id.id),
                ('subject_id', '=', grade.subject_id.id),
                ('year', '=', grade.year)
            ])
            if len(existing_grade) > 1:
                raise ValidationError("Môn học này đã được nhập điểm cho học sinh này trong năm học này.")

