import { pgTable, text, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const templatesTable = pgTable("templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  font: text("font").notNull(),
  animation: text("animation").notNull(),
  colors: jsonb("colors").notNull().$type<string[]>(),
  glow: boolean("glow").notNull().default(false),
  shadowEffect: boolean("shadow_effect").notNull().default(false),
  backgroundStyle: text("background_style").notNull(),
  motionBehavior: text("motion_behavior").notNull(),
  isPreset: boolean("is_preset").notNull().default(false),
});

export const insertTemplateSchema = createInsertSchema(templatesTable);
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templatesTable.$inferSelect;
