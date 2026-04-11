import { pgTable, text, boolean, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const alertsTable = pgTable("alerts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  eventType: text("event_type").notNull(),
  threshold: numeric("threshold"),
  animation: text("animation").notNull(),
  soundEffect: text("sound_effect"),
  textTemplate: text("text_template").notNull(),
  font: text("font").notNull(),
  color: text("color").notNull(),
  duration: numeric("duration").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAlertSchema = createInsertSchema(alertsTable).omit({ createdAt: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alertsTable.$inferSelect;
