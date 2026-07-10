"use client";

import { useState } from "react";
import MovieCard from "@/components/movie/MovieCard";
import { Star, Film, List, Lock } from "lucide-react";
import Link from "next/link";

interface ProfileTabsProps {
  reviews: any[];
  watchlist: any[];
  lists: any[];
}

export default function ProfileTabs({ reviews, watchlist, lists }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<"watchlist" | "reviews" | "lists">("watchlist");

  return (
    <div className="space-y-6">
      {/* Tabs navigation */}
      <div className="flex border-b border-[var(--border-primary)] gap-4">
        <button
          onClick={() => setActiveTab("watchlist")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "watchlist"
              ? "border-[var(--brand-primary)] text-white"
              : "border-transparent text-[var(--text-secondary)] hover:text-white"
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Watchlist ({watchlist.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "reviews"
              ? "border-[var(--brand-primary)] text-white"
              : "border-transparent text-[var(--text-secondary)] hover:text-white"
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Reviews ({reviews.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("lists")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "lists"
              ? "border-[var(--brand-primary)] text-white"
              : "border-transparent text-[var(--text-secondary)] hover:text-white"
          }`}
        >
          <List className="w-4 h-4" />
          <span>Custom Lists ({lists.length})</span>
        </button>
      </div>

      {/* Tab content */}
      <div className="animate-fade-in-up" style={{ animationDuration: "200ms" }}>
        {activeTab === "watchlist" && (
          <div className="space-y-4">
            {watchlist.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {watchlist.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center bg-[var(--bg-surface)] border border-[var(--border-primary)] border-dashed rounded-2xl text-xs text-[var(--text-muted)] italic">
                Watchlist is empty.
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-4">
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-5 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-2xl space-y-3 hover:border-[var(--border-secondary)] transition duration-200"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-primary)]/50 pb-2">
                      <Link
                        href={`/movies/${rev.movie.tmdbId}`}
                        className="font-bold text-white hover:text-[var(--brand-primary-light)] transition-colors text-sm truncate"
                      >
                        🎬 {rev.movie.title}
                      </Link>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                          <Star className="w-3 h-3 fill-current text-amber-400" />
                          {rev.rating}/10
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] font-medium">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {rev.title && <h4 className="font-bold text-white text-xs sm:text-sm">{rev.title}</h4>}
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                        {rev.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center bg-[var(--bg-surface)] border border-[var(--border-primary)] border-dashed rounded-2xl text-xs text-[var(--text-muted)] italic">
                No reviews posted.
              </div>
            )}
          </div>
        )}

        {activeTab === "lists" && (
          <div className="space-y-4">
            {lists.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {lists.map((list) => (
                  <Link
                    key={list.id}
                    href={`/lists`}
                    className="block p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] hover:border-[var(--brand-primary)]/40 transition duration-200 space-y-2"
                  >
                    <h4 className="font-bold text-white text-sm truncate">{list.name}</h4>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                      {list.description || "No description provided."}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center bg-[var(--bg-surface)] border border-[var(--border-primary)] border-dashed rounded-2xl text-xs text-[var(--text-muted)] italic">
                No lists created yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
