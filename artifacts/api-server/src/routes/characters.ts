import { Router } from "express";
import { db } from "@workspace/db";
import { charactersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateCharacterBody } from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router = Router();

router.get("/characters", async (req, res) => {
  const characters = await db.select().from(charactersTable).orderBy(charactersTable.createdAt);
  res.json(characters.map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  })));
});

router.post("/characters", async (req, res) => {
  const body = CreateCharacterBody.parse(req.body);
  const id = randomUUID();
  const [character] = await db.insert(charactersTable).values({
    id,
    name: body.name,
    imageUrl: body.imageUrl,
    category: body.category,
    isPreset: false,
  }).returning();
  res.status(201).json({ ...character, createdAt: character.createdAt.toISOString() });
});

router.get("/characters/:id", async (req, res) => {
  const [character] = await db.select().from(charactersTable).where(eq(charactersTable.id, req.params.id));
  if (!character) {
    res.status(404).json({ error: "Character not found" });
    return;
  }
  res.json({ ...character, createdAt: character.createdAt.toISOString() });
});

router.delete("/characters/:id", async (req, res) => {
  await db.delete(charactersTable).where(eq(charactersTable.id, req.params.id));
  res.status(204).send();
});

export default router;
