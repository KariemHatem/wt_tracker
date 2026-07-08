import { Router } from "express";
import { db, usersTable, loginActivityTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth";

const router = Router();

router.get(
  "/activity/login",
  requireAuth,
  async (req: AuthRequest, res): Promise<void> => {
    if (!req.user?.isAdmin) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    const rows = await db
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
        latitude: loginActivityTable.latitude,
        longitude: loginActivityTable.longitude,
        city: loginActivityTable.city,
        country: loginActivityTable.country,
      })
      .from(loginActivityTable)
      .leftJoin(usersTable, eq(loginActivityTable.userId, usersTable.id))
      .orderBy(desc(loginActivityTable.loginTime));

    res.json(rows);
  },
);

export default router;
