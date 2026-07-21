"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Plus, Check, Loader2, Play, Film, Eye, X, Info, ExternalLink, Calendar } from "lucide-react";
import { getImageUrl } from "@/lib/tmdb";
import SafeImage from "@/components/shared/SafeImage";
import { useSession } from "next-auth/react";
import TrailerModal from "./TrailerModal";
import {
  inWatchlist as checkInWatchlist,
  addToWatchlist as localAddToWatchlist,
  removeFromWatchlist as localRemoveFromWatchlist,
  addAuthWatchlistId,
  removeAuthWatchlistId,
  setDatabaseOfflineCached,
} from "@/lib/storage";

export interface MovieCardData {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  vote_average: number;
  release_date?: string;
  genre_ids?: number[];
  overview?: string;
  media_type?: string;
  countdownText?: string;
  justReleased?: boolean;
}

const GENRE_MAP: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 10770: "TV Movie",
  53: "Thriller", 10752: "War", 37: "Western",
};

function getRatingColor(score: number): string {
  if (score >= 8) return "#22c55e";
  if (score >= 7) return "#84cc16";
  if (score >= 5) return "#f59e0b";
  return "#ef4444";
}

function getRatingGlow(score: number): string {
  if (score >= 8) return "0 0 10px rgba(34, 197, 94, 0.35)";
  if (score >= 7) return "0 0 10px rgba(132, 204, 22, 0.35)";
  if (score >= 5) return "0 0 10px rgba(245, 158, 11, 0.35)";
  return "0 0 10px rgba(239, 68, 68, 0.35)";
}

/** Circular SVG rating indicator */
function RatingRing({ score }: { score: number }) {
  const percentage = (score / 10) * 100;
  const circumference = 2 * Math.PI * 16;
  const offset = circumference - (percentage / 100) * circumference;
  const color = getRatingColor(score);

  return (
    <div
      className="relative w-10 h-10 flex items-center justify-center"
      style={{ filter: `drop-shadow(${getRatingGlow(score)})` }}
    >
      <svg className="rating-ring w-10 h-10" viewBox="0 0 36 36">
        <circle
          cx="18" cy="18" r="16"
          fill="rgba(0,0,0,0.7)"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="2.5"
        />
        <circle
          cx="18" cy="18" r="16"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="ring-progress"
          style={{ strokeLinecap: "round" }}
        />
      </svg>
      <span
        className="absolute text-[10px] font-bold"
        style={{ color }}
      >
        {score.toFixed(1)}
      </span>
    </div>
  );
}

export default function MovieCard({
  movie,
  variant = "default",
  index = 0,
  hideDetails = false,
}: {
  movie: MovieCardData;
  variant?: "default" | "compact" | "wide";
  index?: number;
  hideDetails?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const posterUrl = getImageUrl(movie.poster_path, "poster", "lg");
  const year = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "";
  const genres = movie.genre_ids
    ?.slice(0, 2)
    .map((id) => GENRE_MAP[id])
    .filter(Boolean);
  const mediaType = movie.media_type === "tv" ? "tv" : "movies";

  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsSaved(checkInWatchlist(movie.id, isAuthenticated));

    const handleWatchlistChange = () => {
      setIsSaved(checkInWatchlist(movie.id, isAuthenticated));
    };

    window.addEventListener("watchlist-updated", handleWatchlistChange);
    return () => {
      window.removeEventListener("watchlist-updated", handleWatchlistChange);
    };
  }, [movie.id, isAuthenticated]);

  const handleWatchlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;

    if (isAuthenticated) {
      setLoading(true);
      try {
        if (isSaved) {
          const res = await fetch("/api/watchlist", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tmdbId: movie.id }),
          });
          if (res.ok) {
            removeAuthWatchlistId(movie.id);
          } else {
            setDatabaseOfflineCached(true);
            localRemoveFromWatchlist(movie.id);
          }
        } else {
          const res = await fetch("/api/watchlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tmdbId: movie.id,
              movieTitle: movie.title,
              posterPath: movie.poster_path,
              mediaType: movie.media_type === "tv" ? "TV_SHOW" : "MOVIE",
              releaseDate: movie.release_date,
              voteAverage: movie.vote_average,
            }),
          });
          if (res.ok) {
            addAuthWatchlistId(movie.id);
          } else {
            setDatabaseOfflineCached(true);
            localAddToWatchlist({
              id: movie.id,
              title: movie.title,
              poster_path: movie.poster_path,
              vote_average: movie.vote_average,
              release_date: movie.release_date || "",
              media_type: movie.media_type === "tv" ? "tv" : "movie",
            });
          }
        }
      } catch (err) {
        console.error("Watchlist API error:", err);
        setDatabaseOfflineCached(true);
        if (isSaved) {
          localRemoveFromWatchlist(movie.id);
        } else {
          localAddToWatchlist({
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            vote_average: movie.vote_average,
            release_date: movie.release_date || "",
            media_type: movie.media_type === "tv" ? "tv" : "movie",
          });
        }
      } finally {
        setLoading(false);
      }
    } else {
      if (isSaved) {
        localRemoveFromWatchlist(movie.id);
      } else {
        localAddToWatchlist({
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          vote_average: movie.vote_average,
          release_date: movie.release_date || "",
          media_type: movie.media_type === "tv" ? "tv" : "movie",
        });
      }
    }
  };

  const backdropUrl = getImageUrl(movie.backdrop_path || movie.poster_path, "backdrop", "lg");

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: `${index * 0.06}s` }}>
      <Link
        href={`/${mediaType}/${movie.id}`}
        className={`group relative block ${variant === "wide" ? "flex gap-4 items-center" : ""}`}
      >
        {/* Poster Container with Spotlight Effect */}
        <div
          className={`relative rounded-2xl overflow-hidden spotlight-hover ${
            variant === "wide" ? "w-32 aspect-[2/3] shrink-0" : "aspect-[2/3] w-full"
          }`}
          style={{
            backgroundColor: "var(--bg-surface)",
            boxShadow: "var(--shadow-card)",
            transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "var(--shadow-card-hover)";
            e.currentTarget.style.transform = "translateY(-6px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "var(--shadow-card)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {/* Poster Image or Placeholder */}
          <SafeImage
            src={posterUrl}
            alt={movie.title}
            fallbackType="poster"
            fill
            className="transition-transform duration-600 group-hover:scale-[1.08]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
          />

          {/* Subtle inner border for depth */}
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.06] pointer-events-none" />

          {/* Cinematic gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

          {/* Rating & Release Status Badges */}
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
            <RatingRing score={movie.vote_average} />
            {movie.justReleased && (
              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-black shadow-md">
                NEW
              </span>
            )}
          </div>

          {movie.countdownText && (
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-extrabold bg-[#f5c518] text-black shadow-md border border-amber-300/40 backdrop-blur-md z-10">
              <span className="truncate max-w-[90px]">{movie.countdownText}</span>
            </div>
          )}

          {/* Media type badge */}
          {movie.media_type === "tv" && (
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/25 backdrop-blur-md z-10">
              TV Series
            </div>
          )}

          {/* Quick Preview Badge Button on top right */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowPreview(true);
            }}
            className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-black/60 hover:bg-amber-500 hover:text-black text-white border border-white/20 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 cursor-pointer shadow-lg hover:scale-110"
            title="Quick Preview"
            aria-label="Quick Preview"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Hover Actions — glass panel slides up */}
          <div 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="absolute bottom-0 left-0 right-0 p-2.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-10"
          >
            <div className="flex gap-1.5">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowTrailer(true);
                }}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-white text-[11px] font-bold transition-all hover:brightness-110 active:scale-95 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  boxShadow: "0 4px 16px rgba(245, 158, 11, 0.35)",
                }}
              >
                <Play className="w-3 h-3 fill-black text-black" />
                <span>Trailer</span>
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowPreview(true);
                }}
                className="p-2 rounded-xl text-white bg-white/10 hover:bg-white/25 border border-white/15 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
                title="Quick View"
                aria-label="Quick View"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleWatchlistToggle}
                disabled={loading}
                className="p-2 rounded-xl text-white transition-all hover:scale-110 active:scale-95 disabled:opacity-50 cursor-pointer"
                style={{
                  backgroundColor: isSaved ? "#6366f1" : "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(8px)",
                  border: isSaved ? "1px solid rgba(99, 102, 241, 0.5)" : "1px solid rgba(255,255,255,0.15)",
                  boxShadow: isSaved ? "0 4px 12px rgba(99, 102, 241, 0.3)" : "none",
                }}
                aria-label={isSaved ? "Remove from watchlist" : "Add to watchlist"}
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isSaved ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Title & Info */}
        {!hideDetails && (
          <div className="mt-3 space-y-1.5 px-0.5 flex-1">
            <h3 className="text-sm font-semibold truncate transition-colors duration-300 group-hover:text-[var(--brand-primary-light)]"
              style={{ color: "var(--text-primary)" }}>
              {movie.title}
            </h3>
            <div className="flex items-center gap-2 text-xs"
              style={{ color: "var(--text-tertiary)" }}>
              {year && <span className="font-medium">{year}</span>}
              {genres && genres.length > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full" style={{ backgroundColor: "var(--text-muted)" }} />
                  <span className="truncate">{genres.join(" · ")}</span>
                </>
              )}
            </div>
          </div>
        )}
      </Link>

      {/* Quick Preview Modal with Portal */}
      {showPreview && mounted && createPortal(
        <AnimatePresence>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreview(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl bg-[#12141d] rounded-2xl border border-amber-500/30 overflow-hidden shadow-2xl z-10"
            >
              {/* Backdrop Header */}
              <div className="relative h-48 sm:h-64 w-full bg-black/60">
                <SafeImage
                  src={backdropUrl}
                  alt={movie.title}
                  fill
                  fallbackType="backdrop"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#12141d] via-[#12141d]/40 to-transparent" />
                <button
                  onClick={() => setShowPreview(false)}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-black/60 text-white hover:bg-amber-500 hover:text-black border border-white/20 transition-all z-10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-6 right-6 flex items-end gap-4">
                  <div className="relative w-20 h-30 sm:w-24 sm:h-36 rounded-xl overflow-hidden shadow-2xl border border-white/20 shrink-0 bg-black">
                    <SafeImage src={posterUrl} alt={movie.title} fill fallbackType="poster" />
                  </div>
                  <div className="space-y-1.5 pb-1">
                    <div className="flex items-center gap-2">
                      <RatingRing score={movie.vote_average} />
                      {year && (
                        <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-white font-semibold text-xs border border-white/10">
                          {year}
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-bold text-xs border border-amber-500/30 uppercase">
                        {movie.media_type === "tv" ? "TV Series" : "Movie"}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                      {movie.title}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 text-xs sm:text-sm text-[var(--text-secondary)]">
                {genres && genres.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {genres.map((g) => (
                      <span
                        key={g}
                        className="px-2.5 py-1 rounded-lg bg-amber-400/10 text-amber-400 font-bold text-xs border border-amber-400/20"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                <p className="leading-relaxed text-white/80 line-clamp-4">
                  {movie.overview || "Explore detailed rating analysis, full cast list, reviews, and streaming platforms on MovieVerse."}
                </p>

                {/* Actions */}
                <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      setShowPreview(false);
                      setShowTrailer(true);
                    }}
                    className="flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-black font-extrabold text-xs transition-all hover:brightness-110 shadow-lg cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #f5c518, #e5a900)" }}
                  >
                    <Play className="w-4 h-4 fill-black text-black" />
                    <span>Watch Trailer</span>
                  </button>

                  <button
                    onClick={handleWatchlistToggle}
                    disabled={loading}
                    className="flex items-center gap-2 py-3 px-4 rounded-xl text-white font-bold text-xs border transition-all cursor-pointer"
                    style={{
                      backgroundColor: isSaved ? "#6366f1" : "rgba(255,255,255,0.08)",
                      borderColor: isSaved ? "#6366f1" : "rgba(255,255,255,0.15)",
                    }}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isSaved ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>{isSaved ? "In Watchlist" : "Add Watchlist"}</span>
                  </button>

                  <Link
                    href={`/${mediaType}/${movie.id}`}
                    onClick={() => setShowPreview(false)}
                    className="flex items-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/10 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Full Details</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      {/* Trailer Modal Lightbox */}
      {showTrailer && (
        <TrailerModal
          isOpen={showTrailer}
          onClose={() => setShowTrailer(false)}
          title={movie.title}
          backdropPath={movie.backdrop_path}
          movieId={movie.id}
          mediaType={movie.media_type === "tv" ? "tv" : "movie"}
        />
      )}
    </div>
  );
}
