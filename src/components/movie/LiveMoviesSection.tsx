"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import MovieCard from "./MovieCard";
import SectionHeader from "@/components/shared/SectionHeader";

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
  initialNowPlaying: Movie[];
  initialUpcoming: Movie[];
}

export default function LiveMoviesSection({
  initialNowPlaying,
  initialUpcoming,
}: LiveMoviesSectionProps) {
  // Sort initial Now Playing movies by release date descending
  const sortedInitialNowPlaying = [...initialNowPlaying].sort((a, b) => {
    const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
    const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
    return dateB - dateA;
  });

  const [nowPlaying, setNowPlaying] = useState<Movie[]>(sortedInitialNowPlaying);
  const [upcoming, setUpcoming] = useState<Movie[]>(initialUpcoming);

  // Helper to format remaining time or static release date
  const getCountdownText = (releaseDateStr: string | undefined): string => {
    if (!releaseDateStr) return "";
    const releaseTime = new Date(releaseDateStr).getTime();
    const now = Date.now();
    const diff = releaseTime - now;

    if (diff <= 0) return "";

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 3) {
      const relDate = new Date(releaseDateStr);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[relDate.getMonth()]} ${relDate.getDate()}, ${relDate.getFullYear()}`;
    } else if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else {
      return `${minutes}m ${seconds % 60}s`;
    }
  };

  // Sync effect: Auto-checks and transitions movies to Now Playing silently in the background
  useEffect(() => {
    const checkAndTransitionMovies = () => {
      const now = Date.now();

      setUpcoming((prevUpcoming) => {
        const toRelease: Movie[] = [];
        const stillUpcoming: Movie[] = [];

        prevUpcoming.forEach((movie) => {
          if (movie.release_date) {
            const releaseTime = new Date(movie.release_date).getTime();
            if (releaseTime <= now) {
              toRelease.push({
                ...movie,
                justReleased: true,
                countdownText: undefined,
              });
            } else {
              stillUpcoming.push({
                ...movie,
                countdownText: getCountdownText(movie.release_date),
              });
            }
          } else {
            stillUpcoming.push(movie);
          }
        });

        if (toRelease.length > 0) {
          setNowPlaying((prevNowPlaying) => {
            // Avoid duplicates
            const ids = new Set(prevNowPlaying.map((m) => m.id));
            const filteredToRelease = toRelease.filter((m) => !ids.has(m.id));
            const combined = [...filteredToRelease, ...prevNowPlaying];
            // Sort by release date descending
            return combined.sort((a, b) => {
              const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
              const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
              return dateB - dateA;
            });
          });
          return stillUpcoming;
        }

        // Just update countdown texts if they have changed
        const hasChanged = prevUpcoming.some((m) => {
          const newText = getCountdownText(m.release_date);
          return m.countdownText !== newText;
        });

        if (hasChanged) {
          return prevUpcoming.map((m) => ({
            ...m,
            countdownText: getCountdownText(m.release_date),
          }));
        }

        return prevUpcoming;
      });
    };

    // Run initial check on mount
    checkAndTransitionMovies();

    // Dynamically check in the background every 10 seconds for real-time transitions
    const interval = setInterval(checkAndTransitionMovies, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-12">
      {/* Now Playing Section */}
      <section>
        <SectionHeader
          title="🎬 Now Playing"
          subtitle="Currently in theaters"
          viewAllHref="/movies?filter=now_playing"
        />
        {nowPlaying.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
            <AnimatePresence initial={false}>
              {nowPlaying.slice(0, 6).map((movie, index) => (
                <motion.div
                  key={movie.id}
                  layoutId={`movie-card-${movie.id}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <MovieCard movie={movie} index={index} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-[var(--text-secondary)]">
            No movies found
          </div>
        )}
      </section>

      {/* Coming Soon Section */}
      <section>
        <SectionHeader
          title="📅 Coming Soon"
          subtitle="Upcoming movies to add to your watchlist"
          viewAllHref="/upcoming"
        />
        {upcoming.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
            <AnimatePresence initial={false}>
              {upcoming.slice(0, 6).map((movie, index) => (
                <motion.div
                  key={movie.id}
                  layoutId={`movie-card-${movie.id}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <MovieCard movie={movie} index={index} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-[var(--text-secondary)]">
            No upcoming movies
          </div>
        )}
      </section>
    </div>
  );
}
