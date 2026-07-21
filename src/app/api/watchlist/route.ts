export const dynamic = "force-static";
// ============================================
// MovieVerse — Watchlist API
// GET: Fetch user's watchlist
// POST: Add item to watchlist
// ============================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

import { isDatabaseOffline } from "@/lib/prisma";

const addToWatchlistSchema = z.object({
  tmdbId: z.number().int().positive(),
  movieTitle: z.string(),
  posterPath: z.string().nullable().optional(),
  mediaType: z.enum(["MOVIE", "TV_SHOW"]).optional().default("MOVIE"),
  releaseDate: z.string().optional(),
  voteAverage: z.number().optional(),
});

// GET /api/watchlist
export async function GET(request: Request) {
  try {
    if (await isDatabaseOffline()) {
      return NextResponse.json({
        items: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    
    const [items, total] = await Promise.all([
      prisma.watchlistItem.findMany({
        where: { userId: session.user.id },
        include: {
          movie: {
            select: {
              id: true,
              tmdbId: true,
              title: true,
              posterPath: true,
              mediaType: true,
              releaseDate: true,
              voteAverage: true,
              avgUserRating: true,
            },
          },
        },
        orderBy: { addedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.watchlistItem.count({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json({
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.warn("GET /api/watchlist database offline (using empty fallback):", error);
    return NextResponse.json({
      items: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
  }
}

// POST /api/watchlist
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
    const data = addToWatchlistSchema.parse(body);

    // Find or create Movie record
    let movie = await prisma.movie.findUnique({ where: { tmdbId: data.tmdbId } });
    if (!movie) {
      movie = await prisma.movie.create({
        data: {
          tmdbId: data.tmdbId,
          title: data.movieTitle,
          posterPath: data.posterPath,
          mediaType: data.mediaType,
          releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
          voteAverage: data.voteAverage ?? 0,
        },
      });
    }

    // Check if already in watchlist
    const existing = await prisma.watchlistItem.findUnique({
      where: { userId_movieId: { userId: session.user.id, movieId: movie.id } },
    });

    if (existing) {
      return NextResponse.json({ error: "Already in watchlist" }, { status: 409 });
    }

    const item = await prisma.watchlistItem.create({
      data: {
        userId: session.user.id,
        movieId: movie.id,
      },
      include: {
        movie: { select: { id: true, tmdbId: true, title: true, posterPath: true } },
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: "WATCHLISTED",
        targetId: movie.id,
        metadata: { movieTitle: movie.title },
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("POST /api/watchlist error:", error);
    return NextResponse.json({ error: "Failed to add to watchlist" }, { status: 500 });
  }
}

// DELETE /api/watchlist (body: { tmdbId })
export async function DELETE(request: Request) {
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
    const tmdbId = body.tmdbId;

    if (!tmdbId) {
      return NextResponse.json({ error: "tmdbId required" }, { status: 400 });
    }

    const movie = await prisma.movie.findUnique({ where: { tmdbId } });
    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    await prisma.watchlistItem.deleteMany({
      where: { userId: session.user.id, movieId: movie.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/watchlist error:", error);
    return NextResponse.json({ error: "Failed to remove from watchlist" }, { status: 500 });
  }
}
