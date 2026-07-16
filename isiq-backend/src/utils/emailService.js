const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (email, code) => {
  const mailOptions = {
    from: `"İşıq App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'İşıq — Qeydiyyat Təsdiq Kodu',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #FF4B6E, #FF8C5A); padding: 30px; border-radius: 16px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px;">💘 İşıq</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Sevgiyi tap</p>
        </div>
        <div style="padding: 30px; background: #fff; border-radius: 16px; margin-top: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <h2 style="color: #333; margin-top: 0;">Qeydiyyat Təsdiqi</h2>
          <p style="color: #666;">Qeydiyyatı tamamlamaq üçün aşağıdakı kodu daxil edin:</p>
          <div style="background: #FFF0F3; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #FF4B6E; font-size: 42px; letter-spacing: 8px; margin: 0;">${code}</h1>
          </div>
          <p style="color: #999; font-size: 13px;">Bu kod 10 dəqiqə ərzində etibarlıdır.</p>
          <p style="color: #999; font-size: 13px;">Əgər siz qeydiyyat etməmisinizsə, bu emaili nəzərə almayın.</p>
        </div>
        <p style="text-align: center; color: #ccc; font-size: 12px; margin-top: 16px;">© 2026 İşıq App</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };