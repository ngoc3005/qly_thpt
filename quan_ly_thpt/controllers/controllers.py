from odoo import http
from odoo.http import request

class StudentGradesController(http.Controller):

    @http.route('/student_grades', type='http', auth='public', website=True)
    def index(self, student_code=None, **kwargs):
        if student_code:
            student = request.env['school.student'].search([('student_code', '=', student_code)], limit=1)
            
            if student:
                # Lấy tất cả lịch sử học tập của học sinh
                previous_classes = student.previous_class_ids  # Lấy tất cả các năm học trước
                
                return request.render('quan_ly_thpt.student_grades_template', {
                    'student': student,  # Truyền đối tượng student vào template
                    'previous_classes': previous_classes,  # Truyền danh sách lịch sử học tập vào template
                })
            else:
                return request.render('quan_ly_thpt.student_grades_template', {
                    'student': student,
                    'message': "Không tìm thấy học sinh với mã này!"
                })
        
        return request.render('quan_ly_thpt.student_grades_input', {})
    
    @http.route('/tra-cuu-lich-thi', type='http', auth='public', website=True)
    def tra_cuu_lich_thi(self, **kwargs):
        return request.render('quan_ly_thpt.tra_cuu_lich_thi', {})

    @http.route('/tra-cuu-lich-thi/result', type='http', auth='public', website=True, csrf=False)
    def tra_cuu_lich_thi_result(self, **kwargs):
        ma_hoc_sinh = kwargs.get('student_code')
        student = request.env['school.student'].sudo().search([('student_code', '=', ma_hoc_sinh)], limit=1)
        if not student:
            return request.render('quan_ly_thpt.tra_cuu_lich_thi_result', {
                'error': 'Không tìm thấy học sinh với mã đã nhập!'
            })
        return request.render('quan_ly_thpt.tra_cuu_lich_thi_result', {
            'student': student,
            'lich_thi_ids': student.lich_thi_ids
        })
        
    @http.route('/tra-cuu-thoi-khoa-bieu', type='http', auth='public', website=True)
    def tra_cuu_thoi_khoa_bieu(self, **kwargs):
        # Trả về template để nhập tên lớp
        return request.render('quan_ly_thpt.tra_cuu_thoi_khoa_bieu', {})

    @http.route('/tra-cuu-thoi-khoa-bieu/result', type='http', auth='public', website=True, csrf=False)
    def tra_cuu_thoi_khoa_bieu_result(self, **kwargs):
        # Lấy tên lớp học từ tham số
        class_name = kwargs.get('class_name')
        
        # Tìm lớp học theo tên
        class_obj = request.env['school.class'].sudo().search([('name', '=', class_name)], limit=1)
        if not class_obj:
            # Nếu không tìm thấy lớp học
            return request.render('quan_ly_thpt.tra_cuu_thoi_khoa_bieu', {
                'error': 'Không tìm thấy lớp học với tên đã nhập!'
            })
        
        # Lấy thời khóa biểu của lớp học
        schedule_records = request.env['school.schedule'].sudo().search([
            ('class_id', '=', class_obj.id)
        ])
        
        # Phân nhóm thời khóa biểu theo ngày
        schedule_by_day = {day: {} for day in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']}
        for record in schedule_records:
            schedule_by_day[record.day_of_week][record.period] = {
                'subject': record.subject_id.name,
                'teacher': record.teacher_id.name
            }

        # Trả về template với kết quả tìm kiếm
        return request.render('quan_ly_thpt.tra_cuu_thoi_khoa_bieu_result', {
            'class_obj': class_obj,
            'schedule_by_day': schedule_by_day
        })
