"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { getWatchlist as localGetWatchlist, removeFromWatchlist as localRemoveFromWatchlist } from "@/lib/storage";
import SectionHeader from "@/components/shared/SectionHeader";
import { getImageUrl } from "@/lib/tmdb";
import { Film, Trash2, Star, Calendar, Loader2 } from "lucide-react";

export default function WatchlistPage() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  const [mounted, setMounted] = useState(false);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServerWatchlist = async () => {
    try {
      const res = await fetch("/api/watchlist");
      if (res.ok) {
        const data = await res.json();
        // Normalize server items to match localStorage format
        const items = (data.items || []).map((item: any) => ({
          id: item.movie.tmdbId,
          title: item.movie.title,
          poster_path: item.movie.posterPath,
          vote_average: item.movie.voteAverage,
          release_date: item.movie.releaseDate,
          media_type: item.movie.mediaType === "TV_SHOW" ? "tv" : "movie",
        }));
        setWatchlist(items);
      }
    } catch (err) {
      console.error("Error fetching watchlist:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated) {
      fetchServerWatchlist();
    } else {
      setWatchlist(localGetWatchlist());
      setLoading(false);

      const handleWatchlistChange = () => {
        setWatchlist(localGetWatchlist());
      };

      window.addEventListener("watchlist-updated", handleWatchlistChange);
      return () => {
        window.removeEventListener("watchlist-updated", handleWatchlistChange);
      };
    }
  }, [isAuthenticated]);

  const handleRemove = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAuthenticated) {
      try {
        const res = await fetch("/api/watchlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tmdbId: id }),
        });
        if (res.ok) {
          setWatchlist(watchlist.filter((item) => item.id !== id));
        }
      } catch (err) {
        console.error("Error removing from watchlist:", err);
      }
    } else {
      localRemoveFromWatchlist(id);
      setWatchlist(watchlist.filter((item) => item.id !== id));
    }
  };

  if (!mounted) {
    return (
      <div className="px-6 py-8 space-y-8 mx-auto min-h-screen" style={{ maxWidth: "var(--container-max)" }}>
        <SectionHeader title="My Watchlist" subtitle="Your saved movies and TV shows" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] w-full rounded-2xl bg-[var(--bg-surface)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 space-y-8 mx-auto min-h-screen" style={{ maxWidth: "var(--container-max)" }}>
      <div>
        <SectionHeader
          title="🔖 My Watchlist"
          subtitle={
            watchlist.length > 0
              ? `You have saved ${watchlist.length} titles to watch later`
              : "Keep track of movies and TV shows you want to watch"
          }
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-[var(--brand-primary-light)] animate-spin" />
        </div>
      ) : watchlist.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {watchlist.map((item) => {
            const posterUrl = getImageUrl(item.poster_path, "poster", "md");
            const detailUrl = item.media_type === "tv" ? `/tv/${item.id}` : `/movies/${item.id}`;

            return (
              <div
                key={item.id}
                className="group relative flex flex-col bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-2xl overflow-hidden shadow-[var(--shadow-card)] hover:border-[var(--border-secondary)] transition-all duration-300"
              >
                <Link href={detailUrl} className="block relative aspect-[2/3] w-full bg-[#121824] overflow-hidden">
                  {posterUrl ? (
                    <Image
                      src={posterUrl}
                      alt={item.title || "Poster"}
                      fill
                      sizes="(max-width: 640px) 150px, (max-width: 1024px) 240px, 300px"
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--text-muted)] bg-[var(--bg-surface)]">
                      <Film className="w-10 h-10 stroke-[1.5]" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">No Image</span>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/15">
                      {item.media_type}
                    </span>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => handleRemove(e, item.id)}
                    className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-black/60 backdrop-blur-md text-white/80 hover:text-[var(--error)] hover:bg-black/90 transition-all z-20 cursor-pointer border border-white/10"
                    title="Remove from Watchlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </Link>

                {/* Details */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                  <Link href={detailUrl} className="block group/title">
                    <h3 className="font-bold text-white text-xs sm:text-sm line-clamp-1 group-hover/title:text-[var(--brand-primary-light)] transition-colors">
                      {item.title}
                    </h3>
                  </Link>

                  <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] font-medium">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                      <span>{item.vote_average?.toFixed(1) || "N/A"}</span>
                    </div>
                    {item.release_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[var(--text-muted)]" />
                        <span>{String(item.release_date).split("-")[0]}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="text-6xl">🍿</div>
          <h3 className="text-xl font-bold text-white">Your watchlist is empty</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm">
            Explore movies and TV shows and tap the "+ Watchlist" button to add them here.
          </p>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-dark)] text-white font-semibold text-xs shadow-md hover:scale-[1.01] transition-all"
          >
            Find Something to Watch
          </Link>
        </div>
      )}
    </div>
  );
}
