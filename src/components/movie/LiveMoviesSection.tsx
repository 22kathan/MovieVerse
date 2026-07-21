"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import MovieCard from "./MovieCard";
import SectionHeader from "@/components/shared/SectionHeader";
import TrailerModal from "./TrailerModal";

interface Movie {
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

interface LiveMoviesSectionProps {
  initialNowPlaying?: Movie[];
  initialUpcoming: Movie[];
}

export default function LiveMoviesSection({
  initialUpcoming,
}: LiveMoviesSectionProps) {
  const [upcoming, setUpcoming] = useState<Movie[]>(initialUpcoming);
  const [activeTrailerMovie, setActiveTrailerMovie] = useState<Movie | null>(null);

  // Helper to format release date badge
  const getCountdownText = (movie: Movie): string => {
    if (!movie.release_date) return "SOON";
    const relDate = new Date(movie.release_date);
    if (isNaN(relDate.getTime())) return "SOON";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[relDate.getMonth()]} ${relDate.getFullYear()}`;
  };

  useEffect(() => {
    setUpcoming((prevUpcoming) => {
      return prevUpcoming.map((m) => ({
        ...m,
        countdownText: getCountdownText(m),
        justReleased: false,
      }));
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Coming Soon Section */}
      <section className="space-y-4">
        <SectionHeader
          title="📅 Coming Soon"
          subtitle="Most anticipated theatrical & streaming releases"
          viewAllHref="/upcoming"
        />

        {upcoming && upcoming.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
            <AnimatePresence initial={false}>
              {upcoming.slice(0, 6).map((movie, index) => (
                <motion.div
                  key={movie.id}
                  layoutId={`upcoming-card-${movie.id}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <MovieCard movie={movie} index={index} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-[var(--text-secondary)] font-semibold text-sm">
            No upcoming releases available right now.
          </div>
        )}
      </section>

      {/* Trailer Modal */}
      {activeTrailerMovie && (
        <TrailerModal
          isOpen={!!activeTrailerMovie}
          onClose={() => setActiveTrailerMovie(null)}
          title={activeTrailerMovie.title}
          backdropPath={activeTrailerMovie.backdrop_path}
          movieId={activeTrailerMovie.id}
          mediaType={activeTrailerMovie.media_type === "tv" ? "tv" : "movie"}
        />
      )}
    </div>
  );
}
