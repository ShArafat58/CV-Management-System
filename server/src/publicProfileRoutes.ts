import { Router } from "express";
import prisma from "./db.js";
import { requireAuth } from "./middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId as string;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                displayName: true,
                role: true,
                createdAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const viewerId = req.user!.id;
        const viewerRole = req.user!.role;
        const isOwner = viewerId === userId;
        const isAdmin = viewerRole === "ADMIN";

        const cvWhere: { userId: string; published?: boolean } = { userId };
        if (!isOwner && !isAdmin) {
            cvWhere.published = true;
        }

        const cvs = await prisma.cv.findMany({
            where: cvWhere,
            select: {
                id: true,
                positionId: true,
                createdAt: true,
                position: {
                    select: {
                        title: true,
                    },
                },
                _count: {
                    select: {
                        likes: true,
                    },
                },
            },
        });

        const formattedCvs = cvs.map((cv) => ({
            id: cv.id,
            positionId: cv.positionId,
            positionTitle: cv.position.title,
            createdAt: cv.createdAt,
            likesCount: cv._count.likes,
        }));

        res.json({
            user,
            cvs: formattedCvs,
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
