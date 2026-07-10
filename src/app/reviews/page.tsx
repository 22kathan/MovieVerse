"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { getReviews as localGetReviews, deleteReview as localDeleteReview } from "@/lib/storage";
import SectionHeader from "@/components/shared/SectionHeader";
import { getImageUrl } from "@/lib/tmdb";
import { Trash2, Star, Calendar, Loader2 } from "lucide-react";

export default function MyReviewsPage() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const currentUser = session?.user;

  const [mounted, setMounted] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServerReviews = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`/api/reviews?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        // Normalize server items to match state schema
        const items = (data.reviews || []).map((rev: any) => ({
          id: rev.id,
          title: rev.title,
          content: rev.content,
          rating: rev.rating,
          createdAt: rev.createdAt,
          mediaId: rev.movie.tmdbId,
          mediaTitle: rev.movie.title,
          mediaPoster: rev.movie.posterPath,
          mediaType: rev.movie.mediaType === "TV_SHOW" ? "tv" : "movie",
        }));
        setReviews(items);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated) {
      if (currentUser?.id) {
        fetchServerReviews();
      }
    } else {
      setReviews(localGetReviews());
      setLoading(false);

      const handleReviewsChange = () => {
        setReviews(localGetReviews());
      };

      window.addEventListener("reviews-updated", handleReviewsChange);
      return () => {
        window.removeEventListener("reviews-updated", handleReviewsChange);
      };
    }
  }, [isAuthenticated, currentUser?.id]);

  const handleDelete = async (id: string, isLocal: boolean) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    if (isLocal) {
      localDeleteReview(id);
      setReviews(reviews.filter((rev) => rev.id !== id));
    } else {
      try {
        const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
        if (res.ok) {
          setReviews(reviews.filter((rev) => rev.id !== id));
        } else {
          alert("Failed to delete review");
        }
      } catch (err) {
        console.error("Error deleting review:", err);
      }
    }
  };

  if (!mounted) {
    return (
      <div className="px-6 py-8 space-y-8 mx-auto min-h-screen" style={{ maxWidth: "var(--container-max)" }}>
        <SectionHeader title="My Reviews" subtitle="Your shared movie and show reviews" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 w-full rounded-2xl bg-[var(--bg-surface)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 space-y-8 mx-auto min-h-screen" style={{ maxWidth: "var(--container-max)" }}>
      <div>
        <SectionHeader
          title="💬 My Reviews"
          subtitle={
            reviews.length > 0
              ? `You have written ${reviews.length} reviews`
              : "Share your thoughts on movies and TV shows"
          }
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-[var(--brand-primary-light)] animate-spin" />
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-6 max-w-4xl">
          {reviews.map((review) => {
            const posterUrl = getImageUrl(review.mediaPoster, "poster", "sm");
            const detailUrl = review.mediaType === "tv" ? `/tv/${review.mediaId}` : `/movies/${review.mediaId}`;
            const isLocal = !isAuthenticated;

            return (
              <div
                key={review.id}
                className="flex gap-5 p-5 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-2xl shadow-sm hover:border-[var(--border-secondary)] transition-all"
              >
                {/* Poster preview */}
                <Link href={detailUrl} className="w-16 sm:w-20 shrink-0 aspect-[2/3] relative rounded-xl overflow-hidden bg-[#121824] hidden sm:block border border-white/5">
                  {posterUrl ? (
                    <Image
                      src={posterUrl}
                      alt={review.mediaTitle || "Poster"}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-lg opacity-30">🎬</div>
                  )}
                </Link>

                {/* Content */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link href={detailUrl} className="font-bold text-white text-base hover:text-[var(--brand-primary-light)] transition-colors">
                        {review.mediaTitle}
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--text-secondary)] font-medium">
                        <span className="px-2 py-0.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[9px] uppercase tracking-wider font-bold">
                          {review.mediaType}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                        <span>{review.rating}/10</span>
                      </div>
                      <button
                        onClick={() => handleDelete(review.id, isLocal)}
                        className="p-2 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--error)] border border-[var(--border-primary)] hover:border-[var(--error)]/30 transition-all cursor-pointer"
                        title="Delete Review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 bg-[var(--bg-tertiary)] p-4 rounded-xl border border-[var(--border-primary)]/50">
                    {review.title && <h4 className="font-bold text-white text-sm">{review.title}</h4>}
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                      {review.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="text-6xl">💬</div>
          <h3 className="text-xl font-bold text-white">No reviews yet</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm">
            You haven't written any reviews yet. Share your critiques on your favorite movie or TV show detail pages!
          </p>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-dark)] text-white font-semibold text-xs shadow-md hover:scale-[1.01] transition-all"
          >
            Explore Movies & Shows
          </Link>
        </div>
      )}
    </div>
  );
}
