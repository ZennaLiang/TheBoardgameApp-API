import nodeMailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

interface EmailData {
  from?: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}

const defaultEmailData = { from: "noreply@node-react.com" };

export const sendEmail = (emailData: EmailData): Promise<any> => {
  const transporter = nodeMailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  
  return transporter
    .sendMail(emailData)
    .then((info) => console.log(`Message sent: ${info.response}`))
    .catch((err) => console.log(`Problem sending email: ${err}`));
};