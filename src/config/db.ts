import mongoose from "mongoose";
import { config } from "./config";

const connectDB = async () => {
    try {
        mongoose.connection.on("connected", () => {
            console.log("Connected to database successfully");
        });

        mongoose.connection.on("error", (err) => {
            console.log("error in connecting to database", err);
        });

        await mongoose.connect(config.databaseURL as string);
    } catch (err) {
        console.log("Failed to connect to database", err);
        process.exit(1); //this line stop the server because if database does not run then why we run the server
    }
};

export default connectDB;
