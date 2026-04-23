import type { Request, Response } from "express";
import prisma from "../prisma";

/**
 * 1. SYNC USER HANDLER
 * Saves user details from Clerk into our own database
 */
export async function syncUserHandler(req: Request, res: Response) {
  try {
    const { id, email, name, imageUrl, role } = req.body;

    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const user = await prisma.user.upsert({
      where: { id: String(id) },
      update: {
        email: email || undefined,
        name: name || undefined,
        imageUrl: imageUrl || undefined,
        role: role || undefined,
      },
      create: {
        id: String(id),
        email: email || null,
        name: name || null,
        imageUrl: imageUrl || null,
        role: role || null,
      },
    });

    return res.json({ success: true, user });
  } catch (err: any) {
    console.error("❌ Error syncing user:", err);
    return res.status(500).json({ error: "Failed to sync user" });
  }
}
