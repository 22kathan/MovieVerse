"use client";

import { useEffect, useState } from "react";
import MovieCard from "./MovieCard";

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
}

interface MovieGridProps {
  movies: Movie[];
  shuffle?: boolean;
  limit?: number;
}

export default function MovieGrid({ movies, shuffle = false, limit }: MovieGridProps) {
  const [shuffledMovies, setShuffledMovies] = useState<Movie[]>(() => {
    // Initial state matches server-rendered slice to prevent hydration mismatch
    return limit ? movies.slice(0, limit) : movies;
  });

  useEffect(() => {
    if (shuffle) {
      const arr = [...movies];
      // Fisher-Yates shuffle
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      setShuffledMovies(limit ? arr.slice(0, limit) : arr);
    } else if (limit) {
      setShuffledMovies(movies.slice(0, limit));
    } else {
      setShuffledMovies(movies);
    }
  }, [movies, shuffle, limit]);

  if (!shuffledMovies || shuffledMovies.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-[var(--text-secondary)]">
        No movies found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
      {shuffledMovies.map((movie, index) => (
        <MovieCard key={movie.id} movie={movie} index={index} />
      ))}
    </div>
  );
}

