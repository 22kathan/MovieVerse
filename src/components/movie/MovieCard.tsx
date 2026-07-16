"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Plus, Check, Loader2, Play, Film } from "lucide-react";
import { getImageUrl } from "@/lib/tmdb";
import SafeImage from "@/components/shared/SafeImage";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  inWatchlist as checkInWatchlist,
  addToWatchlist as localAddToWatchlist,
  removeFromWatchlist as localRemoveFromWatchlist,
  addAuthWatchlistId,
  removeAuthWatchlistId,
  setDatabaseOfflineCached,
} from "@/lib/storage";

interface MovieCardData {
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
  if (score >= 8) return "0 0 8px rgba(34, 197, 94, 0.3)";
  if (score >= 7) return "0 0 8px rgba(132, 204, 22, 0.3)";
  if (score >= 5) return "0 0 8px rgba(245, 158, 11, 0.3)";
  return "0 0 8px rgba(239, 68, 68, 0.3)";
}

export default function MovieCard({
  movie,
  index = 0,
}: {
  movie: MovieCardData;
  variant?: "default" | "compact" | "wide";
  index?: number;
}) {
  const posterUrl = getImageUrl(movie.poster_path, "poster", "lg");
  const year = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "";
  const rating = movie.vote_average?.toFixed(1);
  const genres = movie.genre_ids
    ?.slice(0, 2)
    .map((id) => GENRE_MAP[id])
    .filter(Boolean);
  const mediaType = movie.media_type === "tv" ? "tv" : "movies";

  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: `${index * 0.06}s` }}>
      <Link
        href={`/${mediaType}/${movie.id}`}
        className="group relative block"
      >
        {/* Poster Container */}
        <div
          className="relative aspect-[2/3] rounded-2xl overflow-hidden transition-all duration-400 group-hover:-translate-y-2"
          style={{
            backgroundColor: "var(--bg-surface)",
            boxShadow: "var(--shadow-card)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "var(--shadow-card-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "var(--shadow-card)";
          }}
        >
          {/* Poster Image or Placeholder */}
          <SafeImage
            src={posterUrl}
            alt={movie.title}
            fallbackType="poster"
            fill
            className="transition-transform duration-600 group-hover:scale-[1.06]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
          />

          {/* Subtle inner border for depth */}
          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.06] pointer-events-none" />

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Rating / Release Status Badges */}
          {movie.countdownText ? (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-600/90 text-white animate-pulse border border-indigo-400/30 backdrop-blur-md shadow-lg shadow-indigo-500/20 z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              <span>{movie.countdownText}</span>
            </div>
          ) : movie.justReleased ? (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 text-white border border-emerald-400/30 backdrop-blur-md shadow-lg shadow-emerald-500/30 z-10 animate-bounce">
              <span>🎉 JUST RELEASED</span>
            </div>
          ) : (
            <div
              className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold z-10"
              style={{
                backgroundColor: "rgba(0,0,0,0.65)",
                backdropFilter: "blur(12px)",
                boxShadow: getRatingGlow(movie.vote_average),
              }}
            >
              <Star
                className="w-3 h-3"
                style={{ color: getRatingColor(movie.vote_average) }}
                fill="currentColor"
              />
              <span style={{ color: getRatingColor(movie.vote_average) }}>
                {rating}
              </span>
            </div>
          )}

          {/* Media type badge */}
          {movie.media_type === "tv" && (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/25 backdrop-blur-sm z-10">
              TV
            </div>
          )}

          {/* Hover Actions — glass panel slides up */}
          <div 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"
          >
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-xs font-semibold transition-all hover:brightness-110 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                }}
              >
                <Play className="w-3.5 h-3.5" fill="white" />
                Trailer
              </button>
              <button
                onClick={handleWatchlistToggle}
                disabled={loading}
                className="p-2.5 rounded-xl text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                style={{
                  backgroundColor: isSaved ? "#6366f1" : "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(8px)",
                  border: isSaved ? "1px solid rgba(99, 102, 241, 0.5)" : "1px solid rgba(255,255,255,0.12)",
                }}
                aria-label={isSaved ? "Remove from watchlist" : "Add to watchlist"}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isSaved ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Title & Info */}
        <div className="mt-3 space-y-1 px-0.5">
          <h3 className="text-sm font-semibold truncate transition-colors group-hover:text-[var(--brand-primary-light)]"
            style={{ color: "var(--text-primary)" }}>
            {movie.title}
          </h3>
          <div className="flex items-center gap-2 text-xs"
            style={{ color: "var(--text-tertiary)" }}>
            {year && <span>{year}</span>}
            {genres && genres.length > 0 && (
              <>
                <span className="w-1 h-1 rounded-full" style={{ backgroundColor: "var(--text-muted)" }} />
                <span className="truncate">{genres.join(" · ")}</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
