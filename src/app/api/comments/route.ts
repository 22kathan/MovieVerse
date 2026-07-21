export const dynamic = "force-static";
// ============================================
// MovieVerse — Comments API
// GET: Fetch comments for a review
// POST: Add a comment to a review
// DELETE: Delete a comment
// ============================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get("reviewId");

    if (!reviewId) {
      return NextResponse.json({ error: "reviewId is required" }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { reviewId },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    // Build threaded structure
    interface CommentNode {
      id: string;
      content: string;
      createdAt: Date;
      updatedAt: Date;
      userId: string;
      parentId: string | null;
      user: { id: string; name: string | null; username: string | null; image: string | null };
      likes: number;
      replies: CommentNode[];
    }

    const commentMap = new Map<string, CommentNode>();
    const rootComments: CommentNode[] = [];

    for (const c of comments) {
      const node: CommentNode = {
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        userId: c.userId,
        parentId: c.parentId,
        user: c.user,
        likes: c.likes,
        replies: [],
      };
      commentMap.set(c.id, node);
    }

    for (const c of comments) {
      const node = commentMap.get(c.id)!;
      if (c.parentId && commentMap.has(c.parentId)) {
        commentMap.get(c.parentId)!.replies.push(node);
      } else {
        rootComments.push(node);
      }
    }

    return NextResponse.json({
      comments: rootComments,
      totalCount: comments.length,
    });
  } catch (error) {
    console.warn("Get comments database offline (using empty fallback):", error);
    return NextResponse.json({
      comments: [],
      totalCount: 0,
    });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewId, content, parentId } = await request.json();

    if (!reviewId || !content?.trim()) {
      return NextResponse.json(
        { error: "reviewId and content are required" },
        { status: 400 }
      );
    }

    // Verify the review exists
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { user: { select: { id: true, name: true } } },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // If replying to a comment, verify the parent exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });
      if (!parentComment) {
        return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
        reviewId,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    // Notify the review author (if not commenting on own review)
    if (review.userId !== session.user.id) {
      await prisma.notification.create({
        data: {
          userId: review.userId,
          title: "New Comment",
          message: `${session.user.name || "Someone"} commented on your review`,
          link: `/reviews`,
        },
      });
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: "COMMENTED",
        targetId: reviewId,
        metadata: { reviewId, movieTitle: "" },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("id");

    if (!commentId) {
      return NextResponse.json({ error: "Comment ID is required" }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.userId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to delete this comment" }, { status: 403 });
    }

    // Delete child comments first, then the comment
    await prisma.comment.deleteMany({
      where: { parentId: commentId },
    });

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
