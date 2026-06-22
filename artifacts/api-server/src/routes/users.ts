import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin, parseWorkingDays, formatWorkingDays, type AuthRequest } from "../lib/auth";

const router = Router();

function serializeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    targetHoursPerDay: user.targetHoursPerDay,
    workingDays: parseWorkingDays(user.workingDays),
    isAdmin: user.isAdmin,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

// List users (admin)
router.get("/users", requireAdmin, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(users.map(serializeUser));
});

// Create user (admin)
router.post("/users", requireAdmin, async (req, res): Promise<void> => {
  const { fullName, email, password, targetHoursPerDay, workingDays, isAdmin } = req.body;
  if (!fullName || !email || !password) {
    res.status(400).json({ error: "fullName, email, and password are required" });
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(usersTable)
    .values({
      fullName,
      email,
      passwordHash: hash,
      targetHoursPerDay: targetHoursPerDay ?? 8,
      workingDays: workingDays ? formatWorkingDays(workingDays) : "0,1,2,3,4",
      isAdmin: isAdmin ?? false,
    })
    .returning();
  res.status(201).json(serializeUser(user));
});

// Get single user
router.get("/users/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  // Non-admins can only see themselves
  if (!req.user?.isAdmin && req.user?.id !== id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(serializeUser(user));
});

// Update user (admin)
router.patch("/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (req.body.fullName != null) updates.fullName = req.body.fullName;
  if (req.body.email != null) updates.email = req.body.email;
  if (req.body.targetHoursPerDay != null) updates.targetHoursPerDay = req.body.targetHoursPerDay;
  if (req.body.workingDays != null) updates.workingDays = formatWorkingDays(req.body.workingDays);
  if (req.body.isActive != null) updates.isActive = req.body.isActive;
  if (req.body.isAdmin != null) updates.isAdmin = req.body.isAdmin;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(serializeUser(user));
});

// Delete user (admin)
router.delete("/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [user] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.sendStatus(204);
});

// Update own profile
router.patch("/users/me/profile", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (req.body.fullName != null) updates.fullName = req.body.fullName;
  if (req.body.targetHoursPerDay != null) updates.targetHoursPerDay = req.body.targetHoursPerDay;
  if (req.body.workingDays != null) updates.workingDays = formatWorkingDays(req.body.workingDays);
  if (req.body.password) {
    updates.passwordHash = await bcrypt.hash(req.body.password, 10);
  }

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, req.user!.id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(serializeUser(user));
});

export default router;
