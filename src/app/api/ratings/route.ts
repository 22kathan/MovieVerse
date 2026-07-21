export const dynamic = "force-static";
// ============================================
// MovieVerse — Ratings API
// POST: Submit or update a rating
// GET: Get aggregate ratings for a movie
// ============================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

import { isDatabaseOffline } from "@/lib/prisma";

const ratingSchema = z.object({
  tmdbId: z.number().int().positive(),
  score: z.number().min(1).max(10),
  movieTitle: z.string().optional(),
  posterPath: z.string().nullable().optional(),
  mediaType: z.enum(["MOVIE", "TV_SHOW"]).optional().default("MOVIE"),
});

// GET /api/ratings?tmdbId=123
export async function GET(request: Request) {
  try {
    if (await isDatabaseOffline()) {
      return NextResponse.json({
        avgUserRating: null,
        totalRatings: 0,
        totalReviews: 0,
        criticScore: null,
        audienceScore: null,
        userRating: null,
        inWatchlist: false,
      });
    }

    const { searchParams } = new URL(request.url);
    const tmdbId = searchParams.get("tmdbId");

    if (!tmdbId) {
      return NextResponse.json({ error: "tmdbId required" }, { status: 400 });
    }

    const movie = await prisma.movie.findUnique({
      where: { tmdbId: parseInt(tmdbId) },
      select: {
        avgUserRating: true,
        totalRatings: true,
        totalReviews: true,
        criticScore: true,
        audienceScore: true,
      },
    });

    if (!movie) {
      return NextResponse.json({
        avgUserRating: null,
        totalRatings: 0,
        totalReviews: 0,
        criticScore: null,
        audienceScore: null,
        userRating: null,
        inWatchlist: false,
      });
    }

    // If user is logged in, also return their personal rating and watchlist status
    let userRating = null;
    let inWatchlist = false;
    const session = await auth();
    if (session?.user?.id) {
      const [rating, watchlistItem] = await Promise.all([
        prisma.rating.findFirst({
          where: {
            userId: session.user.id,
            movie: { tmdbId: parseInt(tmdbId) },
          },
        }),
        prisma.watchlistItem.findFirst({
          where: {
            userId: session.user.id,
            movie: { tmdbId: parseInt(tmdbId) },
          },
        }),
      ]);
      userRating = rating?.score ?? null;
      inWatchlist = !!watchlistItem;
    }

    return NextResponse.json({
      ...movie,
      userRating,
      inWatchlist,
    });
  } catch (error) {
    console.error("GET /api/ratings error:", error);
    return NextResponse.json({ error: "Failed to fetch ratings" }, { status: 500 });
  }
}

// POST /api/ratings
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
    const data = ratingSchema.parse(body);

    // Find or create Movie record
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

    // Upsert rating
    const rating = await prisma.rating.upsert({
      where: {
        userId_movieId: { userId: session.user.id, movieId: movie.id },
      },
      update: { score: data.score },
      create: {
        userId: session.user.id,
        movieId: movie.id,
        score: data.score,
      },
    });

    // Update aggregate
    const agg = await prisma.rating.aggregate({
      where: { movieId: movie.id },
      _avg: { score: true },
      _count: true,
    });

    // Calculate audience score (percentage who rated 7+)
    const positiveCount = await prisma.rating.count({
      where: { movieId: movie.id, score: { gte: 7 } },
    });
    const audienceScore = agg._count > 0 ? Math.round((positiveCount / agg._count) * 100) : null;

    await prisma.movie.update({
      where: { id: movie.id },
      data: {
        avgUserRating: agg._avg.score,
        totalRatings: agg._count,
        audienceScore,
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: "RATED",
        targetId: movie.id,
        metadata: { movieTitle: movie.title, score: data.score },
      },
    });

    return NextResponse.json({
      rating,
      aggregate: {
        avgUserRating: agg._avg.score,
        totalRatings: agg._count,
        audienceScore,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("POST /api/ratings error:", error);
    return NextResponse.json({ error: "Failed to submit rating" }, { status: 500 });
  }
}
