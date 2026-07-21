import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Star, Clock, Calendar, Film, Play, Plus, ArrowLeft } from "lucide-react";
import SafeImage from "@/components/shared/SafeImage";
import {
  getMovieDetails,
  getMovieCredits,
  getSimilarMovies,
  getWatchProviders,
  getImageUrl,
  formatRuntime,
  formatReleaseDate,
  getOfficialTrailer,
} from "@/lib/tmdb";
import MovieCard from "@/components/movie/MovieCard";
import DetailHeroActions from "@/components/movie/DetailHeroActions";
import DetailTrailerSection from "@/components/movie/DetailTrailerSection";
import ReviewForm from "@/components/movie/ReviewForm";
import AIReviewSummary from "@/components/movie/AIReviewSummary";
import AISimilarContent from "@/components/movie/AISimilarContent";
import RottenTomatoesSection from "@/components/movie/RottenTomatoesSection";

interface MoviePageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return Array.from({ length: 50 }, (_, i) => ({ id: (i + 1).toString() }));
}

export const dynamicParams = true;

export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const movieId = parseInt(resolvedParams.id);
  try {
    const movie = await getMovieDetails(movieId);
    return {
      title: `${movie.title || "Movie Details"} | MovieVerse`,
      description: movie.overview || "View movie details, ratings, cast, and trailers.",
    };
  } catch {
    return {
      title: "Movie Details | MovieVerse",
    };
  }
}

export default async function MovieDetailsPage({ params }: MoviePageProps) {
  const resolvedParams = await params;
  const movieId = parseInt(resolvedParams.id, 10);

  if (isNaN(movieId) || movieId <= 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="text-5xl">🎬</div>
        <h3 className="text-xl font-bold">Invalid Movie ID</h3>
        <p className="text-[var(--text-secondary)] max-w-md">
          The movie you are looking for does not exist or has an invalid ID.
        </p>
        <Link href="/" className="px-4 py-2 rounded-lg bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-dark)] transition-colors">
          Back to Browse
        </Link>
      </div>
    );
  }

  let movie;
  let credits;
  let providers;
  let similar;

  try {
    [movie, credits, providers, similar] = await Promise.all([
      getMovieDetails(movieId),
      getMovieCredits(movieId),
      getWatchProviders(movieId),
      getSimilarMovies(movieId),
    ]);
  } catch (error) {
    console.error("Error loading movie detail data:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="text-5xl">😭</div>
        <h3 className="text-xl font-bold">Failed to load movie</h3>
        <p className="text-[var(--text-secondary)] max-w-md">
          There was an error loading the movie details. Please try again later.
        </p>
        <Link href="/" className="px-4 py-2 rounded-lg bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-dark)] transition-colors">
          Back to Home
        </Link>
      </div>
    );
  }

  const posterUrl = getImageUrl(movie.poster_path, "poster", "lg");
  const backdropUrl = getImageUrl(movie.backdrop_path, "backdrop", "original");
  const trailer = getOfficialTrailer((movie as any).videos?.results || []);
  const USProviders = providers?.results?.US || providers?.results?.IN || null;

  // Filter directors
  const directors = credits?.crew?.filter((c) => c.job === "Director") || [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Movie",
    "name": movie.title,
    "image": posterUrl,
    "description": movie.overview,
    "datePublished": movie.release_date,
    "duration": movie.runtime ? `PT${movie.runtime}M` : undefined,
    "aggregateRating": movie.vote_average ? {
      "@type": "AggregateRating",
      "ratingValue": movie.vote_average,
      "bestRating": "10",
      "ratingCount": (movie as any).vote_count || 1,
    } : undefined,
    "director": directors.map((d) => ({
      "@type": "Person",
      "name": d.name,
    })),
  };

  return (
    <div className="min-h-screen pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Backdrop Section */}
      <section className="relative w-full h-[40vh] md:h-[50vh] min-h-[300px] max-h-[500px] overflow-hidden bg-[#0a0e17]">
        <SafeImage
          src={backdropUrl}
          alt={movie.title || "Backdrop"}
          fallbackType="backdrop"
          fill
          priority
          className="object-top opacity-55 animate-fade-in"
          sizes="100vw"
        />
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
      <div className="px-4 sm:px-6 mx-auto -mt-32 md:-mt-48 relative z-10 space-y-8 sm:space-y-12" style={{ maxWidth: "var(--container-max)" }}>
        {/* Detail Panel */}
        <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-center md:items-start text-center md:text-left">
          {/* Left: Poster */}
          <div className="w-44 sm:w-60 md:w-72 shrink-0 aspect-[2/3] relative rounded-2xl overflow-hidden shadow-[var(--shadow-card)] border border-white/10 bg-[#121824] mx-auto md:mx-0">
            <SafeImage
              src={posterUrl}
              alt={movie.title || "Poster"}
              fallbackType="poster"
              fill
              sizes="(max-width: 768px) 240px, 300px"
            />
          </div>

          {/* Right: Info */}
          <div className="flex-1 space-y-6 md:pt-16">
            <div className="space-y-2">
              {movie.tagline && (
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary-light)]">
                  {movie.tagline}
                </span>
              )}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight"
                style={{ fontFamily: "var(--font-display)" }}>
                {movie.title}
              </h1>
              
              {/* Meta pills */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs sm:text-sm text-[var(--text-secondary)]">
                {movie.release_date && (
                  <span className="flex items-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] px-3 py-1.5 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-[var(--brand-primary-light)]" />
                    {formatReleaseDate(movie.release_date, "short")}
                  </span>
                )}
                {movie.runtime && (
                  <span className="flex items-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] px-3 py-1.5 rounded-lg">
                    <Clock className="w-3.5 h-3.5 text-[var(--brand-primary-light)]" />
                    {formatRuntime(movie.runtime)}
                  </span>
                )}
                {movie.genres && movie.genres.length > 0 && (
                  <span className="flex items-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] px-3 py-1.5 rounded-lg">
                    {movie.genres.slice(0, 3).map((g) => g.name).join(", ")}
                  </span>
                )}
              </div>
            </div>

            {/* Ratings & Call to actions */}
            <DetailHeroActions
              media={{
                id: movie.id,
                title: movie.title || movie.name || "Untitled",
                poster_path: movie.poster_path,
                backdrop_path: movie.backdrop_path,
                vote_average: movie.vote_average,
                release_date: movie.release_date || movie.first_air_date || "",
                media_type: "movie",
              }}
            />

            {/* Overview */}
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Overview</h3>
              <p className="text-base text-[var(--text-secondary)] leading-relaxed max-w-3xl">
                {movie.overview || "No overview available for this movie."}
              </p>
            </div>

            {/* Key Directors / Writers */}
            {directors.length > 0 && (
              <div className="pt-2 text-sm">
                <span className="font-semibold text-white">Director:</span>{" "}
                <span className="text-[var(--text-secondary)]">
                  {directors.map((d) => d.name).join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Embedded Trailer Video Box */}
        <DetailTrailerSection
          id={movie.id}
          title={movie.title || "Untitled"}
          backdropPath={movie.backdrop_path}
          posterPath={movie.poster_path}
          mediaType="movie"
        />

        {/* Rotten Tomatoes Section */}
        <RottenTomatoesSection
          mediaId={movie.id}
          title={movie.title || "Untitled"}
          voteAverage={movie.vote_average || 7.0}
          releaseDate={movie.release_date}
        />

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
              {USProviders.rent && USProviders.rent.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-[var(--text-secondary)] text-xs uppercase tracking-widest">Rent / Buy</h4>
                  <div className="flex flex-wrap gap-3">
                    {USProviders.rent.map((provider) => {
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
                      <SafeImage
                        src={actorImgUrl}
                        alt={actor.name}
                        fallbackType="profile"
                        fill
                        sizes="(max-width: 640px) 150px, 200px"
                        className="group-hover:scale-105 transition-transform duration-300"
                      />
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

        {/* AI Review Consensus */}
        <AIReviewSummary movieId={movie.id} />

        {/* Review Form & Local Reviews list */}
        <ReviewForm
          mediaId={movie.id}
          mediaTitle={movie.title || movie.name || "Untitled"}
          mediaPoster={movie.poster_path}
          mediaType="movie"
        />

        {/* AI Similar Content Insights */}
        {similar?.results && similar.results.length > 0 && (
          <AISimilarContent
            movieId={movie.id}
            movieTitle={movie.title || "Untitled"}
            genres={movie.genres ? movie.genres.map((g: any) => g.name) : []}
            similarMovies={similar.results.slice(0, 5).map((sim: any) => sim.title || sim.name || "")}
          />
        )}

        {/* Similar Movies Section */}
        {similar?.results && similar.results.length > 0 && (
          <section className="space-y-6">
            <h3 className="text-xl font-bold text-white">🎬 You Might Also Like</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
              {similar.results.slice(0, 6).map((sim, index) => (
                <MovieCard
                  key={sim.id}
                  movie={{
                    id: sim.id,
                    title: sim.title || sim.name || "Untitled",
                    poster_path: sim.poster_path,
                    vote_average: sim.vote_average,
                    release_date: sim.release_date || sim.first_air_date,
                  }}
                  index={index}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
