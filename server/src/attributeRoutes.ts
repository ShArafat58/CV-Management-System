import { Router } from "express";
import prisma from "./db.js";
import { requireAuth, requireRole } from "./middleware.js";

const router = Router();

const validCategories = ["CERTIFICATION", "DOMAIN_KNOWLEDGE", "PERSONAL_INFORMATION", "SOFT_SKILLS"];
const validDataTypes = ["STRING", "TEXT", "IMAGE", "NUMERIC", "DATE", "PERIOD", "BOOLEAN", "ONE_OF_MANY"];

function validateAttributeBody(body: any) {
  let name = body.name;
  if (typeof name !== "string" || name.trim() === "") {
    return { error: "Name is required and must be a non-empty string" };
  }
  name = name.trim();

  const category = body.category;
  if (!validCategories.includes(category)) {
    return { error: "Invalid category" };
  }

  const dataType = body.dataType;
  if (!validDataTypes.includes(dataType)) {
    return { error: "Invalid dataType" };
  }

  let options = body.options;
  if (dataType === "ONE_OF_MANY") {
    if (!Array.isArray(options) || options.length === 0 || !options.every((o: any) => typeof o === "string" && o.trim() !== "")) {
      return { error: "Options must be a non-empty array of non-empty strings when dataType is ONE_OF_MANY" };
    }
    options = options.map((o: string) => o.trim());
  } else {
    options = [];
  }

  return { data: { name, category, dataType, options } };
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const { search, category } = req.query;

    const where: any = {};
    if (typeof search === "string" && search.trim() !== "") {
      where.name = { startsWith: search.trim(), mode: "insensitive" };
    }
    if (typeof category === "string" && validCategories.includes(category)) {
      where.category = category;
    }

    const attributes = await prisma.attribute.findMany({
      where,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        category: true,
        dataType: true,
        options: true,
        createdAt: true,
      }
    });
    res.json(attributes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch attributes" });
  }
});

router.get("/recent", requireAuth, async (req, res) => {
  try {
    const attributes = await prisma.attribute.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        category: true,
        dataType: true,
        options: true,
        createdAt: true,
      }
    });
    res.json(attributes);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recent attributes" });
  }
});

router.post("/", requireAuth, requireRole("RECRUITER", "ADMIN"), async (req, res) => {
  try {
    const validation = validateAttributeBody(req.body);
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }

    const attribute = await prisma.attribute.create({
      data: validation.data!
    });
    res.json(attribute);
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Attribute with this name already exists" });
    }
    res.status(500).json({ error: "Failed to create attribute" });
  }
});

router.put("/:id", requireAuth, requireRole("RECRUITER", "ADMIN"), async (req, res) => {
  try {
    const id = req.params.id as string;
    const validation = validateAttributeBody(req.body);
    if (validation.error) {
      return res.status(400).json({ error: validation.error });
    }

    const attribute = await prisma.attribute.update({
      where: { id },
      data: validation.data!
    });
    res.json(attribute);
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Attribute not found" });
    }
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Attribute with this name already exists" });
    }
    res.status(500).json({ error: "Failed to update attribute" });
  }
});

router.delete("/:id", requireAuth, requireRole("RECRUITER", "ADMIN"), async (req, res) => {
  try {
    const id = req.params.id as string;
    
    const attribute = await prisma.attribute.findUnique({ where: { id } });
    if (!attribute) {
      return res.status(404).json({ error: "Attribute not found" });
    }
    if (attribute.isBuiltIn) {
      return res.status(403).json({ error: "Built-in attributes cannot be deleted" });
    }

    await prisma.attribute.delete({
      where: { id }
    });
    res.json({ ok: true });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Attribute not found" });
    }
    res.status(500).json({ error: "Failed to delete attribute" });
  }
});

export default router;
