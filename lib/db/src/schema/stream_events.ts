import { pgTable, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const streamEventsTable = pgTable("stream_events", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  username: text("username").notNull(),
  value: numeric("value"),
  message: text("message"),
  triggeredAt: timestamp("triggered_at").notNull().defaultNow(),
});

export const insertStreamEventSchema = createInsertSchema(streamEventsTable).omit({ triggeredAt: true });
export type InsertStreamEvent = z.infer<typeof insertStreamEventSchema>;
export type StreamEvent = typeof streamEventsTable.$inferSelect;
