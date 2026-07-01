import { Router } from "express";
import prisma from "./db.js";
import { requireAuth } from "./middleware.js";

const router = Router();

function getTargetUserId(req: any) {
  const user = req.user as any;
  if (user && user.role === "ADMIN" && req.query.userId && typeof req.query.userId === "string") {
    return req.query.userId;
  }
  return user.id;
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = getTargetUserId(req);

    let profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        values: {
          include: {
            attribute: {
              select: {
                id: true,
                name: true,
                category: true,
                dataType: true,
                options: true,
                isBuiltIn: true
              }
            }
          }
        },
        projects: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!profile) {
      profile = await prisma.profile.create({
        data: { userId },
        include: {
          values: {
            include: {
              attribute: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  dataType: true,
                  options: true,
                  isBuiltIn: true
                }
              }
            }
          },
          projects: {
            orderBy: { createdAt: "asc" }
          }
        }
      });
    }

    const builtInAttributes = await prisma.attribute.findMany({
      where: { isBuiltIn: true }
    });

    res.json({
      profile: {
        id: profile.id,
        version: profile.version,
        updatedAt: profile.updatedAt,
        values: profile.values,
        projects: profile.projects
      },
      builtInAttributes
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.put("/values", requireAuth, async (req, res) => {
  try {
    const userId = getTargetUserId(req);
    const { version, values } = req.body;

    if (typeof version !== "number") {
      return res.status(400).json({ error: "Version must be a number" });
    }
    if (!Array.isArray(values)) {
      return res.status(400).json({ error: "Values must be an array" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const profile = await tx.profile.findUnique({
        where: { userId }
      });
      if (!profile) {
        throw new Error("PROFILE_NOT_FOUND");
      }
      if (profile.version !== version) {
        throw new Error("VERSION_CONFLICT");
      }

      for (const val of values) {
        if (!val.attributeId || typeof val.value !== "string") continue;
        await tx.attributeValue.upsert({
          where: {
            profileId_attributeId: {
              profileId: profile.id,
              attributeId: val.attributeId
            }
          },
          update: {
            value: val.value
          },
          create: {
            profileId: profile.id,
            attributeId: val.attributeId,
            value: val.value
          }
        });
      }

      const updatedProfile = await tx.profile.update({
        where: { id: profile.id },
        data: { version: { increment: 1 } }
      });

      return updatedProfile.version;
    });

    res.json({ ok: true, version: result });
  } catch (error: any) {
    if (error.message === "PROFILE_NOT_FOUND") {
      return res.status(404).json({ error: "Profile not found" });
    }
    if (error.message === "VERSION_CONFLICT") {
      try {
        const userId = getTargetUserId(req);
        const currentProfile = await prisma.profile.findUnique({ where: { userId } });
        return res.status(409).json({ error: "version_conflict", currentVersion: currentProfile?.version });
      } catch (e) {
        return res.status(409).json({ error: "version_conflict" });
      }
    }
    res.status(500).json({ error: "Failed to update values" });
  }
});

router.post("/projects", requireAuth, async (req, res) => {
  try {
    const userId = getTargetUserId(req);
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const { name, startDate, endDate, description, tags } = req.body;
    if (typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "Name is required and must be non-empty" });
    }

    const project = await prisma.project.create({
      data: {
        profileId: profile.id,
        name: name.trim(),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        description: typeof description === "string" ? description : "",
        tags: Array.isArray(tags) ? tags.map(String) : []
      }
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: "Failed to create project" });
  }
});

router.put("/projects/:id", requireAuth, async (req, res) => {
  try {
    const projectId = req.params.id as string;
    const userId = getTargetUserId(req);
    const profile = await prisma.profile.findUnique({ where: { userId } });

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const existingProject = await prisma.project.findUnique({ where: { id: projectId } });
    if (!existingProject || existingProject.profileId !== profile.id) {
      return res.status(404).json({ error: "Project not found" });
    }

    const { name, startDate, endDate, description, tags } = req.body;
    if (typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ error: "Name is required and must be non-empty" });
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: name.trim(),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        description: typeof description === "string" ? description : "",
        tags: Array.isArray(tags) ? tags.map(String) : []
      }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update project" });
  }
});

router.delete("/projects/:id", requireAuth, async (req, res) => {
  try {
    const projectId = req.params.id as string;
    const userId = getTargetUserId(req);
    const profile = await prisma.profile.findUnique({ where: { userId } });

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const existingProject = await prisma.project.findUnique({ where: { id: projectId } });
    if (!existingProject || existingProject.profileId !== profile.id) {
      return res.status(404).json({ error: "Project not found" });
    }

    await prisma.project.delete({ where: { id: projectId } });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete project" });
  }
});

router.get("/project-tags", requireAuth, async (req, res) => {
  try {
    const userId = getTargetUserId(req);
    const profile = await prisma.profile.findUnique({ where: { userId } });

    if (!profile) {
      return res.json([]);
    }

    const projects = await prisma.project.findMany({
      where: { profileId: profile.id },
      select: { tags: true }
    });

    const tagsSet = new Set<string>();
    for (const p of projects) {
      for (const tag of p.tags) {
        tagsSet.add(tag);
      }
    }

    const uniqueTags = Array.from(tagsSet).sort();
    res.json(uniqueTags);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch project tags" });
  }
});

export default router;
