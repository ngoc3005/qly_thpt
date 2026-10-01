from odoo import models, api

class AutoSchedulerWizard(models.TransientModel):
    _name = 'school.auto_scheduler.wizard'
    _description = 'Wizard Tự động phân lịch'

    @api.model
    def action_generate_schedule(self):
        # Gọi hàm generate_schedule từ model AutoScheduler
        self.env['school.auto_scheduler'].generate_schedule()
        return {
            'type': 'ir.actions.client',
            'tag': 'reload',
        }
