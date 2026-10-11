"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBookings = exports.createBooking = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const utils_1 = require("../../utils");
const booking_model_1 = __importDefault(require("./booking.model"));
const razorpay_1 = __importDefault(require("razorpay"));
const config_1 = require("../../config/config");
const show_service_1 = require("../show/show.service");
const createBooking = async (bookingData, userId) => {
    // 🔹 1. Basic validation
    if (!bookingData.showId || !bookingData.seats || bookingData.seats.length === 0 || !bookingData.paymentId || !bookingData.bookingFee) {
        throw new Error(`Invalid booking data!`);
    }
    // 🔹 2. Destructure all properties from body
    const { showId, seats, paymentId, bookingFee } = bookingData;
    // 🔹 3. Generate unique booking reference
    const bookingRef = (0, utils_1.generateBookingReference)();
    // 🔹 4. Start Transaction // Protects against race condition
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        // 🔹 5. Critical Query (Check if ANY of the requested seats are already booked)
        const existingBooking = await booking_model_1.default.findOne({
            showId, status: "CONFIRMED", seats: { $in: seats }
        }).session(session);
        if (existingBooking) {
            throw new Error(`One or more of the requested seats are already booked!`);
        }
        // 🔹 6. Verify Payement
        // - Fetch payment details and validate
        const razorpay = new razorpay_1.default({
            key_id: config_1.config.razorpayKey,
            key_secret: config_1.config.razorpaySecret
        });
        const paymentDetails = await razorpay.payments.fetch(paymentId);
        if (paymentDetails.status !== "captured") {
            throw new Error(`Payment not successful!`);
        }
        // 🔹 7. Create Booking
        const [booking] = await booking_model_1.default.create([
            {
                bookingRef,
                userId,
                showId,
                seats,
                status: "CONFIRMED",
                paymentId,
                paymentMethod: paymentDetails.method,
                bookingFee,
            }
        ], { session });
        // 🔹 8. Update Seat Availability in Show Document
        await (0, show_service_1.updateSeatStatus)(showId, seats, "BOOKED", session);
        // 🔹 9. Commit Transaction
        await session.commitTransaction();
        session.endSession();
        return booking;
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};
exports.createBooking = createBooking;
const getAllBookings = async (userId) => {
    return await booking_model_1.default.find({ userId })
        .populate({
        path: "showId",
        select: "startTime date audioType",
        populate: [
            {
                path: "movie",
                select: "title posterUrl duration format"
            },
            {
                path: "theater",
                select: "name location city state"
            }
        ]
    }).sort({ createdAt: -1 }); // latest booking first
};
exports.getAllBookings = getAllBookings;
