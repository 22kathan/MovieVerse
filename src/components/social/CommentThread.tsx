"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { MessageSquare, CornerDownRight, Trash, Send, Loader2, Heart } from "lucide-react";
import { useToast } from "@/components/shared/Toast";

interface CommentNode {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  parentId: string | null;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  replies: CommentNode[];
}

interface CommentThreadProps {
  reviewId: string;
}

export default function CommentThread({ reviewId }: CommentThreadProps) {
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  
  // Local state for interactive likes to avoid adding database columns for a simulation
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  const isAuthenticated = status === "authenticated";

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?reviewId=${reviewId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [reviewId]);

  const handleCreateComment = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    const content = parentId ? replyText : newCommentText;
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, content, parentId }),
      });

      if (res.ok) {
        showToast({
          type: "success",
          title: parentId ? "Reply Posted" : "Comment Posted",
          message: "Your message has been added to this review thread.",
        });
        if (parentId) {
          setReplyText("");
          setReplyTargetId(null);
        } else {
          setNewCommentText("");
        }
        await fetchComments();
      } else {
        showToast({
          type: "error",
          title: "Post Failed",
          message: "We encountered an error while saving your comment.",
        });
      }
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = (commentId: string) => {
    if (!isAuthenticated) {
      showToast({ type: "error", title: "Sign In Required", message: "Please sign in to react to comments." });
      return;
    }
    const isLiked = !!likedComments[commentId];
    setLikedComments((prev) => ({ ...prev, [commentId]: !isLiked }));
    setLikeCounts((prev) => ({
      ...prev,
      [commentId]: (prev[commentId] || 0) + (isLiked ? -1 : 1),
    }));
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments?id=${commentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast({
          type: "info",
          title: "Comment Deleted",
          message: "Your message was successfully removed.",
        });
        await fetchComments();
      } else {
        showToast({
          type: "error",
          title: "Delete Failed",
          message: "Failed to delete comment. Please try again.",
        });
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const renderComment = (comment: CommentNode, depth = 0) => {
    const isOwner = session?.user?.id === comment.userId;
    const isReplying = replyTargetId === comment.id;
    const isLiked = !!likedComments[comment.id];
    const likes = likeCounts[comment.id] || 0;

    return (
      <div key={comment.id} className="space-y-3">
        <div
          className={`flex gap-3 p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)]/80 hover:border-[var(--border-secondary)] transition duration-200 ${
            depth > 0 ? "ml-6 border-l-2 border-l-[var(--brand-primary)]/30" : ""
          }`}
        >
          {/* Avatar */}
          {comment.user?.image ? (
            <div className="w-7 h-7 relative rounded-lg overflow-hidden border border-white/5 bg-black/20 shrink-0">
              <Image
                src={comment.user.image}
                alt={comment.user.name || "User"}
                fill
                sizes="28px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {(comment.user?.name || comment.user?.username || "U")[0].toUpperCase()}
            </div>
          )}

          {/* Comment Details */}
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-baseline gap-1.5 text-xs">
                <span className="font-bold text-white truncate max-w-[120px]">
                  {comment.user?.name || `@${comment.user?.username}`}
                </span>
                <span className="text-[var(--text-muted)] text-[10px]">
                  {new Date(comment.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {isAuthenticated && (
                  <button
                    onClick={() => {
                      setReplyTargetId(isReplying ? null : comment.id);
                      setReplyText("");
                    }}
                    className="text-[10px] font-bold text-[var(--text-secondary)] hover:text-white transition-colors cursor-pointer"
                  >
                    Reply
                  </button>
                )}
                {isOwner && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-[var(--text-secondary)] hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
              {comment.content}
            </p>

            {/* Micro-interaction reactions footer */}
            <div className="flex items-center gap-4 pt-1 text-[10px] font-bold text-[var(--text-muted)]">
              <button
                onClick={() => toggleLike(comment.id)}
                className={`flex items-center gap-1 transition-colors cursor-pointer ${
                  isLiked ? "text-rose-400" : "hover:text-white"
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
                <span>{likes > 0 ? likes : "Like"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Inline Reply Form */}
        {isReplying && (
          <form
            onSubmit={(e) => handleCreateComment(e, comment.id)}
            className="flex items-center gap-2 ml-12 p-2 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl animate-fade-in-up"
            style={{ animationDuration: "200ms" }}
          >
            <CornerDownRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <input
              type="text"
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 bg-transparent outline-none text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              autoFocus
            />
            <button
              type="submit"
              disabled={submitting}
              className="p-1.5 rounded-lg bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-dark)] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Recursive replies rendering */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-3">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pt-4 border-t border-[var(--border-primary)]/50 space-y-4">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
        <MessageSquare className="w-3.5 h-3.5" />
        <span>Comments ({comments.length})</span>
      </div>

      {/* Top Level Comments List */}
      <div className="space-y-4">
        {loading && comments.length === 0 ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4.5 h-4.5 animate-spin text-[var(--brand-primary-light)]" />
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {comments.map((comment) => renderComment(comment, 0))}
          </div>
        ) : (
          <p className="text-[10px] text-[var(--text-muted)] italic">No comments yet.</p>
        )}
      </div>

      {/* Top Level Input Form */}
      {isAuthenticated ? (
        <form onSubmit={(e) => handleCreateComment(e, null)} className="flex items-center gap-2 pt-2 border-t border-[var(--border-primary)]/30">
          <input
            type="text"
            placeholder="Add a public comment..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)] outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-3 py-2 rounded-xl bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-dark)] text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Comment</span>
          </button>
        </form>
      ) : (
        <p className="text-[10px] text-[var(--text-muted)]">
          Please sign in to join the conversation.
        </p>
      )}
    </div>
  );
}
