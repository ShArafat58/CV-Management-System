import { Router } from "express";
import { requireAuth } from "./middleware.js";
import prisma from "./db.js";
import { getIo } from "./socket.js";

const router = Router();

router.use(requireAuth);

router.get("/:positionId", async (req, res) => {
    try {
        const positionId = req.params.positionId as string;
        const position = await prisma.position.findUnique({
            where: { id: positionId },
        });

        if (!position) {
            return res.status(404).json({ error: "Position not found" });
        }

        const posts = await prisma.post.findMany({
            where: { positionId },
            orderBy: { createdAt: "asc" },
            select: {
                id: true,
                content: true,
                createdAt: true,
                authorId: true,
                author: {
                    select: {
                        displayName: true,
                        role: true,
                    },
                },
            },
        });

        const formattedPosts = posts.map((post) => ({
            id: post.id,
            content: post.content,
            createdAt: post.createdAt,
            authorId: post.authorId,
            authorName: post.author.displayName,
            authorRole: post.author.role,
        }));

        res.json(formattedPosts);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/:positionId", async (req, res) => {
    try {
        const positionId = req.params.positionId as string;
        const { content } = req.body;

        if (typeof content !== "string" || content.trim() === "") {
            return res.status(400).json({ error: "Content must be a non-empty string" });
        }

        const position = await prisma.position.findUnique({
            where: { id: positionId },
        });

        if (!position) {
            return res.status(404).json({ error: "Position not found" });
        }

        const authorId = req.user!.id;

        const post = await prisma.post.create({
            data: {
                content: content.trim(),
                positionId,
                authorId,
            },
            select: {
                id: true,
                content: true,
                createdAt: true,
                authorId: true,
                author: {
                    select: {
                        displayName: true,
                        role: true,
                    },
                },
            },
        });

        const formattedPost = {
            id: post.id,
            content: post.content,
            createdAt: post.createdAt,
            authorId: post.authorId,
            authorName: post.author.displayName,
            authorRole: post.author.role,
        };

        try {
            const io = getIo();
            io.to(`position:${positionId}`).emit("new_post", formattedPost);
        } catch (socketError) {
            // ignore socket emit error
        }

        res.status(201).json(formattedPost);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
