"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshToken = exports.logout = exports.verifyOTP = exports.sendOtp = void 0;
const OtpService = __importStar(require("./otp.service"));
const UserService = __importStar(require("../user/user.service"));
const TokenService = __importStar(require("./token.service"));
const http_errors_1 = __importDefault(require("http-errors"));
const utils_1 = require("../../utils");
const config_1 = require("../../config/config");
const sendOtp = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            const err = new http_errors_1.default.BadRequest("Email is required");
            return next(err);
        }
        if (!(0, utils_1.isValidEmail)(email)) {
            const err = new http_errors_1.default.BadRequest("Invalid email format");
            return next(err);
        }
        // 1. Create OTP;
        const otp = OtpService.generateOTP();
        // 2. Hash OTP with email;
        const ttl = 1000 * 60 * 2; // 2 mins;
        const expires = Date.now() + ttl;
        const data = `${email}.${otp}.${expires}`;
        const hashedOTP = OtpService.hashOTP(data);
        // 3. Send OTP via Resend (HTTPS) first, fallback to Nodemailer, fallback to dev response
        let emailSent = false;
        try {
            if (config_1.config.resendApiKey) {
                emailSent = await OtpService.sendViaResend(email, otp);
            }
            if (!emailSent && config_1.config.emailUsername && config_1.config.emailPassword) {
                await OtpService.sendOTPtoEmail(email, otp);
                emailSent = true;
            }
        }
        catch (error) {
            console.error("Email sending error:", error.message || error);
        }
        console.log(`\n========================================`);
        console.log(`🔑 [OTP] Code for ${email} is: ${otp}`);
        console.log(`========================================\n`);
        // 4. Respond to the client;
        res.json({
            hash: `${hashedOTP}.${expires}`,
            email,
            msg: "OTP sent successfully ✅",
            devOtp: !emailSent ? otp : undefined
        });
    }
    catch (error) {
        next(error);
    }
};
exports.sendOtp = sendOtp;
const verifyOTP = async (req, res, next) => {
    const { email, otp, hash } = req.body;
    if (!email || !otp || !hash) {
        const err = new http_errors_1.default.BadRequest("All fields are required");
        return next(err);
    }
    // 1. OTP Verification;
    const [hashedOTP, expires] = hash.split(".");
    if (Date.now() > +expires) {
        const err = new http_errors_1.default.Unauthorized("OTP Expired");
        return next(err);
    }
    const data = `${email}.${otp}.${expires}`;
    const isValid = OtpService.verifyOTP(hashedOTP, data);
    if (!isValid) {
        const err = new http_errors_1.default.Unauthorized("Invalid OTP");
        return next(err);
    }
    // 2. Find or Create a new user;
    console.log(isValid);
    let user;
    try {
        user = await UserService.getUserByEmail(email);
        if (!user) {
            console.log("inside");
            user = await UserService.createUser({ email });
        }
    }
    catch (error) {
        return next(error);
    }
    // 3. Generate JWT;
    const { accessToken, refreshToken } = TokenService.generateToken({ _id: user._id, email: user.email });
    // 4. Store refresh token in DB;
    await TokenService.storeRefreshToken(user._id, refreshToken);
    // 5 sending token in cookie
    res.cookie('accessToken', accessToken, {
        maxAge: 1000 * 60 * 60, // 1 hour
        httpOnly: true,
        sameSite: 'none',
        secure: true
    });
    res.cookie('refreshToken', refreshToken, {
        maxAge: 1000 * 60 * 60, // 1 hour
        httpOnly: true,
        sameSite: 'none',
        secure: true
    });
    res.json({ auth: true, user });
};
exports.verifyOTP = verifyOTP;
const logout = async (req, res, next) => {
    try {
        const { refreshToken } = req.cookies;
        // delete refresh token from db
        await TokenService.deleteRefreshToken(refreshToken);
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.json({ msg: "Logged out successfully" }).status(200);
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
const refreshToken = async (req, res, next) => {
    // 1. Get refresh token from cookie;
    const { refreshToken: refreshTokenFromCookies } = req.cookies;
    if (!refreshTokenFromCookies) {
        const err = new http_errors_1.default.Unauthorized("Refresh token not found, please login again");
        return next(err);
    }
    // 2. Verify refresh token;
    let decodedToken;
    try {
        decodedToken = TokenService.verifyRefreshToken(refreshTokenFromCookies);
    }
    catch (error) {
        const err = new http_errors_1.default.Unauthorized("Invalid refresh token, please login again");
        return next(err);
    }
    // 3. Check if refresh token is in DB;
    try {
        const token = await TokenService.findRefreshToken(decodedToken._id, refreshTokenFromCookies);
        if (!token) {
            const err = new http_errors_1.default.Unauthorized("Refresh token not found in database, please login again");
            return next(err);
        }
    }
    catch (error) {
        return next(error);
    }
    // 4. Generate new tokens;
    const { accessToken, refreshToken } = TokenService.generateToken({ _id: decodedToken._id });
    // 5. Update refresh token in DB;
    try {
        await TokenService.updateRefreshToken(decodedToken._id, refreshToken);
    }
    catch (error) {
        return next(error);
    }
    // 6. Send new tokens to client in cookie;
    res.cookie('accessToken', accessToken, {
        maxAge: 1000 * 60 * 60 * 24 * 30,
        httpOnly: true,
        sameSite: 'none',
        secure: true
    });
    res.cookie('refreshToken', refreshToken, {
        maxAge: 1000 * 60 * 60 * 24 * 30,
        httpOnly: true,
        sameSite: 'none',
        secure: true
    });
    res.json({ auth: true }).status(200);
};
exports.refreshToken = refreshToken;
