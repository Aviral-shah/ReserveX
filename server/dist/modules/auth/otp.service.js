"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTPtoEmail = exports.sendViaResend = exports.verifyOTP = exports.hashOTP = exports.generateOTP = void 0;
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
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: config_1.config.emailUsername,
        pass: config_1.config.emailPassword ? config_1.config.emailPassword.replace(/\s+/g, "") : "",
    },
};
const transporter = nodemailer_1.default.createTransport(_config);
const mailGenerator = new mailgen_1.default({
    theme: "default",
    product: {
        name: "RESERVEX",
        link: "https://reservex-client.onrender.com",
        logo: "https://raw.githubusercontent.com/Aviral-shah/ReserveX/main/client/src/assets/main-icon.png",
    },
});
const https_1 = __importDefault(require("https"));
const sendViaResend = async (email, otp) => {
    if (!config_1.config.resendApiKey)
        return false;
    const emailTemp = {
        body: {
            name: "",
            intro: "Welcome to RESERVEX! We're very excited to have you on board.",
            action: {
                instructions: "To verify your account, please use the following OTP:",
                button: {
                    color: "#E50914",
                    text: otp,
                    link: "#",
                },
            },
            outro: "This OTP will expire in 2 minutes for security reasons. If you did not request this OTP, please ignore this email.",
        },
    };
    const mailHtml = mailGenerator.generate(emailTemp);
    const payload = JSON.stringify({
        from: "RESERVEX <onboarding@resend.dev>",
        to: [email],
        subject: "Your OTP for RESERVEX",
        html: mailHtml,
    });
    return new Promise((resolve) => {
        const req = https_1.default.request("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${config_1.config.resendApiKey}`,
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload),
            },
        }, (res) => {
            let body = "";
            res.on("data", (chunk) => (body += chunk));
            res.on("end", () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    console.log("✅ [Resend] Email delivered successfully:", body);
                    resolve(true);
                }
                else {
                    console.error("⚠️ [Resend API Response]:", res.statusCode, body);
                    resolve(false);
                }
            });
        });
        req.on("error", (err) => {
            console.error("⚠️ [Resend Request Error]:", err.message);
            resolve(false);
        });
        req.write(payload);
        req.end();
    });
};
exports.sendViaResend = sendViaResend;
const sendOTPtoEmail = async (email, otp) => {
    const emailTemp = {
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
        from: config_1.config.emailUsername,
        to: email,
        subject: "Your OTP for RESERVEX",
        html: mail
    };
    const info = await transporter.sendMail(message);
    console.log(info);
    return info.messageId;
};
exports.sendOTPtoEmail = sendOTPtoEmail;
