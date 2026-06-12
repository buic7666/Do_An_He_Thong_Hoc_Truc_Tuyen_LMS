const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text }) => {
  try {
    // Cần cấu hình EMAIL_USER và EMAIL_PASS trong file .env
    // Nếu dùng Gmail, bạn cần tạo "Mật khẩu ứng dụng" (App Password) thay vì mật khẩu gốc.
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Hệ Thống LMS" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email đã được gửi thành công đến ${to}`);
  } catch (error) {
    console.error('Lỗi khi gửi email:', error);
  }
};

module.exports = sendEmail;