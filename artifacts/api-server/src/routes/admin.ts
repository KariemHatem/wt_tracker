import { Router } from "express";
import { db, workSessionsTable, usersTable, loginActivityTable } from "@workspace/db";
import { eq, and, gte, lte, isNull, desc, count } from "drizzle-orm";
import { requireAdmin, parseWorkingDays, type AuthRequest } from "../lib/auth";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, eachDayOfInterval, getWeek } from "date-fns";

const router = Router();

function dateStr(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function dayName(d: Date): string {
  return format(d, "EEEE");
}

// Admin stats
router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const today = dateStr(new Date());
  const weekStart = dateStr(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const weekEnd = dateStr(endOfWeek(new Date(), { weekStartsOn: 0 }));
  const monthStart = dateStr(startOfMonth(new Date()));
  const monthEnd = dateStr(endOfMonth(new Date()));

  const users = await db.select().from(usersTable).where(eq(usersTable.isActive, true));
  const totalUsers = users.length;

  // Active today = users with a session today
  const todaySessions = await db
    .select()
    .from(workSessionsTable)
    .where(eq(workSessionsTable.date, today));
  const activeUsersToday = new Set(todaySessions.map(s => s.userId)).size;

  // Total hours this week
  const weekSessions = await db
    .select()
    .from(workSessionsTable)
    .where(and(gte(workSessionsTable.date, weekStart), lte(workSessionsTable.date, weekEnd)));
  const totalHoursThisWeek = weekSessions.reduce((s, ws) => s + (ws.totalMinutes ?? 0), 0) / 60;

  // Total hours this month
  const monthSessions = await db
    .select()
    .from(workSessionsTable)
    .where(and(gte(workSessionsTable.date, monthStart), lte(workSessionsTable.date, monthEnd)));
  const totalHoursThisMonth = monthSessions.reduce((s, ws) => s + (ws.totalMinutes ?? 0), 0) / 60;

  // Total logins
  const [{ count: loginCount }] = await db.select({ count: count() }).from(loginActivityTable);

  // Avg daily productivity (avg completion% across all users today)
  const userMap = new Map(users.map(u => [u.id, u]));
  let productivitySum = 0;
  let productivityCount = 0;
  for (const userId of new Set(todaySessions.map(s => s.userId))) {
    const user = userMap.get(userId);
    if (!user) continue;
    const userTodaySessions = todaySessions.filter(s => s.userId === userId);
    const worked = userTodaySessions.reduce((sum, s) => sum + (s.totalMinutes ?? 0), 0);
    const target = Math.round(user.targetHoursPerDay * 60);
    productivitySum += target > 0 ? Math.min(100, (worked / target) * 100) : 0;
    productivityCount++;
  }

  res.json({
    totalUsers,
    activeUsersToday,
    totalHoursThisWeek: Math.round(totalHoursThisWeek * 10) / 10,
    totalHoursThisMonth: Math.round(totalHoursThisMonth * 10) / 10,
    totalLogins: Number(loginCount),
    avgDailyProductivity: productivityCount > 0 ? Math.round(productivitySum / productivityCount) : 0,
  });
});

// User monitoring
router.get("/admin/users/monitoring", requireAdmin, async (_req, res): Promise<void> => {
  const today = dateStr(new Date());
  const weekStart = dateStr(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const weekEnd = dateStr(endOfWeek(new Date(), { weekStartsOn: 0 }));

  const users = await db.select().from(usersTable).orderBy(usersTable.fullName);

  const todaySessions = await db
    .select()
    .from(workSessionsTable)
    .where(eq(workSessionsTable.date, today));

  const weekSessions = await db
    .select()
    .from(workSessionsTable)
    .where(and(gte(workSessionsTable.date, weekStart), lte(workSessionsTable.date, weekEnd)));

  const lastLogins = await db
    .select()
    .from(loginActivityTable)
    .orderBy(desc(loginActivityTable.loginTime));

  const monitoring = users.map(user => {
    const userTodaySessions = todaySessions.filter(s => s.userId === user.id);
    const hoursToday = userTodaySessions.reduce((sum, s) => sum + (s.totalMinutes ?? 0), 0) / 60;

    const userWeekSessions = weekSessions.filter(s => s.userId === user.id);
    const hoursThisWeek = userWeekSessions.reduce((sum, s) => sum + (s.totalMinutes ?? 0), 0) / 60;

    const hasActiveSession = userTodaySessions.some(s => !s.endTime);
    const lastLogin = lastLogins.find(l => l.userId === user.id)?.loginTime ?? null;

    return {
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      isActive: user.isActive,
      status: hasActiveSession ? "working" as const : hoursToday > 0 ? "idle" as const : "offline" as const,
      hoursToday: Math.round(hoursToday * 10) / 10,
      hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
      lastLogin: lastLogin?.toISOString() ?? null,
    };
  });

  res.json(monitoring);
});

// Weekly analytics
router.get("/admin/analytics/weekly", requireAdmin, async (req, res): Promise<void> => {
  const weekParam = req.query.week ? new Date(req.query.week as string) : new Date();
  const weekStart = startOfWeek(weekParam, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(weekParam, { weekStartsOn: 0 });
  const from = dateStr(weekStart);
  const to = dateStr(weekEnd);

  const sessions = await db
    .select()
    .from(workSessionsTable)
    .where(and(gte(workSessionsTable.date, from), lte(workSessionsTable.date, to)));

  const users = await db.select().from(usersTable).where(eq(usersTable.isActive, true));
  const userCount = users.length;
  const avgTargetPerDay = userCount > 0
    ? users.reduce((s, u) => s + Math.round(u.targetHoursPerDay * 60), 0) / userCount
    : 480;

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd }).map(day => {
    const dStr = dateStr(day);
    const daySessions = sessions.filter(s => s.date === dStr);
    const workedMinutes = daySessions.reduce((sum, s) => sum + (s.totalMinutes ?? 0), 0);
    const targetMinutes = Math.round(avgTargetPerDay * userCount);
    return {
      date: dStr,
      dayName: dayName(day),
      workedMinutes,
      targetMinutes,
      productivityPercent: targetMinutes > 0 ? Math.min(100, (workedMinutes / targetMinutes) * 100) : 0,
    };
  });

  res.json({ weekStart: from, days });
});

// Monthly analytics
router.get("/admin/analytics/monthly", requireAdmin, async (req, res): Promise<void> => {
  const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
  const month = req.query.month ? Number(req.query.month) : new Date().getMonth() + 1;
  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(monthStart);
  const from = dateStr(monthStart);
  const to = dateStr(monthEnd);

  const sessions = await db
    .select()
    .from(workSessionsTable)
    .where(and(gte(workSessionsTable.date, from), lte(workSessionsTable.date, to)));

  const users = await db.select().from(usersTable).where(eq(usersTable.isActive, true));

  const weekMap = new Map<number, { worked: number; target: number }>();
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  for (const day of days) {
    const weekNum = getWeek(day, { weekStartsOn: 0 });
    if (!weekMap.has(weekNum)) weekMap.set(weekNum, { worked: 0, target: 0 });
    const entry = weekMap.get(weekNum)!;
    const dStr = dateStr(day);
    const daySessions = sessions.filter(s => s.date === dStr);
    entry.worked += daySessions.reduce((sum, s) => sum + (s.totalMinutes ?? 0), 0);
    // Count target for users with this working day
    const dow = day.getDay();
    for (const user of users) {
      const workingDays = parseWorkingDays(user.workingDays);
      if (workingDays.includes(dow)) {
        entry.target += Math.round(user.targetHoursPerDay * 60);
      }
    }
  }

  const weeks = Array.from(weekMap.entries()).map(([wk, { worked, target }]) => ({
    weekNumber: wk,
    workedMinutes: worked,
    targetMinutes: target,
  }));

  // Most productive days of week
  const dayStats = new Array(7).fill(0).map(() => ({ worked: 0, count: 0 }));
  for (const day of days) {
    const dow = day.getDay();
    const dStr = dateStr(day);
    const daySessions = sessions.filter(s => s.date === dStr);
    const worked = daySessions.reduce((sum, s) => sum + (s.totalMinutes ?? 0), 0);
    dayStats[dow].worked += worked;
    dayStats[dow].count++;
  }
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const sortedDays = dayStats
    .map((stat, i) => ({ name: dayNames[i], avg: stat.count > 0 ? stat.worked / stat.count : 0 }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 3)
    .map(d => d.name);

  const totalWorked = sessions.reduce((s, ws) => s + (ws.totalMinutes ?? 0), 0);
  const workDayCount = days.filter(d => d <= new Date()).length;

  res.json({
    year,
    month,
    weeks,
    mostProductiveDays: sortedDays,
    avgHoursWorked: workDayCount > 0 ? Math.round((totalWorked / workDayCount / 60) * 10) / 10 : 0,
  });
});

export default router;
