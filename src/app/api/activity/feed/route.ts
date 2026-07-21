export const dynamic = "force-static";
// ============================================
// MovieVerse — Activity Feed API
// GET: Get social activity feed for a user
// ============================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type") || "social"; // "social" | "personal"

    if (type === "personal" && !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const skip = (page - 1) * limit;

    if (type === "social" && session?.user?.id) {
      // Get IDs of users the current user follows
      const following = await prisma.follow.findMany({
        where: { followerId: session.user.id },
        select: { followingId: true },
      });

      const followingIds = following.map((f) => f.followingId);

      if (followingIds.length === 0) {
        // No follows — return recent global activity
        const globalActivity = await prisma.activity.findMany({
          orderBy: { createdAt: "desc" },
          take: limit,
          skip,
          include: {
            user: {
              select: { id: true, name: true, username: true, image: true },
            },
          },
        });

        return NextResponse.json({
          activities: globalActivity.map(formatActivity),
          hasMore: globalActivity.length === limit,
          source: "global",
        });
      }

      // Get activity from followed users
      const friendActivity = await prisma.activity.findMany({
        where: {
          userId: { in: followingIds },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        include: {
          user: {
            select: { id: true, name: true, username: true, image: true },
          },
        },
      });

      return NextResponse.json({
        activities: friendActivity.map(formatActivity),
        hasMore: friendActivity.length === limit,
        source: "social",
      });
    }

    // Personal activity or unauthenticated
    const userId = session?.user?.id;

    if (userId && type === "personal") {
      const personalActivity = await prisma.activity.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
        include: {
          user: {
            select: { id: true, name: true, username: true, image: true },
          },
        },
      });

      return NextResponse.json({
        activities: personalActivity.map(formatActivity),
        hasMore: personalActivity.length === limit,
        source: "personal",
      });
    }

    // Global feed for guests
    const globalActivity = await prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    return NextResponse.json({
      activities: globalActivity.map(formatActivity),
      hasMore: globalActivity.length === limit,
      source: "global",
    });
  } catch (error) {
    console.warn("Activity feed API database offline (using empty fallback):", error);
    return NextResponse.json({
      activities: [],
      hasMore: false,
      source: "fallback",
    });
  }
}

interface ActivityRecord {
  id: string;
  type: string;
  targetId: string;
  metadata: unknown;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
}

function formatActivity(activity: ActivityRecord) {
  const meta = (activity.metadata || {}) as Record<string, unknown>;
  let message = "";
  let icon = "📌";
  let link = "";

  switch (activity.type) {
    case "RATED":
      message = `rated "${meta.movieTitle || "a movie"}" ${meta.score || "?"}/10`;
      icon = "⭐";
      link = `/movies/${activity.targetId}`;
      break;
    case "REVIEWED":
      message = `wrote a review for "${meta.movieTitle || "a movie"}"`;
      icon = "✍️";
      link = `/movies/${activity.targetId}`;
      break;
    case "WATCHLISTED":
      message = `added "${meta.movieTitle || "a movie"}" to their watchlist`;
      icon = "🔖";
      link = `/movies/${activity.targetId}`;
      break;
    case "LISTED":
      message = `created a new list "${meta.listName || "Untitled"}"`;
      icon = "📋";
      link = `/lists`;
      break;
    case "FOLLOWED":
      message = `started following ${meta.targetName || "a user"}`;
      icon = "👤";
      link = `/profile/${activity.targetId}`;
      break;
    case "COMMENTED":
      message = `commented on a review`;
      icon = "💬";
      link = `/reviews`;
      break;
    default:
      message = `performed an action`;
  }

  return {
    id: activity.id,
    type: activity.type,
    message,
    icon,
    link,
    user: activity.user,
    createdAt: activity.createdAt,
    metadata: meta,
  };
}
