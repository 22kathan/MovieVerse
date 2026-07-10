// ============================================
// MovieVerse — Recommendations API
// GET: Get personalized recommendations for a user
// ============================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMovieRecommendations, getSimilarMovies, getTrending } from "@/lib/tmdb";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      // For guests, return trending movies as recommendations
      const trending = await getTrending("movie", "week");
      return NextResponse.json({
        recommendations: (trending?.results || []).slice(0, 12).map((m) => ({
          id: m.id,
          title: m.title || m.name || "Untitled",
          poster_path: m.poster_path,
          backdrop_path: m.backdrop_path,
          vote_average: m.vote_average || 0,
          release_date: m.release_date || m.first_air_date || "",
          overview: m.overview || "",
          media_type: "movie",
          reason: "Trending this week",
        })),
        source: "trending",
      });
    }

    // Authenticated user: build personalized recommendations
    const userId = session.user.id;

    // 1. Get user's top-rated movies (score >= 7)
    const topRatings = await prisma.rating.findMany({
      where: { userId, score: { gte: 7 } },
      orderBy: { score: "desc" },
      take: 5,
      include: { movie: true },
    });

    // 2. Get user's recent watchlist additions
    const recentWatchlist = await prisma.watchlistItem.findMany({
      where: { userId },
      orderBy: { addedAt: "desc" },
      take: 3,
      include: { movie: true },
    });

    // 3. Collect seed movie tmdbIds and titles
    const seedMovies: Array<{ tmdbId: number; title: string }> = [];
    const seenIds = new Set<number>();

    for (const r of topRatings) {
      if (r.movie && !seenIds.has(r.movie.tmdbId)) {
        seedMovies.push({ tmdbId: r.movie.tmdbId, title: r.movie.title });
        seenIds.add(r.movie.tmdbId);
      }
    }
    for (const w of recentWatchlist) {
      if (w.movie && !seenIds.has(w.movie.tmdbId)) {
        seedMovies.push({ tmdbId: w.movie.tmdbId, title: w.movie.title });
        seenIds.add(w.movie.tmdbId);
      }
    }

    // 4. Fetch TMDB recommendations for each seed movie
    interface RecommendedMovie {
      id: number;
      title: string;
      poster_path: string | null;
      backdrop_path: string | null;
      vote_average: number;
      release_date: string;
      overview: string;
      media_type: string;
      reason: string;
    }

    const allRecommendations: RecommendedMovie[] = [];
    const addedIds = new Set<number>();

    for (const seed of seedMovies.slice(0, 3)) {
      try {
        const [recs, similar] = await Promise.all([
          getMovieRecommendations(seed.tmdbId),
          getSimilarMovies(seed.tmdbId),
        ]);

        const combinedResults = [
          ...((recs?.results || []).map((m) => ({ ...m, reason: `Because you liked "${seed.title}"` }))),
          ...((similar?.results || []).map((m) => ({ ...m, reason: `Similar to "${seed.title}"` }))),
        ];

        for (const movie of combinedResults) {
          if (!addedIds.has(movie.id) && !seenIds.has(movie.id)) {
            addedIds.add(movie.id);
            allRecommendations.push({
              id: movie.id,
              title: movie.title || movie.name || "Untitled",
              poster_path: movie.poster_path || null,
              backdrop_path: movie.backdrop_path || null,
              vote_average: movie.vote_average || 0,
              release_date: movie.release_date || movie.first_air_date || "",
              overview: movie.overview || "",
              media_type: "movie",
              reason: movie.reason,
            });
          }
        }
      } catch (err) {
        console.error(`Failed to fetch recommendations for seed ${seed.tmdbId}:`, err);
      }
    }

    // 5. Sort by vote_average and limit
    allRecommendations.sort((a, b) => b.vote_average - a.vote_average);

    // If no personalized results, fall back to trending
    if (allRecommendations.length === 0) {
      const trending = await getTrending("movie", "week");
      return NextResponse.json({
        recommendations: (trending?.results || []).slice(0, 12).map((m) => ({
          id: m.id,
          title: m.title || m.name || "Untitled",
          poster_path: m.poster_path,
          backdrop_path: m.backdrop_path,
          vote_average: m.vote_average || 0,
          release_date: m.release_date || m.first_air_date || "",
          overview: m.overview || "",
          media_type: "movie",
          reason: "Trending this week",
        })),
        source: "trending",
      });
    }

    return NextResponse.json({
      recommendations: allRecommendations.slice(0, 20),
      source: "personalized",
      seedCount: seedMovies.length,
    });
  } catch (error) {
    console.warn("Recommendations API database offline (using trending fallback):", error);
    try {
      const trending = await getTrending("movie", "week");
      return NextResponse.json({
        recommendations: (trending?.results || []).slice(0, 12).map((m) => ({
          id: m.id,
          title: m.title || m.name || "Untitled",
          poster_path: m.poster_path,
          backdrop_path: m.backdrop_path,
          vote_average: m.vote_average || 0,
          release_date: m.release_date || m.first_air_date || "",
          overview: m.overview || "",
          media_type: "movie",
          reason: "Trending this week",
        })),
        source: "trending",
      });
    } catch (fallbackError) {
      console.error("Recommendations fallback failed:", fallbackError);
      return NextResponse.json({ recommendations: [], source: "empty" });
    }
  }
}
