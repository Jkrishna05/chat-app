import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { dbConnect } from "./config/db.js";
import userRouter from "./Routes/userRoute.js";
import messageRouter from "./Routes/messageRoutes.js";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import Token from "./models/tokenModel.js";
import jwt from "jsonwebtoken";

dotenv.config();
console.log(process.env.CLOUDINARY_API_KEY);

const app = express();
const server = http.createServer(app); // HTTP server

dbConnect();

// trust proxy for correct req.ip when behind proxies (Heroku/Render)
app.set("trust proxy", 1);

// ================= SOCKET.IO SETUP ==================
export const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
});

// store online users
export let onlineUsers = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("user connected", userId);

  if (userId) {
    onlineUsers[userId] = socket.id;
  }

  // emit online users to all connected clients
  io.emit("getOnlineUsers", Object.keys(onlineUsers));

  socket.on("disconnect", () => {
    console.log("user disconnected", userId);
    delete onlineUsers[userId];
    io.emit("getOnlineUsers", Object.keys(onlineUsers));
  });
});

// ================== MIDDLEWARE ==================
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // frontend URL
    credentials: true, // allow cookies/auth headers
  })
);

app.use(express.json({ limit: "40mb" }));
app.use(cookieParser());

// ================== ROUTES ==================
app.use("/user", userRouter);
app.use("/message", messageRouter);

// ================== LOGOUT ROUTE ==================
app.post("/user/logout", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    await Token.deleteOne({ token: refreshToken });
  }
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ success: true, message: "Logged out" });
});

// ================== REFRESH TOKEN ROUTE ==================
app.post("/refresh", async (req, res) => {
  const oldToken = req.cookies.refreshToken;
  if (!oldToken)
    return res.status(401).json({ message: "No refresh token" });

  try {
    const decoded = jwt.verify(oldToken, process.env.JWT_SECRET);

    // check if token exists in DB
    const dbToken = await Token.findOne({
      userId: decoded._id,
      token: oldToken,
    });
    if (!dbToken) {
      return res
        .status(401)
        .json({ message: "Invalid or expired refresh token" });
    }

    // suspicious activity check
    if (dbToken.ip !== req.ip || dbToken.userAgent !== req.headers["user-agent"]) {
      // logout all sessions
      await Token.deleteMany({ userId: decoded._id });
      return res
        .status(401)
        .json({ message: "Suspicious login detected. Please login again." });
    }

    // delete old refresh token (rotation)
    await Token.deleteOne({ _id: dbToken._id });

    // issue new tokens
    const newAccessToken = jwt.sign(
      { _id: decoded._id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    const newRefreshToken = jwt.sign(
      { _id: decoded._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // save new refresh token with IP/device
    await Token.create({
      userId: decoded._id,
      token: newRefreshToken,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // set cookies
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true });
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Refresh token expired, please login again" });
  }
});

// ================== SERVER START ==================
// if(process.env.NODE_ENV !== "production"){
  server.listen(process.env.PORT, () => {
    console.log(`server started at port ${process.env.PORT}`);
  });
// }
// for vercel
export default server;
