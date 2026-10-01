const express = require("express");
const router = express.Router();
const MonHoc = require("../models/MonHoc");

// POST tạo môn học = (api/monhoc/createMonHoc)
router.post('/createMonHoc', async (req, res) => {
    try {
        const { name, description, heSo } = req.body;

        const monHoc = new MonHoc({
            name,
            description,
            heSo
        });

        await monHoc.save();

        res.json(monHoc);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/monhoc', async (req, res) => {
    try {
      const monHoc = await MonHoc.find();
      res.json(monHoc);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      res.status(500).send('Error fetching subjects');
    }
  });
  

module.exports = router;
