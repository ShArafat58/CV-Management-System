import { Router } from "express";
import prisma from "./db.js";
import { requireAuth } from "./middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
    try {
        const q = req.query.q as string;

        if (!q || q.trim() === "") {
            return res.json({
                positions: [],
                attributes: [],
                tags: []
            });
        }

        const trimmedQ = q.trim();

        const positionsResult = await prisma.$queryRaw`
            SELECT id, title, "shortDescription", "isPublic",
                   ts_rank(to_tsvector('english', coalesce(title,'') || ' ' || coalesce("shortDescription",'')), websearch_to_tsquery('english', ${trimmedQ})) AS rank
            FROM "Position"
            WHERE to_tsvector('english', coalesce(title,'') || ' ' || coalesce("shortDescription",'')) @@ websearch_to_tsquery('english', ${trimmedQ})
            ORDER BY rank DESC
            LIMIT 20;
        `;

        const positions = (positionsResult as any[]).map(p => ({
            id: p.id,
            title: p.title,
            shortDescription: p.shortDescription,
            isPublic: p.isPublic
        }));

        const attributesResult = await prisma.$queryRaw`
            SELECT id, name, category, "dataType"
            FROM "Attribute"
            WHERE to_tsvector('english', coalesce(name,'')) @@ websearch_to_tsquery('english', ${trimmedQ})
            LIMIT 20;
        `;

        const attributes = (attributesResult as any[]).map(a => ({
            id: a.id,
            name: a.name,
            category: a.category,
            dataType: a.dataType
        }));

        const [posTags, projTags] = await Promise.all([
            prisma.position.findMany({ select: { projectTags: true } }),
            prisma.project.findMany({ select: { tags: true } })
        ]);

        const allTags = new Set<string>();
        for (const p of posTags) {
            for (const t of p.projectTags) {
                allTags.add(t);
            }
        }
        for (const p of projTags) {
            for (const t of p.tags) {
                allTags.add(t);
            }
        }

        const qLower = trimmedQ.toLowerCase();
        const tags = Array.from(allTags)
            .filter(t => t.toLowerCase().includes(qLower))
            .slice(0, 20);

        res.json({
            positions,
            attributes,
            tags
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
