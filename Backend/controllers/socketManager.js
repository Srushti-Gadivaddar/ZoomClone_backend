import { time } from "node:console";
import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};

const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowHeaders: ["*"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log("Something is connected to socket server");
        console.log(`Socket connected: ${socket.id}`);

socket.on("join-call", (path) => {

    if (connections[path] === undefined) {
        connections[path] = [];
    }

    connections[path].push(socket.id);
    timeOnline[socket.id] = new Date();

    connections[path].forEach((socketId) => {
        io.to(socketId).emit("user-joined", connections[path]);
    });

    if (messages[path] !== undefined) {
        messages[path].forEach((msg) => {
            io.to(socket.id).emit(
                "chat-message",
                msg.data,
                msg.sender,
                msg.socketIdSender
            );
        });
    }

});


        socket.on("signal" , (toId, message) => {
            io.to(toId).emit("signal", socket.id, message); 
        });

        socket.on("chat-message", (data, sender) => {

    let matchingRoom = null;

    for (const [roomKey, roomValue] of Object.entries(connections)) {
        if (roomValue.includes(socket.id)) {
            matchingRoom = roomKey;
            break;
        }
    }

    if (matchingRoom) {

        if (!messages[matchingRoom]) {
            messages[matchingRoom] = [];
        }

        messages[matchingRoom].push({
            data: data,
            sender: sender,
            socketIdSender: socket.id
        });

        console.log("Message received:", data, "from", sender);

        connections[matchingRoom].forEach((element) => {
            io.to(element).emit("chat-message", data, sender, socket.id);
        });
    }
});


socket.on("disconnect", () => {

    console.log("Socket disconnected:", socket.id);

    for (const [k, v] of Object.entries(connections)) {

        if (v.includes(socket.id)) {

            connections[k] = v.filter(id => id !== socket.id);

            socket.to(k).emit("user-left", socket.id);

            if (connections[k].length === 0) {
                delete connections[k];
            }
        }
    }

});
        
    })
    return io;
};

export default connectToSocket;