"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSocketHandlers = void 0;
const redis_1 = __importDefault(require("../config/redis"));
const registerSocketHandlers = (socket, io) => {
    /**
     * USER JOINS A SHOW ROOM
     * ----------------------
     * When a user opens the seat layout page,
     * we send all currently locked seats.
     */
    socket.on("join-show", async ({ showId }) => {
        // Join the room using showId
        socket.join(showId);
        socket.data.showId = showId;
        console.log(`✅ Socket ${socket.id} joined show ${showId}`);
        /**
         * Fetch all locked seats from Redis SET
         * Example key:
         * locked-seats:show123 -> ["A1","A2","B5"]
         */
        const lockedSeats = await redis_1.default.smembers(`locked-seats:${showId}`);
        const activeLockedSeats = [];
        for (const seatId of lockedSeats) {
            const lockKey = `seat-lock:${showId}:${seatId}`;
            const exists = await redis_1.default.exists(lockKey);
            if (exists) {
                activeLockedSeats.push(seatId);
            }
            else {
                await redis_1.default.srem(`locked-seats:${showId}`, seatId);
            }
        }
        // send locked seat to all the users present in this show room
        socket.emit("locked-seats-initials", { seatIds: activeLockedSeats });
    });
    /**
     * LOCK SEATS
     * ----------
     * User clicks "Proceed"
     * We lock seats for 5 minutes
     */
    socket.on("lock-seats", async ({ showId, seatIds, userId }) => {
        if (!seatIds || !showId || !userId)
            return;
        const lockedSeatsKeys = `locked-seats:${showId}`;
        const unavailableSeats = [];
        /**
         * STEP 1: Check if seats are already locked
         */
        for (const seatId of seatIds) {
            const seatLockKey = `seat-lock:${showId}:${seatId}`;
            const exisitingLock = await redis_1.default.get(seatLockKey);
            if (exisitingLock) {
                unavailableSeats.push(seatId);
            }
        }
        /**
         * If any seat already locked → reject request
         */
        if (unavailableSeats.length > 0) {
            socket.emit("seat-locked-failed", {
                showId,
                requested: seatIds,
                alreadyLocked: unavailableSeats,
            });
            return;
        }
        /**
         * STEP 2: Lock all seats
         */
        for (const seatId of seatIds) {
            const seatLockKey = `seat-lock:${showId}:${seatId}`;
            /**
             * Store seat lock with TTL
             * TTL = 5 minutes
             */
            await redis_1.default.setex(seatLockKey, 300, userId);
            /**
             * Add seat to locked seats SET
             */
            await redis_1.default.sadd(lockedSeatsKeys, seatId);
        }
        /**
         * STEP 3: Broadcast seat lock to everyone in the show
         */
        io.to(showId).emit("seat-locked", {
            showId,
            seatIds,
            userId,
        });
        console.log(`✅ ${userId} locked seats:`, seatIds);
    });
    /**
     * UNLOCK SEATS
     * ------------
     * Triggered when:
     * - User leaves checkout
     * - User cancels booking
     */
    socket.on("unlock-seats", async ({ showId, seatIds, userId }) => {
        if (!showId || !seatIds?.length)
            return;
        const lockedSeatsKeys = `locked-seats:${showId}`;
        for (const seatId of seatIds) {
            const seatLockKey = `seat-lock:${showId}:${seatId}`;
            // remove indivisual seat lock
            await redis_1.default.del(seatLockKey);
            /**
             * Remove seat from locked SET
             */
            await redis_1.default.srem(lockedSeatsKeys, seatId);
        }
        /**
         * Notify all clients that seats are unlocked
         */
        io.to(showId).emit("seat-unlocked", {
            showId,
            seatIds,
            userId,
        });
        console.log(`🔓 ${userId} unlocked seats:`, seatIds);
    });
    /**
     * SOCKET DISCONNECT
     * -----------------
     * We don't manually unlock seats here.
     * Redis TTL will automatically release them after 5 minutes.
     */
    socket.on("disconnect", () => {
        const showId = socket.data.showId;
        console.log(`❌ Socket ${socket.id} disconnected from show ${showId}`);
    });
};
exports.registerSocketHandlers = registerSocketHandlers;
