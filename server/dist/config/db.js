"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dns_1 = __importDefault(require("dns"));
const config_1 = require("./config");
dns_1.default.setServers(["8.8.8.8", "1.1.1.1"]);
const connectDB = async () => {
    try {
        await mongoose_1.default.connect(config_1.config.databaseReplicaSet);
        console.log("Connected to database");
    }
    catch (error) {
        console.log("Failed to connect to database", error);
        process.exit(1);
    }
};
exports.default = connectDB;
