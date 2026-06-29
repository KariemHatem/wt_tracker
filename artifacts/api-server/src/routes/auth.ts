import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, loginActivityTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  signToken,
  requireAuth,
  parseWorkingDays,
  type AuthRequest,
} from "../lib/auth";

const router = Router();

router.post("/auth/login", async (req: AuthRequest, res): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  // const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  let user;
  try {
    [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));
  } catch (err: any) {
    console.error(
      "DB ERROR:",
      err.message,
      err.cause?.message,
      err.cause?.code,
      err.code,
    );
    res
      .status(500)
      .json({
        error: "DB connection failed",
        detail: err.cause?.message ?? err.message,
      });
    return;
  }
  if (!user || !user.isActive) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  // Log the login
  const ua = req.headers["user-agent"] ?? "";
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
    req.socket.remoteAddress ??
    null;

  await db.insert(loginActivityTable).values({
    userId: user.id,
    ipAddress: ip,
    browser: ua.length > 200 ? ua.slice(0, 200) : ua || null,
    device: /mobile/i.test(ua) ? "Mobile" : "Desktop",
    operatingSystem: /windows/i.test(ua)
      ? "Windows"
      : /mac/i.test(ua)
        ? "MacOS"
        : /linux/i.test(ua)
          ? "Linux"
          : "Unknown",
  });

  const token = signToken({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    isAdmin: user.isAdmin,
  });

  res.json({
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      targetHoursPerDay: user.targetHoursPerDay,
      workingDays: parseWorkingDays(user.workingDays),
      isAdmin: user.isAdmin,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  });
});

router.post(
  "/auth/logout",
  requireAuth,
  async (req: AuthRequest, res): Promise<void> => {
    // Mark the most recent login activity as logged out
    if (req.user) {
      const [activity] = await db
        .select()
        .from(loginActivityTable)
        .where(eq(loginActivityTable.userId, req.user.id))
        .orderBy(loginActivityTable.loginTime)
        .limit(1);
      if (activity && !activity.logoutTime) {
        await db
          .update(loginActivityTable)
          .set({ logoutTime: new Date() })
          .where(eq(loginActivityTable.id, activity.id));
      }
    }
    res.json({ message: "Logged out" });
  },
);

router.get(
  "/auth/me",
  requireAuth,
  async (req: AuthRequest, res): Promise<void> => {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.id));
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      targetHoursPerDay: user.targetHoursPerDay,
      workingDays: parseWorkingDays(user.workingDays),
      isAdmin: user.isAdmin,
      isActive: user.isActive,
      createdAt: user.createdAt,
    });
  },
);

export default router;
