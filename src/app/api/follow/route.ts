export const dynamic = "force-static";
// ============================================
// MovieVerse — Follow System API
// POST: Follow a user
// DELETE: Unfollow a user
// GET: Get followers/following for a user
// ============================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId } = await request.json();

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
    }

    if (targetUserId === session.user.id) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json({ error: "Already following this user" }, { status: 409 });
    }

    // Create follow
    await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followingId: targetUserId,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: "FOLLOWED",
        targetId: targetUserId,
        metadata: { targetName: targetUser.name || targetUser.username || "User" },
      },
    });

    // Create notification for the followed user
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        title: "New Follower",
        message: `${session.user.name || "Someone"} started following you`,
        link: `/profile/${session.user.id}`,
      },
    });

    return NextResponse.json({ success: true, following: true });
  } catch (error) {
    console.error("Follow API error:", error);
    return NextResponse.json({ error: "Failed to follow user" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("targetUserId");

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
    }

    await prisma.follow.deleteMany({
      where: {
        followerId: session.user.id,
        followingId: targetUserId,
      },
    });

    return NextResponse.json({ success: true, following: false });
  } catch (error) {
    console.error("Unfollow API error:", error);
    return NextResponse.json({ error: "Failed to unfollow user" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type") || "followers"; // "followers" | "following"

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const session = await auth();

    if (type === "following") {
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: { id: true, name: true, username: true, image: true, bio: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        users: following.map((f) => f.following),
        total: following.length,
        isOwnProfile: session?.user?.id === userId,
      });
    } else {
      const followers = await prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: { id: true, name: true, username: true, image: true, bio: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Check if the current user follows any of these users
      let currentUserFollowing: string[] = [];
      if (session?.user?.id) {
        const myFollows = await prisma.follow.findMany({
          where: { followerId: session.user.id },
          select: { followingId: true },
        });
        currentUserFollowing = myFollows.map((f) => f.followingId);
      }

      return NextResponse.json({
        users: followers.map((f) => ({
          ...f.follower,
          isFollowedByMe: currentUserFollowing.includes(f.follower.id),
        })),
        total: followers.length,
        isOwnProfile: session?.user?.id === userId,
      });
    }
  } catch (error) {
    console.error("Get follow data error:", error);
    return NextResponse.json({ error: "Failed to fetch follow data" }, { status: 500 });
  }
}
