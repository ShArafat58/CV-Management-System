import { Router } from "express";
import prisma from "./db.js";
import { requireAuth } from "./middleware.js";

const router = Router();

router.post("/", requireAuth, async (req, res) => {
    try {
        const { summary, priority, link, positionId } = req.body;

        if (typeof summary !== "string" || summary.trim() === "") {
            return res.status(400).json({ error: "Summary is required" });
        }
        if (priority !== "High" && priority !== "Average" && priority !== "Low") {
            return res.status(400).json({ error: "Invalid priority" });
        }

        let positionTitle = "";
        if (typeof positionId === "string" && positionId) {
            const position = await prisma.position.findUnique({
                where: { id: positionId },
                select: { title: true },
            });
            positionTitle = position?.title || "";
        }

        const adminEmails = (process.env.ADMIN_EMAILS || "")
            .split(",")
            .map((e) => e.trim())
            .filter((e) => e !== "");

        const ticket = {
            reportedBy: `${req.user!.displayName} (${req.user!.role})`,
            reporterEmail: req.user!.email,
            position: positionTitle,
            link: typeof link === "string" ? link : "",
            priority,
            summary: summary.trim(),
            adminEmails,
            createdAt: new Date().toISOString(),
        };

        const fileName = `ticket-${Date.now()}.json`;
        const dropboxToken = process.env.DROPBOX_TOKEN as string;

        const uploadResponse = await fetch("https://content.dropboxapi.com/2/files/upload", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${dropboxToken}`,
                "Content-Type": "application/octet-stream",
                "Dropbox-API-Arg": JSON.stringify({
                    path: `/${fileName}`,
                    mode: "add",
                    autorename: true,
                    mute: false,
                }),
            },
            body: JSON.stringify(ticket, null, 2),
        });

        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok) {
            return res.status(502).json({ error: "Dropbox upload failed", details: uploadData });
        }

        res.json({ ok: true, fileName, ticket });
    } catch (error: any) {
        res.status(500).json({ error: error.message || "Ticket creation failed" });
    }
});

export default router;