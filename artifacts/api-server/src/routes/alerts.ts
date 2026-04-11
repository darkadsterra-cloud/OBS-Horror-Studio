import { Router } from "express";
import { db } from "@workspace/db";
import { alertsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateAlertBody, UpdateAlertBody, TriggerAlertBody } from "@workspace/api-zod";
import { randomUUID } from "crypto";

const router = Router();

type AlertRow = typeof alertsTable.$inferSelect;

function formatAlert(a: AlertRow) {
  return {
    id: a.id,
    name: a.name,
    eventType: a.eventType,
    threshold: a.threshold ? Number(a.threshold) : undefined,
    animation: a.animation,
    soundEffect: a.soundEffect ?? undefined,
    textTemplate: a.textTemplate,
    font: a.font,
    color: a.color,
    duration: Number(a.duration),
    isActive: a.isActive,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/alerts", async (req, res) => {
  const alerts = await db.select().from(alertsTable).orderBy(alertsTable.createdAt);
  res.json(alerts.map(formatAlert));
});

router.post("/alerts", async (req, res) => {
  const body = CreateAlertBody.parse(req.body);
  const id = randomUUID();
  const [alert] = await db.insert(alertsTable).values({
    id,
    name: body.name,
    eventType: body.eventType,
    threshold: body.threshold != null ? String(body.threshold) : null,
    animation: body.animation,
    soundEffect: body.soundEffect ?? null,
    textTemplate: body.textTemplate,
    font: body.font,
    color: body.color,
    duration: String(body.duration),
    isActive: body.isActive,
  }).returning();
  res.status(201).json(formatAlert(alert));
});

router.get("/alerts/trigger", async (req, res) => {
  res.json({ message: "Use POST to trigger an alert" });
});

router.get("/alerts/:id", async (req, res) => {
  const [alert] = await db.select().from(alertsTable).where(eq(alertsTable.id, req.params.id));
  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  res.json(formatAlert(alert));
});

router.put("/alerts/:id", async (req, res) => {
  const body = UpdateAlertBody.parse(req.body);
  const [alert] = await db.update(alertsTable)
    .set({
      name: body.name,
      eventType: body.eventType,
      threshold: body.threshold != null ? String(body.threshold) : null,
      animation: body.animation,
      soundEffect: body.soundEffect ?? null,
      textTemplate: body.textTemplate,
      font: body.font,
      color: body.color,
      duration: String(body.duration),
      isActive: body.isActive,
    })
    .where(eq(alertsTable.id, req.params.id))
    .returning();
  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  res.json(formatAlert(alert));
});

router.delete("/alerts/:id", async (req, res) => {
  await db.delete(alertsTable).where(eq(alertsTable.id, req.params.id));
  res.status(204).send();
});

export { router as alertRouter };

export default router;
