"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, MessageSquare, Plus, UserPlus, Clock, Loader2, ArrowRight } from "lucide-react";

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  icon: string;
  link: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  createdAt: string;
  metadata: any;
}

interface ActivityFeedProps {
  initialType?: "social" | "personal" | "global";
}

export default function ActivityFeed({ initialType = "global" }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [feedType, setFeedType] = useState<"social" | "personal" | "global">(initialType);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivity = async (reset = false) => {
    setLoading(true);
    const nextPage = reset ? 1 : page;
    try {
      const res = await fetch(`/api/activity/feed?page=${nextPage}&limit=10&type=${feedType}`);
      if (res.ok) {
        const data = await res.json();
        if (reset) {
          setActivities(data.activities);
        } else {
          setActivities((prev) => [...prev, ...data.activities]);
        }
        setHasMore(data.hasMore);
        setPage(nextPage + 1);
      }
    } catch (error) {
      console.error("Failed to fetch activity:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity(true);
  }, [feedType]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchActivity();
    }
  };

  // Helper for formatting date to relative string
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHrs / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHrs < 24) return `${diffHrs}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "RATED":
        return <Star className="w-4 h-4 text-amber-400 fill-current" />;
      case "REVIEWED":
        return <MessageSquare className="w-4 h-4 text-sky-400 fill-current" />;
      case "WATCHLISTED":
        return <Plus className="w-4 h-4 text-emerald-400" />;
      case "FOLLOWED":
        return <UserPlus className="w-4 h-4 text-indigo-400" />;
      default:
        return <Clock className="w-4 h-4 text-[var(--text-muted)]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Feed Filters */}
      <div className="flex border-b border-[var(--border-primary)] gap-6 text-xs sm:text-sm">
        <button
          onClick={() => setFeedType("global")}
          className={`pb-3 font-semibold transition-colors relative cursor-pointer ${
            feedType === "global"
              ? "text-[var(--brand-primary-light)] font-bold border-b-2 border-[var(--brand-primary-light)]"
              : "text-[var(--text-secondary)] hover:text-white"
          }`}
        >
          🌍 Global Feed
        </button>
        <button
          onClick={() => setFeedType("social")}
          className={`pb-3 font-semibold transition-colors relative cursor-pointer ${
            feedType === "social"
              ? "text-[var(--brand-primary-light)] font-bold border-b-2 border-[var(--brand-primary-light)]"
              : "text-[var(--text-secondary)] hover:text-white"
          }`}
        >
          👥 Following Activity
        </button>
        <button
          onClick={() => setFeedType("personal")}
          className={`pb-3 font-semibold transition-colors relative cursor-pointer ${
            feedType === "personal"
              ? "text-[var(--brand-primary-light)] font-bold border-b-2 border-[var(--brand-primary-light)]"
              : "text-[var(--text-secondary)] hover:text-white"
          }`}
        >
          👤 My Activity
        </button>
      </div>

      {/* Activities Grid */}
      <div className="space-y-4 max-w-2xl">
        {activities.length > 0 ? (
          activities.map((act) => (
            <div
              key={act.id}
              className="flex gap-4 p-5 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-2xl shadow-sm hover:border-[var(--border-secondary)] transition-all animate-fade-in-up"
            >
              {/* User Avatar */}
              <Link href={`/profile/${act.user.id}`} className="shrink-0">
                {act.user.image ? (
                  <div className="w-10 h-10 relative rounded-xl overflow-hidden border border-white/5 shadow-sm bg-black/20">
                    <Image
                      src={act.user.image}
                      alt={act.user.name || "User"}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-white font-bold text-sm">
                    {(act.user.name || act.user.username || "U")[0].toUpperCase()}
                  </div>
                )}
              </Link>

              {/* Content Details */}
              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
                  <Link href={`/profile/${act.user.id}`} className="font-bold text-white hover:underline truncate">
                    {act.user.name || `@${act.user.username}`}
                  </Link>
                  <span className="text-[var(--text-secondary)] whitespace-nowrap">{act.message}</span>
                </div>

                {/* Optional nested details (e.g. review snippet) */}
                {act.metadata && act.metadata.reviewSnippet && (
                  <div className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)]/50 rounded-xl text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed italic truncate">
                    "{act.metadata.reviewSnippet}"
                  </div>
                )}

                <div className="flex items-center justify-between gap-4 pt-1">
                  <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTime(act.createdAt)}</span>
                  </div>

                  {/* Context target link */}
                  {act.link && (
                    <Link
                      href={act.link}
                      className="flex items-center gap-1 text-[10px] font-bold text-[var(--brand-primary-light)] hover:text-white transition-colors"
                    >
                      <span>View details</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 bg-[var(--bg-surface)] border border-[var(--border-primary)] border-dashed rounded-2xl">
              <span className="text-3xl">📭</span>
              <p className="text-sm font-semibold text-[var(--text-secondary)]">No activity found</p>
              <p className="text-xs text-[var(--text-muted)] max-w-xs">
                Activity from followed users or your own reviews will show up here.
              </p>
            </div>
          )
        )}

        {/* Load More Button */}
        {hasMore && activities.length > 0 && (
          <div className="flex justify-center pt-4">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] text-xs font-semibold text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <span>Load More</span>
              )}
            </button>
          </div>
        )}

        {loading && activities.length === 0 && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-primary-light)]" />
          </div>
        )}
      </div>
    </div>
  );
}
