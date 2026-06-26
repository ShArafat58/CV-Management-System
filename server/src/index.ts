import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import passport from "./auth.js";
import authRoutes from "./authRoutes.js";
import attributeRoutes from "./attributeRoutes.js";
import profileRoutes from "./profileRoutes.js";
import positionRoutes from "./positionRoutes.js";
import cvRoutes from "./cvRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

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

app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "Hello from the server" });
});

const clientDist = path.resolve(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.use((_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});