import { Router } from "express";
import prisma from "./db.js";
import { requireAuth, requireRole } from "./middleware.js";

const router = Router();

router.use(requireAuth);

router.post("/:cvId/toggle", requireRole("RECRUITER", "ADMIN"), async (req, res) => {
    try {
        const cvId = req.params.cvId as string;
        const recruiterId = req.user!.id;

        const cv = await prisma.cv.findUnique({
            where: { id: cvId },
        });

        if (!cv) {
            return res.status(404).json({ error: "CV not found" });
        }

        const existingLike = await prisma.like.findUnique({
            where: {
                cvId_recruiterId: {
                    cvId,
                    recruiterId,
                },
            },
        });

        let liked = false;

        if (existingLike) {
            await prisma.like.delete({
                where: {
                    id: existingLike.id,
                },
            });
            liked = false;
        } else {
            await prisma.like.create({
                data: {
                    cvId,
                    recruiterId,
                },
            });
            liked = true;
        }

        const count = await prisma.like.count({
            where: { cvId },
        });

        res.json({ liked, count });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/:cvId", async (req, res) => {
    try {
        const cvId = req.params.cvId as string;

        const count = await prisma.like.count({
            where: { cvId },
        });

        let liked = false;
        const user = req.user!;

        if (user.role === "RECRUITER" || user.role === "ADMIN") {
            const existingLike = await prisma.like.findUnique({
                where: {
                    cvId_recruiterId: {
                        cvId,
                        recruiterId: user.id,
                    },
                },
            });
            liked = !!existingLike;
        }

        res.json({ liked, count });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
