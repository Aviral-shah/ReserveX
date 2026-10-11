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
exports.verifyPayement = exports.createOrder = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const config_1 = require("../../config/config");
const crypto = __importStar(require("crypto"));
const createOrder = async (paymentData) => {
    const razorpay = new razorpay_1.default({
        key_id: config_1.config.razorpayKey,
        key_secret: config_1.config.razorpaySecret
    });
    const { amount } = paymentData;
    const option = {
        amount: amount * 100,
        currency: "INR",
        receipt: `bms-ticket_${Date.now()}`
    };
    const order = await razorpay.orders.create(option);
    return order;
};
exports.createOrder = createOrder;
const verifyPayement = async (paymentData) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;
    const expectedSignature = crypto.createHmac('sha256', config_1.config.razorpaySecret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");
    return expectedSignature === razorpay_signature;
};
exports.verifyPayement = verifyPayement;
