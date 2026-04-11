import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const presetsTable = pgTable("presets", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPresetSchema = createInsertSchema(presetsTable).omit({ createdAt: true });
export type InsertPreset = z.infer<typeof insertPresetSchema>;
export type Preset = typeof presetsTable.$inferSelect;
