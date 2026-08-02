import { Router } from "express";
import prisma from "./db.js";

const router = Router();

function extractToken(req: any): string {
    const header = req.headers.authorization;
    if (typeof header === "string" && header.startsWith("Bearer ")) {
        return header.slice(7).trim();
    }
    if (typeof req.query.token === "string") {
        return req.query.token;
    }
    return "";
}

function aggregateNumeric(values: string[]) {
    const numbers = values.map((v) => Number(v)).filter((n) => !isNaN(n));
    if (numbers.length === 0) return null;
    const sum = numbers.reduce((a, b) => a + b, 0);
    return {
        count: numbers.length,
        average: Number((sum / numbers.length).toFixed(2)),
        min: Math.min(...numbers),
        max: Math.max(...numbers),
    };
}

function aggregateText(values: string[]) {
    const counts = new Map<string, number>();
    for (const v of values) {
        const key = v.trim();
        if (key === "") continue;
        counts.set(key, (counts.get(key) || 0) + 1);
    }
    const sorted = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, count]) => ({ value, count }));
    return { count: values.filter((v) => v.trim() !== "").length, topValues: sorted };
}

router.get("/position", async (req, res) => {
    try {
        const token = extractToken(req);
        if (token === "") {
            return res.status(401).json({ error: "API token is required" });
        }

        const position = await prisma.position.findUnique({
            where: { apiToken: token },
            select: {
                id: true,
                title: true,
                shortDescription: true,
                createdAt: true,
                attributes: {
                    orderBy: { sortOrder: "asc" },
                    select: {
                        attribute: {
                            select: { id: true, name: true, dataType: true, category: true },
                        },
                    },
                },
            },
        });

        if (!position) {
            return res.status(403).json({ error: "Invalid API token" });
        }

        const cvs = await prisma.cv.findMany({
            where: { positionId: position.id, published: true },
            select: { userId: true },
        });

        const userIds = cvs.map((c) => c.userId);

        const profiles = await prisma.profile.findMany({
            where: { userId: { in: userIds } },
            select: {
                values: {
                    select: { attributeId: true, value: true },
                },
            },
        });

        const valuesByAttribute = new Map<string, string[]>();
        for (const profile of profiles) {
            for (const v of profile.values) {
                if (!valuesByAttribute.has(v.attributeId)) {
                    valuesByAttribute.set(v.attributeId, []);
                }
                valuesByAttribute.get(v.attributeId)!.push(v.value);
            }
        }

        const attributes = position.attributes.map((pa) => {
            const a = pa.attribute;
            const values = valuesByAttribute.get(a.id) || [];
            const isNumeric = a.dataType === "NUMERIC";
            return {
                name: a.name,
                dataType: a.dataType,
                category: a.category,
                aggregate: isNumeric ? aggregateNumeric(values) : aggregateText(values),
            };
        });

        res.json({
            position: {
                title: position.title,
                shortDescription: position.shortDescription,
                createdAt: position.createdAt,
            },
            cvCount: cvs.length,
            attributes,
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch aggregated data" });
    }
});

export default router;