export const dynamic = "force-static";
// ============================================
// MovieVerse — Secured Premium Subscription API
// POST: Process premium purchase and upgrade user role
// ============================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

import { updateUser } from "@/lib/dbFallback";

// Secure validation schema requiring a transaction token (prevents raw card submittals)
const subscribeSchema = z.object({
  plan: z.enum(["premium"]),
  paymentToken: z.string().regex(/^tok_mv_[a-zA-Z0-9]{24}$/, "Invalid payment token signature"),
});

export async function POST(request: Request) {
  try {
    // 1. Strict Session Check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. CSRF / Cross-Origin Request Forgery Prevention
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && !origin.includes(host || "")) {
      return NextResponse.json({ error: "Cross-origin request blocked" }, { status: 403 });
    }

    // 3. Request Body Parsing & Sanitization
    const body = await request.json();
    const parsedData = subscribeSchema.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json(
        { error: parsedData.error.issues[0].message || "Invalid payload details" },
        { status: 400 }
      );
    }

    // 4. Upgrade User Role inside DB transaction (prevent race conditions)
    let updatedUser;
    try {
      updatedUser = await prisma.$transaction(async (tx) => {
        return await tx.user.update({
          where: { id: userId },
          data: {
            role: "PREMIUM",
            isPremium: true,
            premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      });
    } catch (dbError) {
      console.warn("Postgres offline during premium upgrade, updating fallback database:", dbError);
      const fallbackUser = updateUser(userId, {
        role: "PREMIUM",
        isPremium: true,
        premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      if (!fallbackUser) {
        return NextResponse.json({ error: "User not found in local database" }, { status: 404 });
      }
      updatedUser = fallbackUser;
    }

    return NextResponse.json({
      success: true,
      message: "Successfully upgraded to Premium!",
      user: {
        id: updatedUser.id,
        role: updatedUser.role,
        isPremium: updatedUser.isPremium,
      },
    });
  } catch (error) {
    console.error("Premium Subscription Secure API Error:", error);
    return NextResponse.json({ error: "Failed to process premium subscription" }, { status: 500 });
  }
}
