"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config/config");
const db_1 = __importDefault(require("./config/db"));
require("./config/redis");
const http_1 = __importDefault(require("http"));
const sockethandlers_1 = require("./socket/sockethandlers");
const startServer = async () => {
    const port = config_1.config.port;
    // Connet to database
    await (0, db_1.default)();
    // Create HTTP server from Express app
    const httpServer = http_1.default.createServer(app_1.default);
    // Create socket.io server
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });
    io.on("connection", (socket) => {
        console.log("✅ User connected: ", socket.id);
        (0, sockethandlers_1.registerSocketHandlers)(socket, io);
        socket.on("disconnect", (reason) => {
            console.log("❌ User disconnected: ", socket.id, "Reason", reason);
        });
    });
    httpServer.listen(port, () => {
        console.log(`Listening on port: ${port}`);
    });
};
startServer();
