import { config as conf } from 'dotenv';
import dns from 'dns';
conf();

try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
    // ignore if not supported in environment
}

const _config = {
    port: process.env.PORT,
    databaseUrl: (process.env.MONGO_CONNECTION_STRING || process.env.MONGO_REPLICA_STRING) as string,
    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET as string,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET as string,
    hashingSecret: process.env.HASH_SECRET as string,
    emailUsername: (process.env.EMAIL_USERNAME || process.env.NODEMAILER_EMAIL) as string,
    emailPassword: (process.env.EMAIL_PASSWORD || process.env.NODEMAILER_PASSWORD) as string,
    redisUri: (process.env.REDIS_URI || process.env.REDIS_URL) as string,
    redisHost: process.env.REDIS_HOST as string,
    redisPort: parseInt(process.env.REDIS_PORT || "6379"),
    redisPassword: process.env.REDIS_PASSWORD as string,
    razorpayKey : process.env.RAZORPAY_API_KEY as string,
    razorpaySecret : process.env.RAZORPAY_SECRET_KEY as string,
    databaseReplicaSet: (process.env.MONGO_REPLICA_STRING || process.env.MONGO_CONNECTION_STRING) as string,
    resendApiKey: process.env.RESEND_API_KEY as string,
}

export const config = Object.freeze(_config);