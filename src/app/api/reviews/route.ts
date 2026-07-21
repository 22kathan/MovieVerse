export const dynamic = "force-static";
// ============================================
// MovieVerse — Reviews API
// GET: Fetch reviews for a movie
// POST: Create a new review
// ============================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createReviewSchema = z.object({
  movieId: z.string().min(1),
  tmdbId: z.number().int().positive(),
  title: z.string().optional(),
  content: z.string().min(10, "Review must be at least 10 characters"),
  rating: z.number().min(1).max(10),
  spoiler: z.boolean().optional().default(false),
  // Movie metadata (used to auto-create Movie record if needed)
  movieTitle: z.string().optional(),
  posterPath: z.string().nullable().optional(),
  mediaType: z.enum(["MOVIE", "TV_SHOW"]).optional().default("MOVIE"),
});

import { isDatabaseOffline } from "@/lib/prisma";

// GET /api/reviews?movieId=xxx OR ?tmdbId=123 OR ?userId=xxx
export async function GET(request: Request) {
  try {
    if (await isDatabaseOffline()) {
      return NextResponse.json({
        reviews: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      });
    }

    const { searchParams } = new URL(request.url);
    const movieId = searchParams.get("movieId");
    const tmdbId = searchParams.get("tmdbId");
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: any = {};

    if (movieId) {
      where.movieId = movieId;
    } else if (tmdbId) {
      where.movie = { tmdbId: parseInt(tmdbId) };
    }

    if (userId) {
      where.userId = userId;
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, image: true, username: true } },
          movie: { select: { id: true, title: true, tmdbId: true, posterPath: true } },
          _count: { select: { comments: true, votes: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/reviews error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

// POST /api/reviews
export async function POST(request: Request) {
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

    const body = await request.json();
    const data = createReviewSchema.parse(body);

    // Find or create the Movie record
    let movie = await prisma.movie.findUnique({ where: { tmdbId: data.tmdbId } });
    if (!movie) {
      movie = await prisma.movie.create({
        data: {
          tmdbId: data.tmdbId,
          title: data.movieTitle || "Unknown",
          posterPath: data.posterPath,
          mediaType: data.mediaType,
        },
      });
    }

    // Check if user already reviewed this movie
    const existing = await prisma.review.findUnique({
      where: { userId_movieId: { userId: session.user.id, movieId: movie.id } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You already reviewed this title. You can edit your existing review." },
        { status: 409 }
      );
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        userId: session.user.id,
        movieId: movie.id,
        title: data.title,
        content: data.content,
        rating: data.rating,
        spoiler: data.spoiler,
      },
      include: {
        user: { select: { id: true, name: true, image: true, username: true } },
        movie: { select: { id: true, title: true, tmdbId: true } },
      },
    });

    // Update movie aggregate rating
    const agg = await prisma.review.aggregate({
      where: { movieId: movie.id },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.movie.update({
      where: { id: movie.id },
      data: {
        avgUserRating: agg._avg.rating,
        totalReviews: agg._count,
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: "REVIEWED",
        targetId: movie.id,
        metadata: { movieTitle: movie.title, rating: data.rating },
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("POST /api/reviews error:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
