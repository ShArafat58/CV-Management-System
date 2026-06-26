import { Router } from "express";
import prisma from "./db.js";
import { requireAuth } from "./middleware.js";

const router = Router();

function isNumeric(str: string): boolean {
  if (typeof str !== "string") return false;
  if (str.trim() === "") return false;
  return !isNaN(Number(str));
}

function candidateMeetsAccessRules(
  profileValues: Record<string, string>,
  accessRules: any
): boolean {
  if (!Array.isArray(accessRules) || accessRules.length === 0) {
    return true;
  }
  for (const rule of accessRules) {
    if (!rule || typeof rule !== "object") continue;
    const { attributeId, operator, value } = rule;
    if (typeof attributeId !== "string" || typeof operator !== "string") continue;

    if (!(attributeId in profileValues)) return false;

    const candidateValue = profileValues[attributeId];
    const ruleValueStr = String(value);

    switch (operator) {
      case ">":
      case ">=":
      case "<":
      case "<=": {
        const numCandidate = Number(candidateValue);
        const numRule = Number(ruleValueStr);
        if (isNaN(numCandidate) || isNaN(numRule)) return false;
        if (operator === ">" && !(numCandidate > numRule)) return false;
        if (operator === ">=" && !(numCandidate >= numRule)) return false;
        if (operator === "<" && !(numCandidate < numRule)) return false;
        if (operator === "<=" && !(numCandidate <= numRule)) return false;
        break;
      }
      case "=": {
        if (isNumeric(candidateValue) && isNumeric(ruleValueStr)) {
          if (Number(candidateValue) !== Number(ruleValueStr)) return false;
        } else {
          if (candidateValue.toLowerCase() !== ruleValueStr.toLowerCase()) return false;
        }
        break;
      }
      case "contains": {
        if (!candidateValue.toLowerCase().includes(ruleValueStr.toLowerCase())) return false;
        break;
      }
      default:
        return false;
    }
  }
  return true;
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const cvs = await prisma.cv.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        positionId: true,
        position: {
          select: { title: true },
        },
        createdAt: true,
        updatedAt: true,
        hidden: true,
        _count: { select: { likes: true } },
      },
    });

    res.json(
      cvs.map((cv) => ({
        id: cv.id,
        positionId: cv.positionId,
        positionTitle: cv.position.title,
        createdAt: cv.createdAt,
        updatedAt: cv.updatedAt,
        hidden: cv.hidden,
        likesCount: cv._count.likes,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch CVs" });
  }
});

router.get("/available-positions", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;

    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { values: true },
    });
    const profileValues: Record<string, string> = {};
    if (profile) {
      for (const val of profile.values) {
        profileValues[val.attributeId] = val.value;
      }
    }

    const existingCvs = await prisma.cv.findMany({
      where: { userId },
      select: { positionId: true },
    });
    const existingPositionIds = new Set(existingCvs.map((cv) => cv.positionId));

    const positions = await prisma.position.findMany({
      select: {
        id: true,
        title: true,
        shortDescription: true,
        isPublic: true,
        accessRules: true,
      },
    });

    const available = positions.filter((pos) => {
      if (existingPositionIds.has(pos.id)) return false;
      if (pos.isPublic) return true;
      return candidateMeetsAccessRules(profileValues, pos.accessRules);
    });

    res.json(
      available.map((p) => ({
        id: p.id,
        title: p.title,
        shortDescription: p.shortDescription,
        isPublic: p.isPublic,
      }))
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch available positions" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { positionId } = req.body;

    if (typeof positionId !== "string") {
      return res.status(400).json({ error: "positionId is required" });
    }

    const position = await prisma.position.findUnique({
      where: { id: positionId },
      include: { attributes: true },
    });

    if (!position) {
      return res.status(404).json({ error: "Position not found" });
    }

    let profile = await prisma.profile.findUnique({
      where: { userId },
      include: { values: true },
    });

    if (!profile) {
      profile = await prisma.profile.create({
        data: { userId },
        include: { values: true },
      });
    }

    const profileValues: Record<string, string> = {};
    for (const val of profile.values) {
      profileValues[val.attributeId] = val.value;
    }

    if (!position.isPublic && !candidateMeetsAccessRules(profileValues, position.accessRules)) {
      return res.status(403).json({ error: "not_eligible" });
    }

    const existingCv = await prisma.cv.findUnique({
      where: { userId_positionId: { userId, positionId } },
    });

    if (existingCv) {
      return res.status(409).json({ error: "cv_exists" });
    }

    const existingAttrIds = new Set(Object.keys(profileValues));
    const missingAttrs = position.attributes.filter((pa) => !existingAttrIds.has(pa.attributeId));

    if (missingAttrs.length > 0) {
      await prisma.attributeValue.createMany({
        data: missingAttrs.map((pa) => ({
          profileId: profile!.id,
          attributeId: pa.attributeId,
          value: "",
        })),
        skipDuplicates: true,
      });
    }

    const cv = await prisma.cv.create({
      data: {
        userId,
        positionId,
      },
    });

    res.json({ id: cv.id });
  } catch (error) {
    res.status(500).json({ error: "Failed to create CV" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const cvId = req.params.id as string;
    const cv = await prisma.cv.findUnique({
      where: { id: cvId },
      include: {
        position: {
          include: {
            attributes: {
              orderBy: { sortOrder: "asc" },
              include: { attribute: true },
            },
          },
        },
      },
    });

    if (!cv) {
      return res.status(404).json({ error: "CV not found" });
    }

    const isOwner = cv.userId === req.user!.id;
    const isAdmin = req.user!.role === "ADMIN";
    const isRecruiter = req.user!.role === "RECRUITER";

    if (!isOwner && !isAdmin && !isRecruiter) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const canEdit = isOwner || isAdmin;

    const profile = await prisma.profile.findUnique({
      where: { userId: cv.userId },
      include: {
        values: true,
        projects: {
          orderBy: { startDate: "desc" },
        },
      },
    });

    const profileValues: Record<string, string> = {};
    if (profile) {
      for (const val of profile.values) {
        profileValues[val.attributeId] = val.value;
      }
    }

    const attributes = cv.position.attributes.map((pa) => {
      const a = pa.attribute;
      return {
        attributeId: a.id,
        name: a.name,
        category: a.category,
        dataType: a.dataType,
        options: a.options,
        value: profileValues[a.id] || "",
      };
    });

    let projects = profile?.projects || [];
    if (cv.position.projectTags && cv.position.projectTags.length > 0) {
      projects = projects.filter((p) => {
        return p.tags.some((t) => cv.position.projectTags.includes(t));
      });
    }

    if (cv.position.maxProjects > 0) {
      projects = projects.slice(0, cv.position.maxProjects);
    } else {
      projects = [];
    }

    res.json({
      id: cv.id,
      positionId: cv.positionId,
      positionTitle: cv.position.title,
      positionShortDescription: cv.position.shortDescription,
      ownerId: cv.userId,
      canEdit,
      attributes,
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        startDate: p.startDate,
        endDate: p.endDate,
        description: p.description,
        tags: p.tags,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch CV" });
  }
});

router.put("/:id/value", requireAuth, async (req, res) => {
  try {
    const cvId = req.params.id as string;
    const { attributeId, value } = req.body;

    if (typeof attributeId !== "string" || typeof value !== "string") {
      return res.status(400).json({ error: "attributeId and value are required" });
    }

    const cv = await prisma.cv.findUnique({
      where: { id: cvId },
    });

    if (!cv) {
      return res.status(404).json({ error: "CV not found" });
    }

    const isOwner = cv.userId === req.user!.id;
    const isAdmin = req.user!.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: cv.userId },
    });

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    await prisma.attributeValue.upsert({
      where: {
        profileId_attributeId: {
          profileId: profile.id,
          attributeId,
        },
      },
      update: { value },
      create: {
        profileId: profile.id,
        attributeId,
        value,
      },
    });

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update value" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const cvId = req.params.id as string;
    const cv = await prisma.cv.findUnique({
      where: { id: cvId },
    });

    if (!cv) {
      return res.status(404).json({ error: "CV not found" });
    }

    const isOwner = cv.userId === req.user!.id;
    const isAdmin = req.user!.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.cv.delete({
      where: { id: cvId },
    });

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete CV" });
  }
});

export default router;
