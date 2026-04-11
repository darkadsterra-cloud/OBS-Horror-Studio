import { Router } from "express";
import { db } from "@workspace/db";
import { streamEventsTable, alertsTable, templatesTable, charactersTable, presetsTable } from "@workspace/db";
import { TriggerAlertBody } from "@workspace/api-zod";
import { desc, count, eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

type StreamEventRow = typeof streamEventsTable.$inferSelect;

function formatEvent(e: StreamEventRow) {
  return {
    id: e.id,
    eventType: e.eventType,
    username: e.username,
    value: e.value ? Number(e.value) : undefined,
    message: e.message ?? undefined,
    triggeredAt: e.triggeredAt.toISOString(),
  };
}

router.get("/stream/stats", async (req, res) => {
  const [alertCount] = await db.select({ count: count() }).from(alertsTable);
  const [templateCount] = await db.select({ count: count() }).from(templatesTable);
  const [characterCount] = await db.select({ count: count() }).from(charactersTable);
  const [presetCount] = await db.select({ count: count() }).from(presetsTable);
  const [eventCount] = await db.select({ count: count() }).from(streamEventsTable);
  const activeAlerts = await db.select({ count: count() }).from(alertsTable).where(eq(alertsTable.isActive, true));

  res.json({
    totalAlerts: Number(alertCount.count),
    totalTemplates: Number(templateCount.count),
    totalCharacters: Number(characterCount.count),
    totalPresets: Number(presetCount.count),
    activeAlerts: Number(activeAlerts[0].count),
    recentEventCount: Number(eventCount.count),
  });
});

router.get("/stream/recent-events", async (req, res) => {
  const events = await db.select().from(streamEventsTable)
    .orderBy(desc(streamEventsTable.triggeredAt))
    .limit(20);
  res.json(events.map(formatEvent));
});

router.post("/alerts/trigger", async (req, res) => {
  const body = TriggerAlertBody.parse(req.body);
  
  const id = randomUUID();
  const [event] = await db.insert(streamEventsTable).values({
    id,
    eventType: body.eventType,
    username: body.username,
    value: body.value != null ? String(body.value) : null,
    message: body.message ?? null,
  }).returning();

  const alerts = await db.select().from(alertsTable).where(eq(alertsTable.isActive, true));
  const matching = alerts.find(a => a.eventType === body.eventType);
  
  if (matching) {
    broadcastAlertEvent({
      eventType: body.eventType,
      username: body.username,
      value: body.value,
      message: body.message,
      alertConfig: {
        animation: matching.animation,
        textTemplate: matching.textTemplate,
        font: matching.font,
        color: matching.color,
        duration: Number(matching.duration),
      },
    });
  }

  const responseAlert = matching ? {
    id: matching.id,
    name: matching.name,
    eventType: matching.eventType,
    threshold: matching.threshold ? Number(matching.threshold) : undefined,
    animation: matching.animation,
    soundEffect: matching.soundEffect ?? undefined,
    textTemplate: matching.textTemplate,
    font: matching.font,
    color: matching.color,
    duration: Number(matching.duration),
    isActive: matching.isActive,
    createdAt: matching.createdAt.toISOString(),
  } : null;

  res.json(responseAlert ?? { id: id, eventType: body.eventType, message: "Event recorded, no matching alert" });
});

const wsClients = new Set<import("ws").WebSocket>();

export function registerWsClient(ws: import("ws").WebSocket) {
  wsClients.add(ws);
  ws.on("close", () => wsClients.delete(ws));
}

export function broadcastAlertEvent(data: unknown) {
  const msg = JSON.stringify({ type: "alert_event", data });
  wsClients.forEach(client => {
    try {
      client.send(msg);
    } catch {
      wsClients.delete(client);
    }
  });
}

export default router;
