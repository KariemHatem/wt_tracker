import { Router } from "express";
import { db, workSessionsTable, usersTable } from "@workspace/db";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { requireAuth, parseWorkingDays, type AuthRequest } from "../lib/auth";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, eachDayOfInterval, getWeek } from "date-fns";

const router = Router();

function dateStr(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function dayName(d: Date): string {
  return format(d, "EEEE");
}

async function getSessionsForUser(userId: number, from: string, to: string) {
  return db
    .select()
    .from(workSessionsTable)
    .where(and(eq(workSessionsTable.userId, userId), gte(workSessionsTable.date, from), lte(workSessionsTable.date, to)));
}

// Daily report
router.get("/reports/daily", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const isAdmin = req.user!.isAdmin;
  const date = (req.query.date as string) || dateStr(new Date());
  const userIdParam = req.query.userId ? Number(req.query.userId) : undefined;

  let users;
  if (isAdmin && !userIdParam) {
    users = await db.select().from(usersTable).where(eq(usersTable.isActive, true));
  } else {
    const targetId = isAdmin && userIdParam ? userIdParam : req.user!.id;
    users = await db.select().from(usersTable).where(eq(usersTable.id, targetId));
  }

  const rows = [];
  for (const user of users) {
    const sessions = await getSessionsForUser(user.id, date, date);
    let workedMinutes = 0;
    let startTime: Date | null = null;
    let endTime: Date | null = null;
    for (const s of sessions) {
      if (s.totalMinutes) workedMinutes += s.totalMinutes;
      if (!startTime || s.startTime < startTime) startTime = s.startTime;
      if (s.endTime && (!endTime || s.endTime > endTime)) endTime = s.endTime;
    }
    const targetMinutes = Math.round(user.targetHoursPerDay * 60);
    rows.push({
      userId: user.id,
      userFullName: user.fullName,
      date,
      startTime: startTime?.toISOString() ?? null,
      endTime: endTime?.toISOString() ?? null,
      workedMinutes,
      targetMinutes,
      completionPercent: targetMinutes > 0 ? Math.min(100, (workedMinutes / targetMinutes) * 100) : 0,
    });
  }
  res.json(rows);
});

// Weekly report
router.get("/reports/weekly", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const weekParam = req.query.week ? new Date(req.query.week as string) : new Date();
  const weekStart = startOfWeek(weekParam, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(weekParam, { weekStartsOn: 0 });
  const from = dateStr(weekStart);
  const to = dateStr(weekEnd);

  const targetId = req.user!.isAdmin && req.query.userId ? Number(req.query.userId) : req.user!.id;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, targetId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const sessions = await getSessionsForUser(targetId, from, to);
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const workingDays = parseWorkingDays(user.workingDays);

  const dailyBreakdown = days.map(day => {
    const dStr = dateStr(day);
    const dow = day.getDay();
    const isWorkDay = workingDays.includes(dow);
    const daySessions = sessions.filter(s => s.date === dStr);
    const workedMinutes = daySessions.reduce((sum, s) => sum + (s.totalMinutes ?? 0), 0);
    const targetMinutes = isWorkDay ? Math.round(user.targetHoursPerDay * 60) : 0;
    return { date: dStr, dayName: dayName(day), workedMinutes, targetMinutes };
  });

  const totalWorkedMinutes = dailyBreakdown.reduce((s, d) => s + d.workedMinutes, 0);
  const totalTargetMinutes = dailyBreakdown.reduce((s, d) => s + d.targetMinutes, 0);

  res.json({
    weekStart: from,
    weekEnd: to,
    totalWorkedMinutes,
    totalTargetMinutes,
    missingMinutes: Math.max(0, totalTargetMinutes - totalWorkedMinutes),
    overtimeMinutes: Math.max(0, totalWorkedMinutes - totalTargetMinutes),
    dailyBreakdown,
  });
});

// Monthly report
router.get("/reports/monthly", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
  const month = req.query.month ? Number(req.query.month) : new Date().getMonth() + 1;
  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(monthStart);
  const from = dateStr(monthStart);
  const to = dateStr(monthEnd);

  const targetId = req.user!.isAdmin && req.query.userId ? Number(req.query.userId) : req.user!.id;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, targetId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const sessions = await getSessionsForUser(targetId, from, to);
  const workingDays = parseWorkingDays(user.workingDays);

  // Group by week
  const weekMap = new Map<number, { worked: number; target: number }>();
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  for (const day of days) {
    const weekNum = getWeek(day, { weekStartsOn: 0 });
    if (!weekMap.has(weekNum)) weekMap.set(weekNum, { worked: 0, target: 0 });
    const entry = weekMap.get(weekNum)!;
    const dStr = dateStr(day);
    const daySessions = sessions.filter(s => s.date === dStr);
    entry.worked += daySessions.reduce((sum, s) => sum + (s.totalMinutes ?? 0), 0);
    if (workingDays.includes(day.getDay())) {
      entry.target += Math.round(user.targetHoursPerDay * 60);
    }
  }

  const weeklyBreakdown = Array.from(weekMap.entries()).map(([wk, { worked, target }]) => ({
    weekNumber: wk,
    workedMinutes: worked,
    targetMinutes: target,
  }));

  const totalWorkedMinutes = weeklyBreakdown.reduce((s, w) => s + w.workedMinutes, 0);
  const totalTargetMinutes = weeklyBreakdown.reduce((s, w) => s + w.targetMinutes, 0);

  res.json({
    year,
    month,
    totalWorkedMinutes,
    totalTargetMinutes,
    overtimeMinutes: Math.max(0, totalWorkedMinutes - totalTargetMinutes),
    productivityPercent: totalTargetMinutes > 0 ? Math.min(100, (totalWorkedMinutes / totalTargetMinutes) * 100) : 0,
    weeklyBreakdown,
  });
});

export default router;
