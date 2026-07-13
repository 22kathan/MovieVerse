import HeroBanner from "@/components/movie/HeroBanner";
import MovieGrid from "@/components/movie/MovieGrid";
import SectionHeader from "@/components/shared/SectionHeader";
import {
  getTrending,
  getPopularMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  getNowPlayingMovies,
  getMovieRecommendations,
} from "@/lib/tmdb";
import { auth } from "@/lib/auth";
import { prisma, isDatabaseOffline } from "@/lib/prisma";
import type { TMDBMovie } from "@/types";

export default async function HomePage() {
  // Fetch user session for personalized feed
  const session = await auth();
  let personalRecommendations: TMDBMovie[] = [];
  let recommendationSourceTitle = "";

  if (session?.user?.id) {
    const isOffline = await isDatabaseOffline();
    if (!isOffline) {
      try {
        // 1. Get user's latest watchlisted movie
        const latestWatchlist = await prisma.watchlistItem.findFirst({
          where: { userId: session.user.id },
          orderBy: { addedAt: "desc" },
          include: { movie: true },
        });

        let targetMovie = latestWatchlist?.movie;

        // 2. If no watchlist, get highly rated movie (rating >= 7)
        if (!targetMovie) {
          const highestRated = await prisma.rating.findFirst({
            where: { userId: session.user.id, score: { gte: 7 } },
            orderBy: { score: "desc" },
            include: { movie: true },
          });
          targetMovie = highestRated?.movie;
        }

        // 3. If target movie exists, fetch recommendations from TMDB
        if (targetMovie) {
          const recommendationsData = await getMovieRecommendations(targetMovie.tmdbId);
          if (recommendationsData?.results && recommendationsData.results.length > 0) {
            personalRecommendations = recommendationsData.results.slice(0, 6);
            recommendationSourceTitle = `✨ Recommended for You (Based on "${targetMovie.title}")`;
          }
        }
      } catch (dbError) {
        console.error("Failed to fetch user preferences or recommendations:", dbError);
      }
    }
  }

  // Fetch data through our robust TMDB wrapper which falls back to high-quality mock data
  const [trending, popular, topRated, upcoming, nowPlaying] = await Promise.all([
    getTrending("all", "week"),
    getPopularMovies(),
    getTopRatedMovies(),
    getUpcomingMovies(),
    getNowPlayingMovies(),
  ]);

  // If we have real TMDB results, we can use them.
  // The tmdbFetch wrapper returns the mock results if key is missing or calls fail.
  const trendingList = trending?.results || [];
  const popularList = popular?.results || [];
  const topRatedList = topRated?.results || [];
  const nowPlayingList = nowPlaying?.results || [];
  const upcomingList = upcoming?.results || [];

  const hasApiKey = !!(process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY);

  // Normalize results for the UI
  const normalize = (items: typeof trendingList) => {
    return items.map((m) => ({
      id: m.id,
      title: m.title || m.name || "Untitled",
      poster_path: m.poster_path || null,
      backdrop_path: m.backdrop_path || null,
      vote_average: m.vote_average || 0,
      release_date: m.release_date || m.first_air_date || "",
      genre_ids: m.genre_ids || [],
      overview: m.overview || "",
      media_type: m.media_type || "movie",
    }));
  };

  return (
    <div className="min-h-screen">
      {/* Hero Banner (uses top trending items) */}
      <HeroBanner movies={trendingList} />

      {/* Content Sections */}
      <div className="px-6 py-8 space-y-12 mx-auto" style={{ maxWidth: "var(--container-max)" }}>
        {/* API Key Banner if missing */}
        {!hasApiKey && (
          <div className="p-4 rounded-xl border border-dashed border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <div>
              <p className="font-semibold text-[var(--text-primary)]">✨ Prototyping Mode (Mock Data Active)</p>
              <p className="text-[var(--text-secondary)] mt-1">To load real movies, TV shows, and cast images, add your TMDB API key to <code className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--brand-primary-light)]">.env.local</code></p>
            </div>
            <a
              href="https://www.themoviedb.org/settings/api"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white font-medium shrink-0 transition-colors"
            >
              Get Free API Key
            </a>
          </div>
        )}

        {/* Personalized recommendations section if exists */}
        {personalRecommendations.length > 0 && (
          <section className="p-6 rounded-2xl bg-gradient-to-r from-[var(--brand-primary)]/10 via-[var(--bg-surface)] to-[var(--bg-surface)] border border-[var(--brand-primary)]/20 shadow-md">
            <SectionHeader
              title={recommendationSourceTitle}
              subtitle="Tailored to your viewing preferences"
            />
            <MovieGrid movies={normalize(personalRecommendations)} shuffle limit={6} />
          </section>
        )}

        <section>
          <SectionHeader
            title="🔥 Trending Now"
            subtitle="What everyone is watching this week"
            viewAllHref="/trending"
          />
          <MovieGrid movies={normalize(trendingList)} shuffle limit={12} />
        </section>

        <section>
          <SectionHeader
            title="🍿 Popular Movies"
            subtitle="Top movies people are watching right now"
            viewAllHref="/movies"
          />
          <MovieGrid movies={normalize(popularList)} shuffle limit={6} />
        </section>

        <section>
          <SectionHeader
            title="⭐ Top Rated"
            subtitle="The highest-rated movies of all time"
            viewAllHref="/top-rated"
          />
          <MovieGrid movies={normalize(topRatedList)} shuffle limit={6} />
        </section>

        <section>
          <SectionHeader
            title="🎬 Now Playing"
            subtitle="Currently in theaters"
            viewAllHref="/movies?filter=now_playing"
          />
          <MovieGrid movies={normalize(nowPlayingList)} shuffle limit={6} />
        </section>

        <section>
          <SectionHeader
            title="📅 Coming Soon"
            subtitle="Upcoming movies to add to your watchlist"
            viewAllHref="/upcoming"
          />
          <MovieGrid movies={normalize(upcomingList)} shuffle limit={6} />
        </section>
      </div>
    </div>
  );
}
