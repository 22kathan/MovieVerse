"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Plus, Play, Film } from "lucide-react";
import { getImageUrl } from "@/lib/tmdb";
import SafeImage from "@/components/shared/SafeImage";

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
}

const TMDB_IMAGE = "https://image.tmdb.org/t/p";

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

export default function MovieCard({
  movie,
  index = 0,
}: {
  movie: MovieCardData;
  variant?: "default" | "compact" | "wide";
  index?: number;
}) {
  console.log("MovieCard prop:", movie);
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

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
      <Link
        href={`/${mediaType}/${movie.id}`}
        className="group relative block"
      >
        {/* Poster Container */}
        <div
          className="relative aspect-[2/3] rounded-xl overflow-hidden transition-all duration-300 group-hover:-translate-y-1.5"
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
            className="transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
          />

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Rating Badge */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
            style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
            <Star
              className="w-3 h-3"
              style={{ color: getRatingColor(movie.vote_average) }}
              fill="currentColor"
            />
            <span style={{ color: getRatingColor(movie.vote_average) }}>
              {rating}
            </span>
          </div>

          {/* Hover Actions */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
            <div className="flex gap-2">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-white text-xs font-semibold transition-all"
                style={{ backgroundColor: "#6366f1" }}
              >
                <Play className="w-3.5 h-3.5" fill="white" />
                Trailer
              </button>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className="p-2.5 rounded-lg text-white transition-all"
                style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}
                aria-label="Add to watchlist"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Title & Info */}
        <div className="mt-3 space-y-1">
          <h3 className="text-sm font-semibold truncate transition-colors"
            style={{ color: "var(--text-primary)" }}>
            {movie.title}
          </h3>
          <div className="flex items-center gap-2 text-xs"
            style={{ color: "var(--text-tertiary)" }}>
            {year && <span>{year}</span>}
            {genres && genres.length > 0 && (
              <>
                <span className="w-1 h-1 rounded-full" style={{ backgroundColor: "var(--text-muted)" }} />
                <span className="truncate">{genres.join(", ")}</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
