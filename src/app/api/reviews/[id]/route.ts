// ============================================
// MovieVerse — Single Review API
// GET: Fetch single review
// PUT: Edit own review
// DELETE: Delete own review
// ============================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, isDatabaseOffline } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (await isDatabaseOffline()) {
      return NextResponse.json({ error: "Review not found (Database offline)" }, { status: 404 });
    }
    const { id } = await params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, image: true, username: true } },
        movie: { select: { id: true, title: true, tmdbId: true, posterPath: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { votes: true } },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error("GET /api/reviews/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch review" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (await isDatabaseOffline()) {
      return NextResponse.json(
        { error: "Database offline. This action is temporarily disabled." },
        { status: 503 }
      );
    }
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Check ownership
    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const review = await prisma.review.update({
      where: { id },
      data: {
        title: body.title ?? existing.title,
        content: body.content ?? existing.content,
        rating: body.rating ?? existing.rating,
        spoiler: body.spoiler ?? existing.spoiler,
      },
      include: {
        user: { select: { id: true, name: true, image: true, username: true } },
      },
    });

    // Update aggregate
    const agg = await prisma.review.aggregate({
      where: { movieId: existing.movieId },
      _avg: { rating: true },
    });
    await prisma.movie.update({
      where: { id: existing.movieId },
      data: { avgUserRating: agg._avg.rating },
    });

    return NextResponse.json({ review });
  } catch (error) {
    console.error("PUT /api/reviews/[id] error:", error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (await isDatabaseOffline()) {
      return NextResponse.json(
        { error: "Database offline. This action is temporarily disabled." },
        { status: 503 }
      );
    }
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Allow owner or admin to delete
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (existing.userId !== session.user.id && user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await prisma.review.delete({ where: { id } });

    // Update aggregate
    const agg = await prisma.review.aggregate({
      where: { movieId: existing.movieId },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.movie.update({
      where: { id: existing.movieId },
      data: {
        avgUserRating: agg._avg.rating ?? 0,
        totalReviews: agg._count,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/reviews/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
