"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = require("dotenv");
const dns_1 = __importDefault(require("dns"));
(0, dotenv_1.config)();
try {
    dns_1.default.setServers(['8.8.8.8', '1.1.1.1']);
}
catch {
    // ignore if not supported in environment
}
const _config = {
    port: process.env.PORT,
    databaseUrl: (process.env.MONGO_CONNECTION_STRING || process.env.MONGO_REPLICA_STRING),
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    hashingSecret: process.env.HASH_SECRET,
    emailUsername: (process.env.EMAIL_USERNAME || process.env.NODEMAILER_EMAIL),
    emailPassword: (process.env.EMAIL_PASSWORD || process.env.NODEMAILER_PASSWORD),
    redisUri: (process.env.REDIS_URI || process.env.REDIS_URL),
    redisHost: process.env.REDIS_HOST,
    redisPort: parseInt(process.env.REDIS_PORT || "6379"),
    redisPassword: process.env.REDIS_PASSWORD,
    razorpayKey: process.env.RAZORPAY_API_KEY,
    razorpaySecret: process.env.RAZORPAY_SECRET_KEY,
    databaseReplicaSet: (process.env.MONGO_REPLICA_STRING || process.env.MONGO_CONNECTION_STRING),
    resendApiKey: process.env.RESEND_API_KEY,
};
exports.config = Object.freeze(_config);
