import { Router } from "express";
import prisma from "./db.js";
import { requireAuth, requireRole } from "./middleware.js";

const router = Router();

function parseAccessRules(raw: unknown): { attributeId: string; operator: string; value: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (r) =>
        r &&
        typeof r === "object" &&
        typeof r.attributeId === "string" &&
        typeof r.operator === "string" &&
        typeof r.value === "string"
    )
    .map((r) => ({
      attributeId: String(r.attributeId),
      operator: String(r.operator),
      value: String(r.value),
    }));
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const where: any = {};
    const search = req.query.search;
    if (typeof search === "string" && search.trim() !== "") {
      where.title = { contains: search.trim(), mode: "insensitive" };
    }

    const positions = await prisma.position.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        shortDescription: true,
        isPublic: true,
        maxProjects: true,
        projectTags: true,
        version: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { cvs: true } },
      },
    });

    res.json(positions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch positions" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params.id as string;
    const position = await prisma.position.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        shortDescription: true,
        isPublic: true,
        accessRules: true,
        maxProjects: true,
        projectTags: true,
        version: true,
        createdAt: true,
        updatedAt: true,
        attributes: {
          orderBy: { sortOrder: "asc" },
          select: {
            sortOrder: true,
            attribute: {
              select: {
                id: true,
                name: true,
                category: true,
                dataType: true,
                options: true,
              },
            },
          },
        },
      },
    });

    if (!position) {
      return res.status(404).json({ error: "Position not found" });
    }

    res.json(position);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch position" });
  }
});

router.post("/", requireAuth, requireRole("RECRUITER", "ADMIN"), async (req, res) => {
  try {
    const { title, shortDescription, isPublic, accessRules, maxProjects, projectTags, attributeIds } = req.body;

    if (typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({ error: "Title is required and must be non-empty" });
    }

    const parsedRules = parseAccessRules(accessRules);

    const result = await prisma.$transaction(async (tx) => {
      const position = await tx.position.create({
        data: {
          title: title.trim(),
          shortDescription: typeof shortDescription === "string" ? shortDescription : "",
          isPublic: typeof isPublic === "boolean" ? isPublic : true,
          accessRules: parsedRules,
          maxProjects: typeof maxProjects === "number" ? maxProjects : 3,
          projectTags: Array.isArray(projectTags) ? projectTags.map(String) : [],
        },
      });

      if (Array.isArray(attributeIds) && attributeIds.length > 0) {
        await tx.positionAttribute.createMany({
          data: attributeIds.map((attrId: string, index: number) => ({
            positionId: position.id,
            attributeId: attrId,
            sortOrder: index,
          })),
        });
      }

      return position;
    });

    res.json({ id: result.id });
  } catch (error) {
    res.status(500).json({ error: "Failed to create position" });
  }
});

router.post("/:id/duplicate", requireAuth, requireRole("RECRUITER", "ADMIN"), async (req, res) => {
  try {
    const id = req.params.id as string;
    const source = await prisma.position.findUnique({
      where: { id },
      include: {
        attributes: {
          orderBy: { sortOrder: "asc" },
          select: { attributeId: true, sortOrder: true },
        },
      },
    });

    if (!source) {
      return res.status(404).json({ error: "Position not found" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const newPosition = await tx.position.create({
        data: {
          title: `Copy of ${source.title}`,
          shortDescription: source.shortDescription,
          isPublic: source.isPublic,
          accessRules: source.accessRules ?? [],
          maxProjects: source.maxProjects,
          projectTags: source.projectTags,
        },
      });

      if (source.attributes.length > 0) {
        await tx.positionAttribute.createMany({
          data: source.attributes.map((a) => ({
            positionId: newPosition.id,
            attributeId: a.attributeId,
            sortOrder: a.sortOrder,
          })),
        });
      }

      return newPosition;
    });

    res.json({ id: result.id });
  } catch (error) {
    res.status(500).json({ error: "Failed to duplicate position" });
  }
});

router.put("/:id", requireAuth, requireRole("RECRUITER", "ADMIN"), async (req, res) => {
  try {
    const id = req.params.id as string;
    const { version, title, shortDescription, isPublic, accessRules, maxProjects, projectTags, attributeIds } =
      req.body;

    if (typeof version !== "number") {
      return res.status(400).json({ error: "Version must be a number" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const position = await tx.position.findUnique({
        where: { id },
      });

      if (!position) {
        throw new Error("NOT_FOUND");
      }

      if (position.version !== version) {
        throw new Error("VERSION_CONFLICT");
      }

      const updateData: any = { version: { increment: 1 } };

      if (typeof title === "string" && title.trim() !== "") {
        updateData.title = title.trim();
      }
      if (typeof shortDescription === "string") {
        updateData.shortDescription = shortDescription;
      }
      if (typeof isPublic === "boolean") {
        updateData.isPublic = isPublic;
      }
      if (accessRules !== undefined) {
        updateData.accessRules = parseAccessRules(accessRules);
      }
      if (typeof maxProjects === "number") {
        updateData.maxProjects = maxProjects;
      }
      if (Array.isArray(projectTags)) {
        updateData.projectTags = projectTags.map(String);
      }

      const updated = await tx.position.update({
        where: { id },
        data: updateData,
      });

      if (Array.isArray(attributeIds)) {
        await tx.positionAttribute.deleteMany({
          where: { positionId: id },
        });

        if (attributeIds.length > 0) {
          await tx.positionAttribute.createMany({
            data: attributeIds.map((attrId: string, index: number) => ({
              positionId: id,
              attributeId: attrId,
              sortOrder: index,
            })),
          });
        }
      }

      return updated.version;
    });

    res.json({ ok: true, version: result });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return res.status(404).json({ error: "Position not found" });
    }
    if (error.message === "VERSION_CONFLICT") {
      try {
        const id = req.params.id as string;
        const current = await prisma.position.findUnique({
          where: { id },
          select: { version: true },
        });
        return res.status(409).json({ error: "version_conflict", currentVersion: current?.version });
      } catch (e) {
        return res.status(409).json({ error: "version_conflict" });
      }
    }
    res.status(500).json({ error: "Failed to update position" });
  }
});

router.delete("/:id", requireAuth, requireRole("RECRUITER", "ADMIN"), async (req, res) => {
  try {
    const id = req.params.id as string;
    const position = await prisma.position.findUnique({
      where: { id },
    });

    if (!position) {
      return res.status(404).json({ error: "Position not found" });
    }

    await prisma.position.delete({
      where: { id },
    });

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete position" });
  }
});

export default router;