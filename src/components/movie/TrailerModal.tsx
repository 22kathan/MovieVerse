"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Film, Volume2, Sparkles } from "lucide-react";

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  videoKey?: string | null;
  backdropPath?: string | null;
}

export default function TrailerModal({
  isOpen,
  onClose,
  title,
  videoKey,
  backdropPath,
}: TrailerModalProps) {
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

  if (!isOpen) return null;

  // Standard trailer fallback URL if no key provided
  const embedUrl = videoKey
    ? `https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&modestbranding=1&rel=0`
    : "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&modestbranding=1&rel=0"; // Fallback preview

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-5xl bg-[#12141d] rounded-2xl border border-amber-500/30 overflow-hidden shadow-2xl z-10 space-y-0"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-500/10 via-black to-black border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500 text-black font-extrabold text-xs">
                IMDb
              </span>
              <div>
                <h3 className="font-bold text-white text-base md:text-lg flex items-center gap-2 truncate max-w-md">
                  <Film className="w-4 h-4 text-amber-400" />
                  {title} — Official Trailer
                </h3>
                <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" /> High Definition Cinema Teaser
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-[var(--text-secondary)] hover:text-white transition-colors border border-white/10"
              aria-label="Close trailer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Video Container */}
          <div className="relative w-full aspect-video bg-black flex items-center justify-center">
            <iframe
              src={embedUrl}
              title={`${title} Trailer`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Footer Bar */}
          <div className="flex items-center justify-between px-6 py-3.5 bg-black/60 text-xs text-[var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>Use controls inside video to adjust sound & resolution</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all shadow-md shadow-amber-500/20"
            >
              Close Teaser
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
