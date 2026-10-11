"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTPtoEmail = exports.verifyOTP = exports.hashOTP = exports.generateOTP = void 0;
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../../config/config");
const nodemailer_1 = __importDefault(require("nodemailer"));
const mailgen_1 = __importDefault(require("mailgen"));
// generate otp
const generateOTP = () => {
    const otp = crypto_1.default.randomInt(1000, 9999);
    return otp;
};
exports.generateOTP = generateOTP;
// hash otp
const hashOTP = (data) => {
    if (!config_1.config.hashingSecret) {
        throw new Error("Hashing secret is not defined");
    }
    return crypto_1.default
        .createHmac("sha256", config_1.config.hashingSecret)
        .update(data)
        .digest("hex");
};
exports.hashOTP = hashOTP;
// verify otp
const verifyOTP = (hashedOTP, data) => {
    const newHashedOTP = (0, exports.hashOTP)(data);
    return newHashedOTP === hashedOTP;
};
exports.verifyOTP = verifyOTP;
// send otp to user via email;
const _config = {
    service: "gmail",
    auth: {
        user: config_1.config.emailUsername,
        pass: config_1.config.emailPassword,
    },
};
const transporter = nodemailer_1.default.createTransport(_config);
const mailGenerator = new mailgen_1.default({
    theme: "default",
    product: {
        name: "bookMyScreen",
        link: "https://amritraj.vercel.app",
        logo: "https://res.cloudinary.com/amritrajmaurya/image/upload/v1751475322/zu4fnmh2jljzbtey77ah.png",
    },
});
const sendOTPtoEmail = async (email, otp) => {
    const emailTemp = {
        body: {
            name: '',
            intro: 'Welcome to bookMyScreen! We\'re very excited to have you on board.',
            action: {
                instructions: 'To verify your account, please use the following OTP:',
                button: {
                    color: '#323232', // Optional action button color
                    text: otp,
                    link: '#'
                }
            },
            outro: 'This OTP will expire in a short time (2 mins) for security reasons. If you did not request this OTP, please ignore this email.'
        }
    };
    const mail = mailGenerator.generate(emailTemp);
    let message = {
        from: config_1.config.emailUsername,
        to: email,
        subject: "Your OTP for bookMyScreen",
        html: mail
    };
    const info = await transporter.sendMail(message);
    console.log(info);
    return info.messageId;
};
exports.sendOTPtoEmail = sendOTPtoEmail;
