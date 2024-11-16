const nodemailer = require("nodemailer");
const { link } = require("../routers/indexrouter");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  secure: true, 
  auth: {
    user: process.env.MAIL_ID,
    pass: process.env.MAIL_PASS,
  },
});

// async..await is not allowed in global scope, must use a wrapper
async function sendMail(otp,email) {
  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: process.env.MAIL_ID, // sender address
    to: email, // list of receivers
    subject: "Hello ✔", // Subject line
    // text:"Revivemart otp:",otp // plain text body
    html: `<p>Your OTP for Revivemart password reset is <b>${otp}</b>. It expires in 1 minute. Do not share it with anyone. [Revivemart Team]"</p>`, // html body

  });

}
module.exports=sendMail

