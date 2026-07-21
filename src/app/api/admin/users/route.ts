export const dynamic = "force-static";
// ============================================
// MovieVerse — Admin Users API
// GET: Fetch all users (ADMIN only)
// PUT: Update user role / Delete user (ADMIN only)
// ============================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";

    const users = await prisma.user.findMany({
      where: query ? {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { username: { contains: query, mode: "insensitive" } },
        ]
      } : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        isPremium: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin Fetch Users Error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const { userId, role, action } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Prevent modifying self
    if (userId === session.user.id) {
      return NextResponse.json({ error: "Self modification is not permitted" }, { status: 400 });
    }

    if (action === "delete") {
      await prisma.user.delete({
        where: { id: userId },
      });
      return NextResponse.json({ success: true, message: "User deleted successfully" });
    }

    if (!role || !["GUEST", "REGISTERED", "PREMIUM", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: role,
        isPremium: role === "PREMIUM" || role === "ADMIN",
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Admin Update User Error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
