"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import MediaActions from "./MediaActions";
import TrailerModal from "./TrailerModal";

interface DetailHeroActionsProps {
  media: {
    id: number;
    title: string;
    poster_path: string | null;
    backdrop_path?: string | null;
    vote_average: number;
    release_date: string;
    media_type: "movie" | "tv";
  };
}

export default function DetailHeroActions({ media }: DetailHeroActionsProps) {
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  const handleWatchTrailer = () => {
    const trailerSection = document.getElementById("watch-trailer-section");
    if (trailerSection) {
      trailerSection.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setIsTrailerOpen(true);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-4">
        {/* Prominent Watch Trailer Button */}
        <button
          onClick={handleWatchTrailer}
          className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-sm shadow-[0_0_20px_rgba(245,197,24,0.35)] hover:shadow-[0_0_25px_rgba(245,197,24,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-amber-300/40 shrink-0"
        >
          <Play className="w-4 h-4 fill-black text-black" />
          <span>Watch Trailer</span>
        </button>

        {/* Standard Media Actions (Watchlist, Rating, Audience score) */}
        <MediaActions media={media} />
      </div>

      {/* Fullscreen Lightbox Trailer Modal */}
      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        title={media.title}
        movieId={media.id}
        backdropPath={media.backdrop_path}
        mediaType={media.media_type}
      />
    </div>
  );
}
