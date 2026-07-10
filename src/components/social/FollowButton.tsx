"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { useToast } from "@/components/shared/Toast";

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing?: boolean;
  onToggle?: (isFollowing: boolean) => void;
}

export default function FollowButton({
  targetUserId,
  initialIsFollowing = false,
  onToggle,
}: FollowButtonProps) {
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  const isAuthenticated = status === "authenticated";

  const handleFollow = async () => {
    if (!isAuthenticated) {
      showToast({
        type: "error",
        title: "Sign In Required",
        message: "Please sign in to follow users and see their feeds.",
      });
      return;
    }

    if (session?.user?.id === targetUserId) {
      return;
    }

    setLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const res = await fetch(`/api/follow?targetUserId=${targetUserId}`, {
          method: "DELETE",
        });

        if (res.ok) {
          setIsFollowing(false);
          showToast({
            type: "info",
            title: "Unfollowed",
            message: "You have stopped following this user.",
          });
          if (onToggle) onToggle(false);
        } else {
          showToast({
            type: "error",
            title: "Action Failed",
            message: "Failed to unfollow user. Please try again.",
          });
        }
      } else {
        // Follow
        const res = await fetch("/api/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId }),
        });

        if (res.ok) {
          setIsFollowing(true);
          showToast({
            type: "success",
            title: "Following User",
            message: "You are now following this user's updates.",
          });
          if (onToggle) onToggle(true);
        } else {
          const data = await res.json();
          showToast({
            type: "error",
            title: "Action Failed",
            message: data.error || "Failed to follow user.",
          });
        }
      }
    } catch (error) {
      console.error("Follow action error:", error);
      showToast({
        type: "error",
        title: "Connection Error",
        message: "Failed to reach servers. Check your connection.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (session?.user?.id === targetUserId) {
    return null; // Don't show follow button on own profile
  }

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
        isFollowing
          ? "bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400"
          : "bg-[var(--brand-primary)] border-transparent text-white hover:bg-[var(--brand-primary-dark)]"
      } disabled:opacity-50`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="w-3.5 h-3.5" />
          <span>Unfollow</span>
        </>
      ) : (
        <>
          <UserPlus className="w-3.5 h-3.5" />
          <span>Follow</span>
        </>
      )}
    </button>
  );
}
