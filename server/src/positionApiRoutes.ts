import { Router } from "express";
import { randomBytes } from "crypto";
import prisma from "./db.js";
import { requireAuth, requireRole } from "./middleware.js";

const router = Router();

router.post("/:id/token", requireAuth, requireRole("RECRUITER", "ADMIN"), async (req, res) => {
    try {
        const positionId = req.params.id as string;

        const position = await prisma.position.findUnique({
            where: { id: positionId },
            select: { id: true, apiToken: true },
        });
        if (!position) {
            return res.status(404).json({ error: "Position not found" });
        }

        if (position.apiToken) {
            return res.json({ apiToken: position.apiToken, created: false });
        }

        const token = randomBytes(24).toString("hex");
        const updated = await prisma.position.update({
            where: { id: positionId },
            data: { apiToken: token },
            select: { apiToken: true },
        });

        res.json({ apiToken: updated.apiToken, created: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to generate token" });
    }
});

export default router;