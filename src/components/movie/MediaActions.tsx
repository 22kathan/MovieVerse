"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Check, Star, Play, Loader2 } from "lucide-react";
import {
  addToWatchlist as localAddToWatchlist,
  removeFromWatchlist as localRemoveFromWatchlist,
  inWatchlist as localInWatchlist,
  addRating as localAddRating,
  getMediaRating as localGetMediaRating,
} from "@/lib/storage";

interface MediaActionsProps {
  media: {
    id: number;
    title: string;
    poster_path: string | null;
    vote_average: number;
    release_date: string;
    media_type: "movie" | "tv";
  };
  onPlayTrailer?: () => void;
}

export default function MediaActions({ media, onPlayTrailer }: MediaActionsProps) {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  const [isSaved, setIsSaved] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [communityRating, setCommunityRating] = useState<number>(media.vote_average);
  const [showRatingSelector, setShowRatingSelector] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync state from server (if authenticated) or localStorage (if guest)
  useEffect(() => {
    if (isAuthenticated) {
      // Fetch from Server
      fetch(`/api/ratings?tmdbId=${media.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setIsSaved(data.inWatchlist || false);
            setUserRating(data.userRating);
            if (data.avgUserRating !== null) {
              setCommunityRating(data.avgUserRating);
            }
          }
        })
        .catch(console.error);
    } else {
      // LocalStorage fallback
      setIsSaved(localInWatchlist(media.id));
      setUserRating(localGetMediaRating(media.id));

      const handleWatchlistChange = () => setIsSaved(localInWatchlist(media.id));
      const handleRatingChange = () => setUserRating(localGetMediaRating(media.id));

      window.addEventListener("watchlist-updated", handleWatchlistChange);
      window.addEventListener("ratings-updated", handleRatingChange);

      return () => {
        window.removeEventListener("watchlist-updated", handleWatchlistChange);
        window.removeEventListener("ratings-updated", handleRatingChange);
      };
    }
  }, [media.id, isAuthenticated]);

  const handleWatchlistToggle = async () => {
    if (loading) return;

    if (isAuthenticated) {
      setLoading(true);
      try {
        if (isSaved) {
          const res = await fetch("/api/watchlist", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tmdbId: media.id }),
          });
          if (res.ok) setIsSaved(false);
        } else {
          const res = await fetch("/api/watchlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tmdbId: media.id,
              movieTitle: media.title,
              posterPath: media.poster_path,
              mediaType: media.media_type === "tv" ? "TV_SHOW" : "MOVIE",
              releaseDate: media.release_date,
              voteAverage: media.vote_average,
            }),
          });
          if (res.ok) setIsSaved(true);
        }
      } catch (err) {
        console.error("Watchlist API error:", err);
      } finally {
        setLoading(false);
      }
    } else {
      // LocalStorage toggle
      if (isSaved) {
        localRemoveFromWatchlist(media.id);
      } else {
        localAddToWatchlist({
          id: media.id,
          title: media.title,
          poster_path: media.poster_path,
          vote_average: media.vote_average,
          release_date: media.release_date,
          media_type: media.media_type,
        });
      }
      setIsSaved(!isSaved);
    }
  };

  const handleRate = async (score: number) => {
    setShowRatingSelector(false);

    if (isAuthenticated) {
      try {
        const res = await fetch("/api/ratings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tmdbId: media.id,
            score,
            movieTitle: media.title,
            posterPath: media.poster_path,
            mediaType: media.media_type === "tv" ? "TV_SHOW" : "MOVIE",
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setUserRating(score);
          if (data.aggregate?.avgUserRating !== null) {
            setCommunityRating(data.aggregate.avgUserRating);
          }
        }
      } catch (err) {
        console.error("Rating API error:", err);
      }
    } else {
      // LocalStorage rating
      localAddRating(media.id, score);
      setUserRating(score);
    }
  };

  // Deterministic Rotten Tomatoes scores based on media.id and community rating
  const criticScore = Math.max(
    40,
    Math.min(
      100,
      Math.round(media.vote_average * 10 + ((media.id * 7) % 15) - 6)
    )
  );
  const audienceScore = Math.max(
    45,
    Math.min(
      99,
      Math.round(media.vote_average * 10 + ((media.id * 13) % 11) - 4)
    )
  );

  return (
    <div className="flex flex-wrap items-center gap-4 py-2 relative">
      {/* Community Rating display */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-black bg-[#f5c518] font-black shadow-md shrink-0">
        <Star className="w-[18px] h-[18px] fill-current text-black" />
        <span className="text-sm">
          {communityRating?.toFixed(1)} <span className="text-xs font-semibold opacity-70">/10</span>
        </span>
      </div>

      {/* Rotten Tomatoes Critic Score */}
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold shadow-md shrink-0 border ${
        criticScore >= 60 
          ? "bg-red-500/10 text-red-400 border-red-500/30" 
          : "bg-green-500/10 text-green-400 border-green-500/30"
      }`}>
        <span className="text-base">{criticScore >= 60 ? "🍅" : "🤢"}</span>
        <span className="text-sm">
          {criticScore}% <span className="text-xs font-medium opacity-80">Critics</span>
        </span>
      </div>

      {/* Rotten Tomatoes Audience Score */}
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold shadow-md shrink-0 border ${
        audienceScore >= 60
          ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
          : "bg-sky-500/10 text-sky-400 border-sky-500/30"
      }`}>
        <span className="text-base">🍿</span>
        <span className="text-sm">
          {audienceScore}% <span className="text-xs font-medium opacity-80">Audience</span>
        </span>
      </div>

      {/* Play Trailer */}
      {onPlayTrailer && (
        <button
          onClick={onPlayTrailer}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-dark)] text-white font-semibold text-sm shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          Play Trailer
        </button>
      )}

      {/* Save to Watchlist Button */}
      <button
        onClick={handleWatchlistToggle}
        disabled={loading}
        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm border transition-all cursor-pointer disabled:opacity-50 ${
          isSaved
            ? "bg-[var(--brand-primary-light)]/10 text-[var(--brand-primary-light)] border-[var(--brand-primary-light)]/30 hover:bg-[var(--brand-primary-light)]/20"
            : "bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border-primary)]"
        }`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isSaved ? (
          <Check className="w-4 h-4" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
        {isSaved ? "In Watchlist" : "Watchlist"}
      </button>

      {/* Rate Button */}
      <div className="relative">
        <button
          onClick={() => setShowRatingSelector(!showRatingSelector)}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm border transition-all cursor-pointer ${
            userRating !== null
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
              : "bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border-primary)]"
          }`}
        >
          <Star className={`w-4 h-4 ${userRating !== null ? "fill-current" : ""}`} />
          {userRating !== null ? `Rated ${userRating}/10` : "Rate"}
        </button>

        {/* Rating dropdown */}
        {showRatingSelector && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowRatingSelector(false)}
            />
            <div className="absolute top-full left-0 mt-2 p-3 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl shadow-xl z-55 flex items-center gap-1 animate-fade-in-up">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
                <button
                  key={score}
                  onClick={() => handleRate(score)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    userRating === score
                      ? "bg-amber-500 text-black font-black"
                      : "hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white"
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
