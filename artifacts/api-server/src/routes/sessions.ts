import { Router } from "express";
import { db, workSessionsTable, usersTable, loginActivityTable } from "@workspace/db";
import { eq, and, gte, lte, isNull, desc } from "drizzle-orm";
import { requireAuth, parseWorkingDays, type AuthRequest } from "../lib/auth";

const router = Router();

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

// Start session
router.post("/sessions/start", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user!.id;
  // Check for existing active session
  const [active] = await db
    .select()
    .from(workSessionsTable)
    .where(and(eq(workSessionsTable.userId, userId), isNull(workSessionsTable.endTime)));
  if (active) {
    res.status(409).json({ error: "Session already active" });
    return;
  }
  const today = todayDateString();
  const [session] = await db
    .insert(workSessionsTable)
    .values({ userId, date: today })
    .returning();
  res.status(201).json(session);
});

// End session
router.post("/sessions/end", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user!.id;
  const [active] = await db
    .select()
    .from(workSessionsTable)
    .where(and(eq(workSessionsTable.userId, userId), isNull(workSessionsTable.endTime)));
  if (!active) {
    res.status(404).json({ error: "No active session" });
    return;
  }
  const endTime = new Date();
  const totalMinutes = Math.floor((endTime.getTime() - active.startTime.getTime()) / 60000);
  const [session] = await db
    .update(workSessionsTable)
    .set({ endTime, totalMinutes })
    .where(eq(workSessionsTable.id, active.id))
    .returning();
  res.json(session);
});

// Get active session
router.get("/sessions/active", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user!.id;
  const [active] = await db
    .select()
    .from(workSessionsTable)
    .where(and(eq(workSessionsTable.userId, userId), isNull(workSessionsTable.endTime)));
  res.json({ session: active ?? null });
});

// Get today's progress
router.get("/sessions/today", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user!.id;
  const today = todayDateString();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const targetMinutes = Math.round((user?.targetHoursPerDay ?? 8) * 60);

  // Sum all completed sessions today
  const sessions = await db
    .select()
    .from(workSessionsTable)
    .where(and(eq(workSessionsTable.userId, userId), eq(workSessionsTable.date, today)));

  let workedMinutes = 0;
  let sessionStartTime: string | null = null;

  for (const s of sessions) {
    if (s.endTime && s.totalMinutes) {
      workedMinutes += s.totalMinutes;
    } else if (!s.endTime) {
      // Active session — count elapsed time
      const elapsed = Math.floor((Date.now() - s.startTime.getTime()) / 60000);
      workedMinutes += elapsed;
      sessionStartTime = s.startTime.toISOString();
    }
  }

  const remainingMinutes = Math.max(0, targetMinutes - workedMinutes);
  const progressPercent = targetMinutes > 0 ? Math.min(100, (workedMinutes / targetMinutes) * 100) : 0;

  res.json({
    workedMinutes,
    targetMinutes,
    remainingMinutes,
    progressPercent,
    isComplete: workedMinutes >= targetMinutes,
    sessionStartTime,
  });
});

// List sessions
router.get("/sessions", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const isAdmin = req.user!.isAdmin;
  const userIdParam = req.query.userId ? Number(req.query.userId) : undefined;
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;

  const targetUserId = isAdmin && userIdParam ? userIdParam : req.user!.id;

  const conditions = [eq(workSessionsTable.userId, targetUserId)];
  if (from) conditions.push(gte(workSessionsTable.date, from));
  if (to) conditions.push(lte(workSessionsTable.date, to));

  const sessions = await db
    .select()
    .from(workSessionsTable)
    .where(and(...conditions))
    .orderBy(desc(workSessionsTable.startTime));

  res.json(sessions);
});

// Login activity
router.get("/activity/login", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const isAdmin = req.user!.isAdmin;
  const userIdParam = req.query.userId ? Number(req.query.userId) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : 50;

  let query;
  if (isAdmin && !userIdParam) {
    // Admin sees all
    const activities = await db
      .select({
        id: loginActivityTable.id,
        userId: loginActivityTable.userId,
        userFullName: usersTable.fullName,
        userEmail: usersTable.email,
        loginTime: loginActivityTable.loginTime,
        logoutTime: loginActivityTable.logoutTime,
        ipAddress: loginActivityTable.ipAddress,
        browser: loginActivityTable.browser,
        operatingSystem: loginActivityTable.operatingSystem,
        device: loginActivityTable.device,
      })
      .from(loginActivityTable)
      .leftJoin(usersTable, eq(loginActivityTable.userId, usersTable.id))
      .orderBy(desc(loginActivityTable.loginTime))
      .limit(limit);
    res.json(activities);
  } else {
    const targetUserId = isAdmin && userIdParam ? userIdParam : req.user!.id;
    const activities = await db
      .select({
        id: loginActivityTable.id,
        userId: loginActivityTable.userId,
        userFullName: usersTable.fullName,
        userEmail: usersTable.email,
        loginTime: loginActivityTable.loginTime,
        logoutTime: loginActivityTable.logoutTime,
        ipAddress: loginActivityTable.ipAddress,
        browser: loginActivityTable.browser,
        operatingSystem: loginActivityTable.operatingSystem,
        device: loginActivityTable.device,
      })
      .from(loginActivityTable)
      .leftJoin(usersTable, eq(loginActivityTable.userId, usersTable.id))
      .where(eq(loginActivityTable.userId, targetUserId))
      .orderBy(desc(loginActivityTable.loginTime))
      .limit(limit);
    res.json(activities);
  }
});

export default router;
