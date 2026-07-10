"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getReviews as localGetReviews, addReview as localAddReview, deleteReview as localDeleteReview, ReviewItem } from "@/lib/storage";
import { Star, Send, Trash2, Calendar, MessageSquare, Loader2 } from "lucide-react";
import Image from "next/image";
import CommentThread from "@/components/social/CommentThread";


interface ReviewFormProps {
  mediaId: number;
  mediaTitle: string;
  mediaPoster: string | null;
  mediaType: "movie" | "tv";
}

interface ServerReview {
  id: string;
  title: string | null;
  content: string;
  rating: number;
  createdAt: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    username: string | null;
  };
}

export default function ReviewForm({
  mediaId,
  mediaTitle,
  mediaPoster,
  mediaType,
}: ReviewFormProps) {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const currentUser = session?.user;

  const [mounted, setMounted] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState<number>(10);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchServerReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?tmdbId=${mediaId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated) {
      fetchServerReviews();
    } else {
      // LocalStorage fallback
      const localReviews = localGetReviews().filter((r) => r.mediaId === mediaId).map(r => ({
        id: r.id,
        title: r.title,
        content: r.content,
        rating: r.rating,
        createdAt: r.createdAt,
        userId: "local",
        user: {
          id: "local",
          name: "You (Guest)",
          image: null,
          username: "guest"
        }
      }));
      setReviews(localReviews);

      const handleReviewsChange = () => {
        const updated = localGetReviews().filter((r) => r.mediaId === mediaId).map(r => ({
          id: r.id,
          title: r.title,
          content: r.content,
          rating: r.rating,
          createdAt: r.createdAt,
          userId: "local",
          user: {
            id: "local",
            name: "You (Guest)",
            image: null,
            username: "guest"
          }
        }));
        setReviews(updated);
      };

      window.addEventListener("reviews-updated", handleReviewsChange);
      return () => {
        window.removeEventListener("reviews-updated", handleReviewsChange);
      };
    }
  }, [mediaId, isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    if (isAuthenticated) {
      try {
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            movieId: String(mediaId),
            tmdbId: mediaId,
            title: title.trim() || undefined,
            content: content.trim(),
            rating,
            movieTitle: mediaTitle,
            posterPath: mediaPoster,
            mediaType: mediaType === "tv" ? "TV_SHOW" : "MOVIE",
          }),
        });

        if (res.ok) {
          setTitle("");
          setContent("");
          setRating(10);
          fetchServerReviews();
        } else {
          const errData = await res.json();
          alert(errData.error || "Failed to submit review");
        }
      } catch (err) {
        console.error("Error submitting review:", err);
      } finally {
        setLoading(false);
      }
    } else {
      // Guest local review
      localAddReview({
        mediaId,
        mediaTitle,
        mediaPoster,
        mediaType,
        title: title.trim() || "Untitled",
        content: content.trim(),
        rating,
      });
      setTitle("");
      setContent("");
      setRating(10);
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, isLocal: boolean) => {
    if (!confirm("Are you sure you want to delete your review?")) return;

    if (isLocal) {
      localDeleteReview(id);
      setReviews(reviews.filter((r) => r.id !== id));
    } else {
      try {
        const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
        if (res.ok) {
          setReviews(reviews.filter((r) => r.id !== id));
        } else {
          alert("Failed to delete review");
        }
      } catch (err) {
        console.error("Error deleting review:", err);
      }
    }
  };

  if (!mounted) return null;

  return (
    <section className="space-y-8 pt-8 border-t border-[var(--border-primary)]">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-[var(--brand-primary-light)]" />
        <h3 className="text-xl font-bold text-white">Audience Reviews</h3>
      </div>

      <div className="grid md:grid-cols-5 gap-8 items-start">
        {/* Write a Review Form */}
        <form
          onSubmit={handleSubmit}
          className="md:col-span-2 p-5 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-2xl space-y-4 shadow-sm"
        >
          <h4 className="font-bold text-white text-sm">Write a Review</h4>

          {/* Star selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider block">
              Your Rating ({rating}/10)
            </label>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => {
                const index = i + 1;
                const active = hoverRating !== null ? index <= hoverRating : index <= rating;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setRating(index)}
                    onMouseEnter={() => setHoverRating(index)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-0.5 cursor-pointer focus:outline-none transition-transform active:scale-90"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        active
                          ? "text-amber-400 fill-current"
                          : "text-[var(--text-muted)] hover:text-amber-400/50"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-1">
            <input
              type="text"
              placeholder="Review title (optional)..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl px-4 py-3 outline-none focus:border-[var(--brand-primary)] transition-all"
            />
          </div>

          {/* Content Textarea */}
          <div className="space-y-1">
            <textarea
              required
              rows={4}
              placeholder="Write your detailed review here (minimum 10 characters)..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl px-4 py-3 outline-none focus:border-[var(--brand-primary)] transition-all resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || content.trim().length < 10}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-dark)] text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Submit Review</span>
          </button>
        </form>

        {/* Existing Reviews List */}
        <div className="md:col-span-3 space-y-4">
          <h4 className="font-bold text-white text-sm">
            Audience Reviews ({reviews.length})
          </h4>

          {reviews.length > 0 ? (
            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
              {reviews.map((rev) => {
                const isLocal = rev.userId === "local";
                const isOwner = isLocal || (currentUser && currentUser.id === rev.userId);

                return (
                  <div
                    key={rev.id}
                    className="p-4 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-2xl space-y-3 shadow-sm animate-fade-in-up"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        {/* User Avatar */}
                        {rev.user?.image ? (
                          <Image
                            src={rev.user.image}
                            alt={rev.user.name || "User"}
                            width={28}
                            height={28}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-white text-xs font-bold">
                            {(rev.user?.name || "U")[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold text-white">{rev.user?.name || "Anonymous User"}</p>
                          <p className="text-[10px] text-[var(--text-tertiary)]">@{rev.user?.username || "user"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                          <Star className="w-3 h-3 fill-current text-amber-400" />
                          {rev.rating}/10
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)] font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                        {isOwner && (
                          <button
                            onClick={() => handleDelete(rev.id, isLocal)}
                            className="p-1.5 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--error)] transition-colors cursor-pointer"
                            title="Delete Review"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      {rev.title && <h5 className="font-bold text-white text-xs sm:text-sm">{rev.title}</h5>}
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                        {rev.content}
                      </p>
                    </div>

                    {/* Comment Thread for this review */}
                    {!isLocal && <CommentThread reviewId={rev.id} />}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-[var(--bg-surface)] border border-[var(--border-primary)] border-dashed rounded-2xl text-center space-y-2">
              <span className="text-3xl">🍿</span>
              <p className="text-xs font-semibold text-[var(--text-secondary)]">No reviews yet</p>
              <p className="text-[10px] text-[var(--text-muted)]">
                Be the first to share your thoughts on this title!
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
