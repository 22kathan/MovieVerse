import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Star, Clock, Calendar, Film, Play, Plus, ArrowLeft } from "lucide-react";
import {
  getTVShowDetails,
  getTVShowCredits,
  getTVWatchProviders,
  getImageUrl,
  formatReleaseDate,
  getOfficialTrailer,
  getSimilarTVShows,
} from "@/lib/tmdb";
import MovieCard from "@/components/movie/MovieCard";
import MediaActions from "@/components/movie/MediaActions";
import ReviewForm from "@/components/movie/ReviewForm";
import AIReviewSummary from "@/components/movie/AIReviewSummary";

interface TVPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return Array.from({ length: 80 }, (_, i) => ({ id: (i + 1).toString() }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: TVPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const tvId = parseInt(resolvedParams.id);
  try {
    const show = await getTVShowDetails(tvId);
    return {
      title: `${show.name || "TV Show Details"} | MovieVerse`,
      description: show.overview || "View show details, ratings, cast, and trailers.",
    };
  } catch {
    return {
      title: "TV Show Details | MovieVerse",
    };
  }
}

export default async function TVShowDetailsPage({ params }: TVPageProps) {
  const resolvedParams = await params;
  const tvId = parseInt(resolvedParams.id);

  let show;
  let credits;
  let providers;
  let similar;

  try {
    [show, credits, providers, similar] = await Promise.all([
      getTVShowDetails(tvId),
      getTVShowCredits(tvId),
      getTVWatchProviders(tvId),
      getSimilarTVShows(tvId),
    ]);
  } catch (error) {
    console.error("Error loading TV show detail data:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="text-5xl">😭</div>
        <h3 className="text-xl font-bold">Failed to load TV show</h3>
        <p className="text-[var(--text-secondary)] max-w-md">
          There was an error loading the TV show details. Please try again later.
        </p>
        <Link href="/" className="px-4 py-2 rounded-lg bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-dark)] transition-colors">
          Back to Home
        </Link>
      </div>
    );
  }

  const posterUrl = getImageUrl(show.poster_path, "poster", "lg");
  const backdropUrl = getImageUrl(show.backdrop_path, "backdrop", "original");
  const trailer = getOfficialTrailer((show as any).videos?.results || []);
  const USProviders = providers?.results?.US || providers?.results?.IN || null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    "name": show.name,
    "image": posterUrl,
    "description": show.overview,
    "startDate": show.first_air_date,
    "numberOfSeasons": show.number_of_seasons,
    "numberOfEpisodes": show.number_of_episodes,
    "aggregateRating": show.vote_average ? {
      "@type": "AggregateRating",
      "ratingValue": show.vote_average,
      "bestRating": "10",
      "ratingCount": (show as any).vote_count || 1,
    } : undefined,
  };

  return (
    <div className="min-h-screen pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Backdrop Section */}
      <section className="relative w-full h-[40vh] md:h-[50vh] min-h-[300px] max-h-[500px] overflow-hidden bg-[#0a0e17]">
        {backdropUrl ? (
          <Image
            src={backdropUrl}
            alt={show.name || "Backdrop"}
            fill
            priority
            className="object-cover object-top opacity-55 animate-fade-in"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a2238] via-[#0a0e17] to-[#2d122e]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/40 to-transparent" />
        
        {/* Floating Back Button */}
        <Link
          href="/"
          className="absolute top-6 left-6 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md text-white/95 text-xs font-semibold hover:bg-black/80 hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Browse
        </Link>
      </section>

      {/* Main Container */}
      <div className="px-6 mx-auto -mt-32 md:-mt-48 relative z-10 space-y-12" style={{ maxWidth: "var(--container-max)" }}>
        {/* Detail Panel */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Left: Poster */}
          <div className="w-48 sm:w-60 md:w-72 shrink-0 aspect-[2/3] relative rounded-2xl overflow-hidden shadow-[var(--shadow-card)] border border-white/5 bg-[#121824]">
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={show.name || "Poster"}
                fill
                sizes="(max-width: 768px) 240px, 300px"
                className="object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Film className="w-12 h-12 text-[var(--text-muted)]" />
                <span className="text-xs text-[var(--text-secondary)] px-4 text-center">No Poster Available</span>
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="flex-1 space-y-6 md:pt-16">
            <div className="space-y-2">
              {show.tagline && (
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary-light)]">
                  {show.tagline}
                </span>
              )}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight"
                style={{ fontFamily: "var(--font-display)" }}>
                {show.name}
              </h1>
              
              {/* Meta pills */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs sm:text-sm text-[var(--text-secondary)]">
                {show.first_air_date && (
                  <span className="flex items-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] px-3 py-1.5 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-[var(--brand-primary-light)]" />
                    First Aired: {formatReleaseDate(show.first_air_date, "short")}
                  </span>
                )}
                {show.number_of_seasons && (
                  <span className="flex items-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] px-3 py-1.5 rounded-lg">
                    {show.number_of_seasons} Seasons ({show.number_of_episodes} Episodes)
                  </span>
                )}
                {show.genres && show.genres.length > 0 && (
                  <span className="flex items-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] px-3 py-1.5 rounded-lg">
                    {show.genres.slice(0, 3).map((g) => g.name).join(", ")}
                  </span>
                )}
              </div>
            </div>

            {/* Ratings & Call to actions */}
            <MediaActions
              media={{
                id: show.id,
                title: show.name || show.title || "Untitled",
                poster_path: show.poster_path,
                vote_average: show.vote_average,
                release_date: show.first_air_date || show.release_date || "",
                media_type: "tv",
              }}
            />

            {/* Overview */}
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Overview</h3>
              <p className="text-base text-[var(--text-secondary)] leading-relaxed max-w-3xl">
                {show.overview || "No overview available for this show."}
              </p>
            </div>
          </div>
        </div>

        {/* Watch Providers Section */}
        {USProviders && (
          <section className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📺</span> Where to Watch
            </h3>
            <div className="flex flex-wrap gap-8 text-sm">
              {USProviders.flatrate && USProviders.flatrate.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-[var(--text-secondary)] text-xs uppercase tracking-widest">Stream</h4>
                  <div className="flex flex-wrap gap-3">
                    {USProviders.flatrate.map((provider) => {
                      const logoUrl = getImageUrl(provider.logo_path, "logo", "sm");
                      return (
                        <div
                          key={provider.provider_id}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]/85 hover:border-[var(--border-secondary)] transition-all duration-200 group"
                        >
                          <div className="w-7 h-7 relative rounded-lg overflow-hidden border border-white/5 shadow-sm bg-black/20 shrink-0">
                            {logoUrl ? (
                              <Image
                                src={logoUrl}
                                alt={provider.provider_name}
                                fill
                                sizes="28px"
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                                {provider.provider_name[0]}
                              </div>
                            )}
                          </div>
                          <span className="font-semibold text-xs text-[var(--text-primary)] group-hover:text-white transition-colors">
                            {provider.provider_name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Cast List */}
        {credits?.cast && credits.cast.length > 0 && (
          <section className="space-y-5">
            <h3 className="text-xl font-bold text-white">🎭 Top Billed Cast</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {credits.cast.slice(0, 6).map((actor) => {
                const actorImgUrl = getImageUrl(actor.profile_path, "profile", "md");
                return (
                  <Link href={`/celebrities/${actor.id}`} key={actor.id} className="bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl overflow-hidden group hover:border-[var(--border-secondary)] transition-all block">
                    <div className="aspect-square relative bg-[#121824]">
                      {actorImgUrl ? (
                        <Image
                          src={actorImgUrl}
                          alt={actor.name}
                          fill
                          sizes="(max-width: 640px) 150px, 200px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-5xl opacity-40">👤</div>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="font-bold text-white text-sm truncate group-hover:text-[var(--brand-primary-light)] transition-colors">{actor.name}</h4>
                      <p className="text-[var(--text-secondary)] text-xs truncate mt-0.5">{actor.character}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Video / Trailer Embed */}
        {trailer && (
          <section className="space-y-5">
            <h3 className="text-xl font-bold text-white">🎥 Official Trailer</h3>
            <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative bg-[#0a0e17]">
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}`}
                title={show.name || "Trailer"}
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>
          </section>
        )}

        {/* Similar TV Shows Section */}
        {similar?.results && similar.results.length > 0 && (
          <section className="space-y-6">
            <h3 className="text-xl font-bold text-white">🎬 You Might Also Like</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {similar.results.slice(0, 6).map((item) => (
                <MovieCard key={item.id} movie={{ ...item, title: item.name || item.title || "", media_type: "tv" }} />
              ))}

            </div>
          </section>
        )}

        {/* AI Review Consensus */}
        <AIReviewSummary movieId={show.id} />

        {/* Review Form & Local Reviews list */}
        <ReviewForm
          mediaId={show.id}
          mediaTitle={show.name || show.title || "Untitled"}
          mediaPoster={show.poster_path}
          mediaType="tv"
        />
      </div>
    </div>
  );
}
