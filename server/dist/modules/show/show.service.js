"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSeatStatus = exports.getShowById = exports.getShowsByMovieDateLocation = exports.createShow = void 0;
const mongoose_1 = require("mongoose");
const utils_1 = require("../../utils");
const show_model_1 = require("./show.model");
const theater_model_1 = require("../theater/theater.model");
const defaultPriceMap = () => new Map([
    ["PREMIUM", 510],
    ["EXECUTIVE", 290],
    ["NORMAL", 180],
]);
const fixedTimeSlots = [
    { startTime: "09:30 AM", format: "2D", audioType: "Dolby 7.1" },
    { startTime: "01:00 PM", format: "3D", audioType: "Dolby Atmos" },
    { startTime: "04:30 PM", format: "IMAX", audioType: "Dolby Atmos" },
    { startTime: "07:45 PM", format: "2D", audioType: "Dolby 7.1" },
    { startTime: "10:30 PM", format: "PVR PXL", audioType: "Dolby Atmos" },
];
//1. Create a show
const createShow = async (showData) => {
    const seatLayout = (0, utils_1.generateSeatLayout)();
    const showToCreate = { ...showData, seatLayout };
    return await show_model_1.ShowModel.create(showToCreate);
};
exports.createShow = createShow;
//2. get shows by movie date and location
const getShowsByMovieDateLocation = async (movieId, date, location) => {
    if (!mongoose_1.Types.ObjectId.isValid(movieId)) {
        return [];
    }
    const safeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const query = {
        movie: new mongoose_1.Types.ObjectId(movieId),
    };
    if (location) {
        query.location = { $regex: new RegExp(safeRegex(location), "i") };
    }
    if (date) {
        query.date = date;
    }
    let shows = await show_model_1.ShowModel.find(query)
        .populate("movie theater")
        .sort({ startTime: 1 });
    // Option B: If no shows exist for this date & movie, auto-populate dynamically
    if ((!shows || shows.length === 0) && date && movieId) {
        try {
            let theaters = await theater_model_1.TheaterModel.find(location ? { state: { $regex: new RegExp(safeRegex(location), "i") } } : {});
            // Fallback: if no theaters match that state, pick up to 3 existing theaters
            if (!theaters || theaters.length === 0) {
                theaters = await theater_model_1.TheaterModel.find().limit(3);
            }
            if (theaters.length > 0) {
                const showsToCreate = [];
                for (let idx = 0; idx < theaters.length; idx++) {
                    const theater = theaters[idx];
                    const count = 3 + (idx % 2); // 3 to 4 slots per theater
                    const selectedSlots = fixedTimeSlots.slice(0, count);
                    for (const slot of selectedSlots) {
                        showsToCreate.push({
                            movie: new mongoose_1.Types.ObjectId(movieId),
                            theater: theater._id,
                            location: location || theater.state,
                            format: slot.format,
                            audioType: slot.audioType,
                            startTime: slot.startTime,
                            date: date,
                            priceMap: defaultPriceMap(),
                            seatLayout: (0, utils_1.generateSeatLayout)(),
                        });
                    }
                }
                if (showsToCreate.length > 0) {
                    await show_model_1.ShowModel.insertMany(showsToCreate);
                    shows = await show_model_1.ShowModel.find(query)
                        .populate("movie theater")
                        .sort({ startTime: 1 });
                }
            }
        }
        catch (err) {
            console.error("Auto-populating demo shows failed gracefully:", err);
        }
    }
    const groupedShows = (0, utils_1.groupShowsByTheatreAndMovie)(shows);
    return groupedShows;
};
exports.getShowsByMovieDateLocation = getShowsByMovieDateLocation;
//3. get show by id
const getShowById = async (showId) => {
    return await show_model_1.ShowModel.findById(showId).populate("movie theater");
};
exports.getShowById = getShowById;
//4. update seat status
const updateSeatStatus = async (showId, seats, status, session) => {
    const show = await show_model_1.ShowModel.findById(showId).session(session);
    if (!show) {
        throw new Error(`Show not found!`);
    }
    // Parse each seat string like "A1" into row and number
    const parsedSeats = seats.map((seat) => {
        const row = seat.charAt(0);
        const number = parseInt(seat.slice(1));
        return { row, number };
    });
    // Update the seat layout based on the parsed seats
    for (const parsedSeat of parsedSeats) {
        // Search the seatLayout array for a row whose "row" field matches e.g. "A1"
        // seatLayout = [{ row: "A", seats: [...] }, { row: "B", seats: [...] }]
        const row = show.seatLayout.find((r) => r.row === parsedSeat.row);
        if (!row) {
            throw new Error(`Invalid seat row: ${parsedSeat.row}`);
        }
        // Inside the found row, search the seats array for matching seat number
        // row.seats = [{ number: 1, status: "AVAILABLE" }, { number: 2, status: "AVAILABLE" }]
        const seat = row.seats.find((s) => s.number === parsedSeat.number);
        if (!seat) {
            throw new Error(`Invalid seat number: ${parsedSeat.number} in row ${parsedSeat.row}`);
        }
        // Guard: prevent double booking — if already BOOKED, reject the whole transaction
        if (seat.status === "BOOKED") {
            throw new Error(`Seat ${parsedSeat.row}${parsedSeat.number} is already booked!`);
        }
        seat.status = status; // Update the seat status to BOOKED or BLOCKED
    }
    show.markModified("seatLayout"); // Inform Mongoose that seatLayout has been modified
    await show.save({ session }); // Save the updated show document within the transaction session
};
exports.updateSeatStatus = updateSeatStatus;
