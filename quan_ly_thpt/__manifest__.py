# -*- coding: utf-8 -*-
{
    'name': "Quản lý học sinh",
    'summary': """""",
    'category': 'Uncategorized',
    'version': '0.1',
    'depends': [
        'website',
    ],
    'data': [
        'security/quan_ly_thpt_security.xml',
        'security/ir.model.access.csv',
        'views/school_class_views.xml',
        'views/school_student_views.xml',
        'views/school_teacher_views.xml',
        'views/school_subject_views.xml',
        'views/school_score_views.xml',
        'views/student_grades_template.xml',
        'views/school_lichthi_views.xml',
        'views/school_lichthi_template.xml',
        'views/school_schedule_views.xml',
        'views/student_history_view.xml',
        'wizard/school_auto_scheduler_wizard_view.xml',
        'views/res_users_views.xml',
        'views/views.xml',
    ],
    
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}