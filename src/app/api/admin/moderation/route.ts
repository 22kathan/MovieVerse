export const dynamic = "force-static";
// ============================================
// MovieVerse — Admin Moderation API
// GET: Fetch reviews and comments for moderation (ADMIN only)
// DELETE: Remove flagged reviews or comments (ADMIN only)
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

    const [reviews, comments] = await Promise.all([
      prisma.review.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.comment.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    return NextResponse.json({ reviews, comments });
  } catch (error) {
    console.error("Admin Moderation Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch moderation data" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type"); // "review" or "comment"

    if (!id || !type) {
      return NextResponse.json({ error: "Missing id or type parameter" }, { status: 400 });
    }

    if (type === "review") {
      await prisma.review.delete({
        where: { id },
      });
      return NextResponse.json({ success: true, message: "Review deleted successfully" });
    } else if (type === "comment") {
      await prisma.comment.delete({
        where: { id },
      });
      return NextResponse.json({ success: true, message: "Comment deleted successfully" });
    } else {
      return NextResponse.json({ error: "Invalid content type specified" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin Moderation Delete Error:", error);
    return NextResponse.json({ error: "Failed to delete content" }, { status: 500 });
  }
}
