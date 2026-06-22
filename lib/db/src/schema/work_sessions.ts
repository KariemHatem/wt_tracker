import { pgTable, serial, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const workSessionsTable = pgTable("work_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull().defaultNow(),
  endTime: timestamp("end_time", { withTimezone: true }),
  totalMinutes: integer("total_minutes"),
  date: date("date", { mode: "string" }).notNull(),
});

export const insertWorkSessionSchema = createInsertSchema(workSessionsTable).omit({ id: true });
export type InsertWorkSession = z.infer<typeof insertWorkSessionSchema>;
export type WorkSession = typeof workSessionsTable.$inferSelect;
