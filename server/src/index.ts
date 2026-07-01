import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import "dotenv/config";
import passport from "./auth.js";
import authRoutes from "./authRoutes.js";
import attributeRoutes from "./attributeRoutes.js";
import profileRoutes from "./profileRoutes.js";
import positionRoutes from "./positionRoutes.js";
import cvRoutes from "./cvRoutes.js";
import discussionRoutes from "./discussionRoutes.js";
import likeRoutes from "./likeRoutes.js";
import homeRoutes from "./homeRoutes.js";
import searchRoutes from "./searchRoutes.js";
import userRoutes from "./userRoutes.js";
import publicProfileRoutes from "./publicProfileRoutes.js";
import { setIo } from "./socket.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
    },
});

setIo(io);

io.on("connection", (socket) => {
    socket.on("join_position", (positionId: string) => {
        if (typeof positionId === "string" && positionId) {
            socket.join(`position:${positionId}`);
        }
    });

    socket.on("leave_position", (positionId: string) => {
        if (typeof positionId === "string" && positionId) {
            socket.leave(`position:${positionId}`);
        }
    });
});

app.use(express.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET || "dev-secret-change-me",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 7,
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRoutes);
app.use("/api/attributes", attributeRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/positions", positionRoutes);
app.use("/api/cvs", cvRoutes);
app.use("/api/discussions", discussionRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/users", userRoutes);
app.use("/api/public-profile", publicProfileRoutes);

app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "Hello from the server" });
});

const clientDist = path.resolve(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.use((_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
});

httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});