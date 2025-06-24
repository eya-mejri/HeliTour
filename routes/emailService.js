const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    /*user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS*/
  }
});

/*async function sendEmail(to, subject, text) {
  try {
    await transporter.sendMail({
      from: '"Helitour Tunisia" <malekchallouf24@gmail.com>',
      to,
      subject,
      text
    });
  } catch (error) {
    console.error("Email failed:", error);
  }
}
*/
module.exports = { sendEmail };