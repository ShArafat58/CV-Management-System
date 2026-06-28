import { Router } from "express";
import prisma from "./db.js";
import { requireAuth } from "./middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
    try {
        const [
            totalPositions,
            totalCandidates,
            totalRecruiters,
            totalCvs,
            cvsLast24h
        ] = await Promise.all([
            prisma.position.count(),
            prisma.user.count({ where: { role: "CANDIDATE" } }),
            prisma.user.count({ where: { role: "RECRUITER" } }),
            prisma.cv.count(),
            prisma.cv.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    }
                }
            })
        ]);

        const latestPositionsRaw = await prisma.position.findMany({
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
                id: true,
                title: true,
                shortDescription: true,
                isPublic: true,
                createdAt: true,
                _count: {
                    select: { cvs: true }
                }
            }
        });

        const latestPositions = latestPositionsRaw.map(p => ({
            id: p.id,
            title: p.title,
            shortDescription: p.shortDescription,
            isPublic: p.isPublic,
            createdAt: p.createdAt,
            cvCount: p._count.cvs
        }));

        const allPositionsForPopular = await prisma.position.findMany({
            select: {
                id: true,
                title: true,
                isPublic: true,
                _count: {
                    select: { cvs: true }
                }
            }
        });

        const popularPositions = allPositionsForPopular
            .sort((a, b) => b._count.cvs - a._count.cvs)
            .slice(0, 5)
            .map(p => ({
                id: p.id,
                title: p.title,
                isPublic: p.isPublic,
                cvCount: p._count.cvs
            }));

        const [positionTags, projectTags] = await Promise.all([
            prisma.position.findMany({ select: { projectTags: true } }),
            prisma.project.findMany({ select: { tags: true } })
        ]);

        const tagMap = new Map<string, number>();

        for (const p of positionTags) {
            for (const tag of p.projectTags) {
                tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
            }
        }

        for (const p of projectTags) {
            for (const tag of p.tags) {
                tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
            }
        }

        const tagCloud = Array.from(tagMap.entries())
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 30);

        res.json({
            stats: {
                totalPositions,
                totalCandidates,
                totalRecruiters,
                totalCvs,
                cvsLast24h
            },
            latestPositions,
            popularPositions,
            tagCloud
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
