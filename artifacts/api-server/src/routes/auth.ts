import { Router } from "express";
import bcrypt from "bcryptjs";
import axios from "axios";
import { db, usersTable, loginActivityTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  signToken,
  requireAuth,
  parseWorkingDays,
  type AuthRequest,
} from "../lib/auth";

const router = Router();

async function reverseGeocode(lat: number, lng: number) {
  try {
    const { data } = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: {
        lat,
        lon: lng,
        format: "json",
        "accept-language": "en",
      },
      headers: { "User-Agent": "WorkTracker/1.0 (admin@company.com)" },
      timeout: 5000,
    });
    return {
      address: data.display_name ?? null,
      city: data.address?.city || data.address?.town || data.address?.village || null,
      country: data.address?.country ?? null,
    };
  } catch (err: any) {
    console.error("Reverse geocode failed:", err.message);
    return null;
  }
}

router.post("/auth/login", async (req: AuthRequest, res): Promise<void> => {
  const { email, password, latitude, longitude } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

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
    res.status(500).json({
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

  const ua = req.headers["user-agent"] ?? "";
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
    req.socket.remoteAddress ??
    null;

  const hasGpsCoords =
    typeof latitude === "number" && typeof longitude === "number";

  const [inserted] = await db
    .insert(loginActivityTable)
    .values({
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
      latitude: hasGpsCoords ? latitude : null,
      longitude: hasGpsCoords ? longitude : null,
    })
    .returning({ id: loginActivityTable.id });

  if (hasGpsCoords) {
    // Precise GPS coords from the browser — reverse geocode into a real address
    reverseGeocode(latitude, longitude).then((loc) => {
      if (loc && inserted?.id) {
        db.update(loginActivityTable)
          .set({ address: loc.address, city: loc.city, country: loc.country })
          .where(eq(loginActivityTable.id, inserted.id))
          .catch((err) => console.error("Failed to update address:", err));
      }
    });
  }
  // If GPS wasn't granted, latitude/longitude/city/country/address all stay null —
  // no IP fallback, so the table can show "Location not shared" instead of a wrong city.

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
    if (req.user) {
      const [activity] = await db
        .select()
        .from(loginActivityTable)
        .where(eq(loginActivityTable.userId, req.user.id))
        .orderBy(desc(loginActivityTable.loginTime))
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
