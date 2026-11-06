// Dùng chung 1 transporter Nodemailer (tạo 1 lần, tái sử dụng kết nối)
const nodemailer = require('nodemailer');

let transporter = null;

function isMailConfigured() {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
}

function getTransporter() {
  if (!isMailConfigured()) {
    const err = new Error('Chưa cấu hình EMAIL_USER / EMAIL_PASS trong file .env');
    err.code = 'MAIL_NOT_CONFIGURED';
    throw err;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 465,
      secure: (Number(process.env.EMAIL_PORT) || 465) === 465,
      pool: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
}

async function sendMail({ to, subject, html }) {
  return getTransporter().sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
}

module.exports = { sendMail, isMailConfigured };
