const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Room = require("./models/Room");
const Message = require("./models/Message");
const allowedOrigins = require('./config/allowedOrigins');

const initializeSocket = (server) => {
  const io = require("socket.io")(server, {
    cors: {
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Middleware — authenticate every socket connection
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error — no token"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new Error("Authentication error — user not found"));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication error — token failed"));
    }
  });

  // Handle connections
  io.on("connection", async (socket) => {
    console.log(`User connected: ${socket.user.username}`);

    // Mark user as online
    await User.findByIdAndUpdate(socket.user._id, { isOnline: true });
    socket.broadcast.emit("user_online", {
      userId: socket.user._id,
      username: socket.user.username,
    });

    // =====================
    // JOIN ROOM
    // =====================
    socket.on("join_room", async (roomId) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return socket.emit("error", { message: "Room not found" });

        // Join the socket room
        socket.join(roomId);
        console.log(`${socket.user.username} joined room: ${room.name}`);

        // Load last 50 messages
        const messages = await Message.find({ room: roomId }).sort({ createdAt: -1 }).limit(50).populate("sender", "username avatar").lean();

        // Send message history to this user only
        socket.emit("message_history", messages.reverse());

        // Tell everyone in room this user joined
        socket.to(roomId).emit("user_joined", {
          userId: socket.user._id,
          username: socket.user.username,
        });
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    // =====================
    // SEND MESSAGE
    // =====================
    socket.on("send_message", async (data) => {
      try {
        const { roomId, content } = data;

        // Validate
        if (!content || !content.trim()) {
          return socket.emit("error", { message: "Message cannot be empty" });
        }

        // Check room exists
        const room = await Room.findById(roomId);
        if (!room) {
          return socket.emit("error", { message: "Room not found" });
        }

        // Save message to MongoDB
        const message = await Message.create({
          sender: socket.user._id,
          room: roomId,
          content: content.trim(),
        });

        // Populate sender info
        const populatedMessage = await Message.findById(message._id).populate("sender", "username avatar").lean();

        // Update room's last message
        await Room.findByIdAndUpdate(roomId, { lastMessage: message._id });

        // Broadcast to EVERYONE in the room (including sender)
        io.to(roomId).emit("new_message", populatedMessage);
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    // =====================
    // TYPING INDICATORS
    // =====================
    socket.on("typing", (roomId) => {
      socket.to(roomId).emit("user_typing", {
        userId: socket.user._id,
        username: socket.user.username,
      });
    });

    socket.on("stop_typing", (roomId) => {
      socket.to(roomId).emit("user_stop_typing", {
        userId: socket.user._id,
        username: socket.user.username,
      });
    });

    // =====================
    // LEAVE ROOM
    // =====================
    socket.on("leave_room", (roomId) => {
      socket.leave(roomId);
      socket.to(roomId).emit("user_left", {
        userId: socket.user._id,
        username: socket.user.username,
      });
      console.log(`${socket.user.username} left room: ${roomId}`);
    });

    // =====================
    // DISCONNECT
    // =====================
    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${socket.user.username}`);
      await User.findByIdAndUpdate(socket.user._id, { isOnline: false });
      socket.broadcast.emit("user_offline", {
        userId: socket.user._id,
        username: socket.user.username,
      });
    });
  });

  return io;
};

module.exports = initializeSocket;
