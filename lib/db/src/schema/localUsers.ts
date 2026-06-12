import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const localUsersTable = pgTable("local_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  role: text("role").notNull().default("user"),
  pterodactylUserId: integer("pterodactyl_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLocalUserSchema = createInsertSchema(localUsersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLocalUser = z.infer<typeof insertLocalUserSchema>;
export type LocalUser = typeof localUsersTable.$inferSelect;
