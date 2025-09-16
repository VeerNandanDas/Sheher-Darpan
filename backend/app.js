import express from "express";
import cors from "cors";
import http from "http";
// import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";
import morgan from "morgan";
import { initDb } from "./utils/db.js";
import adminRouter from "./routes/admin.route.js";
import authRouter from "./routes/auth.routes.js";
import reportRouter from "./routes/report.route.js";
import userRouter from "./routes/user.route.js";

dotenv.config();

const app = express();
// const server = http.createServer(app);
// const io = new SocketIOServer(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use("/api/reports", reportRouter);
app.use("/api/users", userRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Socket.io basic connection
// io.on("connection", (socket) => {
//   socket.on("disconnect", () => {
//   });
// });

// Start server after DB init
const PORT = process.env.PORT || 5000;
await initDb();
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
