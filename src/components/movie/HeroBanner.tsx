"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Play, Plus, Star, Clock, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { getImageUrl } from "@/lib/tmdb";
import SafeImage from "@/components/shared/SafeImage";

interface HeroMovie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  backdrop_path: string | null;
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
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

export default function HeroBanner({ movies }: { movies: HeroMovie[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [featured, setFeatured] = useState<HeroMovie[]>(() => movies.slice(0, 5));
  const current = featured[currentIndex];

  useEffect(() => {
    const arr = [...movies];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setFeatured(arr.slice(0, 5));
  }, [movies]);

  useEffect(() => {
    if (featured.length === 0) return;
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % featured.length);
        setIsTransitioning(false);
      }, 500); // Wait for fade out, change index, then fade back in
    }, 3500); // Auto-slide in 3.5 seconds when not changed manually
    return () => clearInterval(timer);
  }, [currentIndex, featured.length]);

  if (!current) return null;

  const handlePrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + featured.length) % featured.length);
      setIsTransitioning(false);
    }, 500);
  };

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % featured.length);
      setIsTransitioning(false);
    }, 500);
  };

  const title = current.title || current.name || "";
  const date = current.release_date || current.first_air_date;
  const year = date ? new Date(date).getFullYear() : "";
  const genres = current.genre_ids
    ?.slice(0, 3)
    .map((id) => GENRE_MAP[id])
    .filter(Boolean);
  const mediaType = current.media_type === "tv" ? "tv" : "movies";
  const backdropUrl = getImageUrl(current.backdrop_path, "backdrop", "original");

  return (
    <section className="relative w-full h-[70vh] min-h-[500px] max-h-[700px] overflow-hidden bg-[#0d1321] group">
      {/* Background Image with CSS transition */}
      <div className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${isTransitioning ? "opacity-0" : "opacity-100"}`}>
        <SafeImage
          src={backdropUrl}
          alt={title}
          fallbackType="backdrop"
          fill
          className="object-top"
          priority
          sizes="100vw"
        />
      </div>

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-primary)] via-[var(--bg-primary)]/75 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-[var(--bg-primary)]/30" />

      {/* Content */}
      <div className="relative h-full flex items-center">
        <div className="container mx-auto px-6 max-w-[var(--container-max)]">
          <div className={`max-w-2xl space-y-5 transition-all duration-500 transform ease-in-out ${isTransitioning ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"}`}>
            {/* Genre Tags */}
            {genres && genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {genres.map((g) => (
                  <span
                    key={g}
                    className="px-3 py-1 text-xs font-semibold rounded-full bg-white/10 text-white/90 backdrop-blur-md border border-white/10"
                  >
                    {g}
                  </span>
                ))}
                {year && (
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[var(--brand-primary)]/20 text-[var(--brand-primary-light)] border border-[var(--brand-primary)]/30">
                    {year}
                  </span>
                )}
              </div>
            )}

            {/* Title */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white"
              style={{ fontFamily: "var(--font-display)" }}>
              {title}
            </h2>

            {/* Ratings */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-black bg-[#f5c518] font-bold">
                <Star className="w-4 h-4 fill-current text-black" />
                <span className="text-sm">
                  {current.vote_average?.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-white/70 text-sm">
                <Clock className="w-4 h-4" />
                <span>2h 28m</span>
              </div>
            </div>

            {/* Overview */}
            <p className="text-base text-white/70 leading-relaxed line-clamp-3 max-w-lg">
              {current.overview}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-dark)] text-white font-semibold text-sm shadow-lg shadow-[var(--brand-primary)]/30 hover:shadow-[var(--brand-primary)]/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                <Play className="w-5 h-5 fill-current" />
                Play Trailer
              </button>
              <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white font-medium text-sm border border-white/20 hover:bg-white/20 transition-all duration-200">
                <Plus className="w-5 h-5" />
                Watchlist
              </button>
              <Link
                href={`/${mediaType}/${current.id}`}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 text-white/70 font-medium text-sm hover:bg-white/10 hover:text-white transition-all duration-200"
              >
                <Info className="w-5 h-5" />
                Details
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Indicators & Navigation Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg z-10">
        <button
          onClick={handlePrev}
          className="flex items-center justify-center p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 active:scale-90 transition-all duration-200 cursor-pointer"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          {featured.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (isTransitioning || i === currentIndex) return;
                setIsTransitioning(true);
                setTimeout(() => {
                  setCurrentIndex(i);
                  setIsTransitioning(false);
                }, 500);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? "w-8 bg-[var(--brand-primary)]"
                  : "w-2 bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="flex items-center justify-center p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 active:scale-90 transition-all duration-200 cursor-pointer"
          aria-label="Next slide"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
