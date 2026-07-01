import { Router } from "express";
import prisma from "./db.js";
import { requireAuth, requireRole } from "./middleware.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("ADMIN"));

router.get("/", async (req, res) => {
    try {
        const { search } = req.query;
        let where = {};
        
        if (typeof search === "string" && search.trim() !== "") {
            where = {
                OR: [
                    { displayName: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                ]
            };
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                displayName: true,
                role: true,
                blocked: true,
                provider: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            }
        });

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.patch("/:id/role", async (req, res) => {
    try {
        const id = req.params.id as string;
        const { role } = req.body;

        if (role !== "CANDIDATE" && role !== "RECRUITER" && role !== "ADMIN") {
            return res.status(400).json({ error: "Invalid role" });
        }

        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                email: true,
                displayName: true,
                role: true,
                blocked: true,
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.patch("/:id/block", async (req, res) => {
    try {
        const id = req.params.id as string;
        const { blocked } = req.body;

        if (typeof blocked !== "boolean") {
            return res.status(400).json({ error: "Invalid blocked status" });
        }

        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            return res.status(404).json({ error: "User not found" });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { blocked },
            select: {
                id: true,
                email: true,
                displayName: true,
                role: true,
                blocked: true,
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
