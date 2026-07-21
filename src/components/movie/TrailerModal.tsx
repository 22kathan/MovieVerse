"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Film, Volume2, Sparkles, Loader2, ExternalLink, Search } from "lucide-react";

import { getTrailerKeyForMovie } from "@/lib/tmdb";

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  backdropPath?: string | null;
  initialVideoKey?: string | null;
  videoKey?: string | null;
  movieId?: number;
  mediaType?: "movie" | "tv";
}

export default function TrailerModal({
  isOpen,
  onClose,
  title,
  backdropPath,
  initialVideoKey,
  videoKey,
  movieId,
  mediaType = "movie",
}: TrailerModalProps) {
  const effectiveInitialKey = initialVideoKey || videoKey || null;
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState<string | null>(effectiveInitialKey);
  const [noTrailer, setNoTrailer] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Fetch official trailer key if not explicitly passed
  useEffect(() => {
    if (!isOpen) return;

    setNoTrailer(false);

    if (initialVideoKey) {
      setKey(initialVideoKey);
      setLoading(false);
      return;
    }

    if (movieId) {
      let isMounted = true;
      setLoading(true);

      const fallbackKey = getTrailerKeyForMovie(movieId);

      fetch(`/api/videos?id=${movieId}&type=${mediaType}&title=${encodeURIComponent(title)}`)
        .then((res) => res.json())
        .then((data) => {
          if (!isMounted) return;
          if (data?.key) {
            setKey(data.key);
            setNoTrailer(false);
          } else {
            setKey(fallbackKey);
            setNoTrailer(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setKey(fallbackKey);
            setNoTrailer(false);
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });

      return () => {
        isMounted = false;
      };
    } else {
      setKey(null);
      setNoTrailer(true);
      setLoading(false);
    }
  }, [isOpen, initialVideoKey, movieId, mediaType, title]);

  if (!isOpen || !mounted) return null;

  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(title + " official trailer")}`;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const embedUrl = key
    ? `https://www.youtube-nocookie.com/embed/${key}?autoplay=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(origin)}`
    : null;

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 w-full h-full min-w-full min-h-full overflow-y-auto bg-black/90 backdrop-blur-md">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="fixed inset-0 bg-black/90 backdrop-blur-lg"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.4 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-[95vw] sm:w-[90vw] md:w-full max-w-4xl min-w-[300px] bg-[#12141d] rounded-2xl border border-amber-500/30 overflow-hidden shadow-2xl z-10 space-y-0 my-auto shrink-0"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gradient-to-r from-amber-500/10 via-black to-black border-b border-white/10 shrink-0 gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500 text-black font-extrabold text-xs shadow-md shrink-0">
                IMDb
              </span>
              <div className="min-w-0">
                <h3 className="font-bold text-white text-sm sm:text-base md:text-lg flex items-center gap-2 truncate max-w-[200px] sm:max-w-md">
                  <Film className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">{title} — Official Trailer</span>
                </h3>
                <p className="text-[10px] sm:text-xs text-[var(--text-tertiary)] flex items-center gap-1.5 truncate">
                  <Sparkles className="w-3 h-3 text-amber-400 shrink-0" /> High Definition Cinema Teaser
                </p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-[var(--text-secondary)] hover:text-white transition-colors border border-white/10 cursor-pointer shrink-0"
              aria-label="Close trailer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Video Container */}
          <div className="relative w-full aspect-video min-h-[200px] sm:min-h-[350px] bg-black flex items-center justify-center">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 text-amber-400">
                <Loader2 className="w-10 h-10 animate-spin" />
                <p className="text-xs font-semibold text-white/80">Fetching official trailer...</p>
              </div>
            ) : embedUrl ? (
              <iframe
                key={key}
                src={embedUrl}
                title={`${title} Trailer`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              /* No trailer found — show a clean card directing user to YouTube */
              <div className="flex flex-col items-center justify-center gap-5 text-center px-6 py-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <Film className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-base sm:text-lg mb-1">
                    No Trailer Available on TMDB
                  </h4>
                  <p className="text-white/50 text-xs sm:text-sm max-w-md">
                    We couldn&apos;t find an official trailer for <span className="text-amber-400 font-semibold">&ldquo;{title}&rdquo;</span> in TMDB&apos;s database. You can search for it directly on YouTube.
                  </p>
                </div>
                <a
                  href={youtubeSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:scale-[1.03] active:scale-[0.97]"
                >
                  <Search className="w-4 h-4" />
                  Search &ldquo;{title} Official Trailer&rdquo; on YouTube
                </a>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 bg-black/80 text-[11px] sm:text-xs text-[var(--text-secondary)] gap-2 border-t border-white/10 shrink-0 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{noTrailer ? "Trailer not available via TMDB" : "Use controls inside video to adjust sound & resolution"}</span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={youtubeSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-amber-400 hover:underline"
              >
                <span>Search on YouTube</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              >
                Close Teaser
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
