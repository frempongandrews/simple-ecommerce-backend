import bcrypt from "bcryptjs";
import randomstring from "randomstring";
import nodemailer from "nodemailer";

export const hashPassword = (plainPassword) => bcrypt.hashSync(plainPassword, 10);

export const generateVerificationCode = () => randomstring.generate({ length: 7, readable: true });

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: "smtp.mail.yahoo.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: "frempongandrews@yahoo.com",
    pass: "rnpdhtcromsgzuiz",
  },
});

// default is to send email on register user
export const sendEmailUponRegistration = async ({
  to, subject, text, html, code,
}) => {
  try {
    const clientAppUrl = process.env.NODE_ENV === "development" ? process.env.DEV_CLIENT_APP_URL : process.env.PROD_CLIENT_APP_URL;
    const verificationCode = code || generateVerificationCode();
    const clientAppVerificationEmailLink = `${clientAppUrl}/verify-email`;
    // send mail with defined transport object
    const info = await transporter.sendMail({
      // sender address
      from: "frempongandrews@yahoo.com",
      to,
      // Subject line
      subject: subject || "Hello ✔",
      // plain text body
      text: text || `
        Welcome to app - Please use this code to verify your email at the following link
        Code: ${verificationCode}
        verify email
      `,
      // html body
      html: html || `
        <p>Welcome to app - Please use this code to verify your email at the following link</p>
        <span>Code: <b>${verificationCode}</b></span>
        <a href=${clientAppVerificationEmailLink}>verify email</a>
      `,
    });
    console.log("Message sent: %s", info.messageId);
    return {
      ...info,
      verificationCode,
    };
  } catch (err) {
    console.log("Error sending email", err.message);
    return err;
  }
};

export const sendVerificationCode = async ({ to, verificationCode }) => {
  try {
    const clientAppUrl = process.env.NODE_ENV === "development" ? process.env.DEV_CLIENT_APP_URL : process.env.PROD_CLIENT_APP_URL;
    const clientAppVerificationEmailLink = `${clientAppUrl}/verify-email`;
    // send mail with defined transport object
    const info = await transporter.sendMail({
      // sender address
      from: "frempongandrews@yahoo.com",
      to,
      // Subject line
      subject: "Verification code",
      // plain text body
      text: `
        Here is the verification code you requested - Please use this code to verify your email at the following link
        Code: ${verificationCode}
        verify email
      `,
      // html body
      html: `
        <p>Here is the verification code you requested - Please use this code to verify your email at the following link</p>
        <span>Code: <b>${verificationCode}</b></span>
        <a href=${clientAppVerificationEmailLink}>verify email</a>
      `,
    });
    console.log("Message sent: %s", info.messageId);
    return {
      ...info,
    };
  } catch (err) {
    console.log("Error sending email", err.message);
    return err;
  }
};