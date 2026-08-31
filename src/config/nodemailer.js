import nodemailer from 'nodemailer';

const port = parseInt(process.env.EMAIL_PORT || '587', 10);
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  port: isNaN(port) ? 587 : port,
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default transporter;
