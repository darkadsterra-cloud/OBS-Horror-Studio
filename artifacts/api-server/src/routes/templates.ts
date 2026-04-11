import { Router } from "express";
import { db } from "@workspace/db";
import { templatesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateTemplateBody, ListTemplatesQueryParams, GetRandomTemplateQueryParams } from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router = Router();

router.get("/templates/random", async (req, res) => {
  const parsed = GetRandomTemplateQueryParams.safeParse(req.query);
  const category = parsed.success ? parsed.data.category : undefined;

  let base = db.select().from(templatesTable);
  const all = category
    ? await base.where(eq(templatesTable.category, category))
    : await base;

  if (!all.length) {
    res.status(404).json({ error: "No templates found" });
    return;
  }
  const random = all[Math.floor(Math.random() * all.length)];
  res.json(random);
});

router.get("/templates", async (req, res) => {
  const parsed = ListTemplatesQueryParams.safeParse(req.query);
  const category = parsed.success ? parsed.data.category : undefined;

  let base = db.select().from(templatesTable);
  const templates = category
    ? await base.where(eq(templatesTable.category, category))
    : await base;

  res.json(templates);
});

router.post("/templates", async (req, res) => {
  const body = CreateTemplateBody.parse(req.body);
  const id = randomUUID();
  const [template] = await db.insert(templatesTable).values({
    id,
    ...body,
    isPreset: false,
  }).returning();
  res.status(201).json(template);
});

router.get("/templates/:id", async (req, res) => {
  const [template] = await db.select().from(templatesTable).where(eq(templatesTable.id, req.params.id));
  if (!template) {
    res.status(404).json({ error: "Template not found" });
    return;
  }
  res.json(template);
});

router.delete("/templates/:id", async (req, res) => {
  await db.delete(templatesTable).where(eq(templatesTable.id, req.params.id));
  res.status(204).send();
});

export default router;
