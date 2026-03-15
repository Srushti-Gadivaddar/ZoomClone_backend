import dotenv from "dotenv";
dotenv.config();

import dns from "dns";

dns.setServers([
  '1.1.1.1',
  '8.8.8.8'
]);

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { createServer } from "node:http";
import connectToSocket from "./controllers/socketManager.js";

const app = express();
const PORT = process.env.PORT || 3000;

const server = createServer(app);
const io = connectToSocket(server);

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

//routes
import userRoutes from "./routes/user.js";

app.use(cors({
    origin: "http://localhost:5173", // or your frontend port
    credentials: true
}));
app.use(express.json({ limit: "40kb"}));
app.use(express.urlencoded({extended: true}));



app.get("/", (req, res) => {
    res.json({message: "Backend is running"});
});

app.use("/api/v1/users", userRoutes);   

const start = async () => {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
};

start();
