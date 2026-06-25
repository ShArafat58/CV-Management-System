import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

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