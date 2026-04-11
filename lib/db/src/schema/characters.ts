import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const charactersTable = pgTable("characters", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(),
  isPreset: boolean("is_preset").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCharacterSchema = createInsertSchema(charactersTable).omit({ createdAt: true });
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Character = typeof charactersTable.$inferSelect;
