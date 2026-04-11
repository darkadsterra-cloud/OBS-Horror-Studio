import { Router } from "express";
import { db } from "@workspace/db";
import { presetsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreatePresetBody } from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router = Router();

type PresetRow = typeof presetsTable.$inferSelect;

function formatPreset(p: PresetRow) {
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    data: p.data,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/presets", async (req, res) => {
  const presets = await db.select().from(presetsTable).orderBy(presetsTable.createdAt);
  res.json(presets.map(formatPreset));
});

router.post("/presets", async (req, res) => {
  const body = CreatePresetBody.parse(req.body);
  const id = randomUUID();
  const [preset] = await db.insert(presetsTable).values({
    id,
    name: body.name,
    type: body.type,
    data: body.data,
  }).returning();
  res.status(201).json(formatPreset(preset));
});

router.delete("/presets/:id", async (req, res) => {
  await db.delete(presetsTable).where(eq(presetsTable.id, req.params.id));
  res.status(204).send();
});

export default router;
