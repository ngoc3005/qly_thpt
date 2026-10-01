const cron = require('node-cron');
const KetQua = require('./models/KetQua');
const HocSinh = require('./models/HocSinh');

const capNhatHocKyTask = () => {
  cron.schedule('0 9 * * *', async () => {
    try {
      const currentDate = new Date();
      const hocKyDaHet = await KetQua.find({
        ngayKetThuc: { $lt: currentDate }
      }).populate('hocSinh');

      for (const ketQua of hocKyDaHet) {
        if (ketQua.hocSinh) {
          ketQua.hocSinh.dangHoc = true;
          await ketQua.hocSinh.save();
        }
      }

      console.log('Đã mở lại trạng thái đang học sau khi học kỳ kết thúc.');
      const hocSinh = await HocSinh.find();
      for (const hs of hocSinh) {
        console.log(`Học sinh ${hs.maHS}: Đang học - ${hs.dangHoc}`);
      }
    } catch (error) {
      console.error('Lỗi cập nhật học kỳ:', error);
    }
  });
};
module.exports = capNhatHocKyTask;
