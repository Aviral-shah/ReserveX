import mongoose from "mongoose";
import dns from "dns";
import { config } from "./config";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = async () => {
    try {
        await mongoose.connect(config.databaseReplicaSet as string);
        console.log("Connected to database");
    } catch (error) {
        console.log("Failed to connect to database", error);
        process.exit(1);
    }
};

export default connectDB;