import { pgTable, serial, integer, timestamp, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const loginActivityTable = pgTable("login_activity", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  loginTime: timestamp("login_time", { withTimezone: true }).notNull().defaultNow(),
  logoutTime: timestamp("logout_time", { withTimezone: true }),
  ipAddress: text("ip_address"),
  browser: text("browser"),
  operatingSystem: text("operating_system"),
  device: text("device"),
});

export const insertLoginActivitySchema = createInsertSchema(loginActivityTable).omit({ id: true });
export type InsertLoginActivity = z.infer<typeof insertLoginActivitySchema>;
export type LoginActivity = typeof loginActivityTable.$inferSelect;
