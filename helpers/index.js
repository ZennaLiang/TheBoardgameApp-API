const nodeMailer = require("nodemailer");

const defaultEmailData = { from: "noreply@node-react.com" };

// get app specific password for gmail guide
// https://www.lifewire.com/get-a-password-to-access-gmail-by-pop-imap-2-1171882
exports.sendEmail = (emailData) => {
  const transporter = nodeMailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: "its.theboardgameguru@gmail.com",
      pass: "kbxdyxnidqskfplr",
    },
  });
  return transporter
    .sendMail(emailData)
    .then((info) => console.log(`Message sent: ${info.response}`))
    .catch((err) => console.log(`Problem sending email: ${err}`));
};
