import crypto from "crypto";
import { config } from "../../config/config";
import nodemailer from "nodemailer";
import Mailgen from "mailgen";

// generate otp
export const generateOTP = () => {
  const otp = crypto.randomInt(1000, 9999);
  return otp;
};

// hash otp
export const hashOTP = (data: string) => {
  if (!config.hashingSecret) {
    throw new Error("Hashing secret is not defined");
  }
  return crypto
    .createHmac("sha256", config.hashingSecret)
    .update(data)
    .digest("hex");
};

// verify otp
export const verifyOTP = (hashedOTP: string, data: string) => {
  const newHashedOTP = hashOTP(data);
  return newHashedOTP === hashedOTP;
};

// send otp to user via email;

const _config = {
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: config.emailUsername,
    pass: config.emailPassword ? config.emailPassword.replace(/\s+/g, "") : "",
  },
};

const transporter = nodemailer.createTransport(_config);
const mailGenerator = new Mailgen({
  theme: "default",
  product: {
    name: "RESERVEX",
    link: "https://reservex-client.onrender.com",
    logo: "https://raw.githubusercontent.com/Aviral-shah/ReserveX/main/client/src/assets/main-icon.png",
  },
});



export const sendOTPtoEmail = async (email: string, otp: number) => {
    const emailTemp:any = {
            body: {
                name: '',
                intro: "Welcome to RESERVEX! We're very excited to have you on board.",
                action: {
                    instructions: 'To verify your account, please use the following OTP:',
                    button: {
                        color: '#E50914',
                        text: otp,
                        link: '#'
                    }
                },
                outro: 'This OTP will expire in a short time (2 mins) for security reasons. If you did not request this OTP, please ignore this email.'
            }
        };

        const mail = mailGenerator.generate(emailTemp);

        let message = {
            from : config.emailUsername,
            to: email,
            subject: "Your OTP for RESERVEX",
            html: mail
        }

        const info = await transporter.sendMail(message);
        console.log(info)
        return info.messageId;
}