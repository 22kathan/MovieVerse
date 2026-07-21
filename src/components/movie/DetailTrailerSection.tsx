"use client";

import { useState, useEffect } from "react";
import { Play, Film, Sparkles, Loader2, RefreshCw, ExternalLink, Maximize2 } from "lucide-react";
import SafeImage from "@/components/shared/SafeImage";
import TrailerModal from "./TrailerModal";

interface DetailTrailerSectionProps {
  id: number;
  title: string;
  backdropPath?: string | null;
  posterPath?: string | null;
  mediaType?: "movie" | "tv";
}

export default function DetailTrailerSection({
  id,
  title,
  backdropPath,
  posterPath,
  mediaType = "movie",
}: DetailTrailerSectionProps) {
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPlayingInline, setIsPlayingInline] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/videos?id=${id}&type=${mediaType}&title=${encodeURIComponent(title)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.key) {
          setVideoKey(data.key);
        } else {
          setVideoKey(null);
        }
      })
      .catch((err) => {
        console.error("Failed to load trailer for detail page:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, title, mediaType]);

  const embedUrl = videoKey
    ? `https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0&enablejsapi=1`
    : null;

  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(title + " official trailer")}`;

  return (
    <section id="watch-trailer-section" className="space-y-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-primary)] p-6 shadow-xl relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[var(--border-primary)]/60 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Watch Official Trailer
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-widest font-extrabold">
                HD 1080p
              </span>
            </h3>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Watch high-definition trailer & preview clips for &ldquo;{title}&rdquo;
            </p>
          </div>
        </div>

        {videoKey && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Cinema Lightbox Mode
          </button>
        )}
      </div>

      {/* Video Container Box */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/90 border border-white/10 shadow-2xl group relative z-10">
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-amber-400 bg-[#0d111a]">
            <Loader2 className="w-9 h-9 animate-spin" />
            <p className="text-xs font-semibold text-white/70">Loading official trailer...</p>
          </div>
        ) : isPlayingInline && embedUrl ? (
          <div className="relative w-full h-full">
            <iframe
              src={embedUrl}
              title={`${title} Official Trailer`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
              <a
                href={videoKey ? `https://www.youtube.com/watch?v=${videoKey}` : youtubeSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black/80 hover:bg-black text-amber-400 text-xs font-bold backdrop-blur-md border border-amber-400/30 transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Watch on YouTube
              </a>
              <button
                onClick={() => setIsPlayingInline(false)}
                className="px-3 py-1.5 rounded-lg bg-black/80 hover:bg-black text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition-all cursor-pointer"
              >
                Close Video
              </button>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Background Backdrop / Poster Image */}
            <SafeImage
              src={backdropPath ? `https://image.tmdb.org/t/p/w1280${backdropPath}` : posterPath ? `https://image.tmdb.org/t/p/w780${posterPath}` : null}
              alt={title}
              fallbackType="backdrop"
              fill
              className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/30" />

            {/* Content overlay */}
            <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <button
                onClick={() => {
                  if (embedUrl) {
                    setIsPlayingInline(true);
                  } else {
                    setIsModalOpen(true);
                  }
                }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-[0_0_35px_rgba(245,197,24,0.6)] group-hover:scale-110 active:scale-95 transition-all cursor-pointer border-2 border-amber-300"
                aria-label="Play Trailer"
              >
                <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current translate-x-0.5" />
              </button>

              <div>
                <h4 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">
                  {title} — Official Trailer
                </h4>
                <p className="text-xs sm:text-sm text-amber-300/90 font-medium mt-1">
                  Click play to watch inline or launch high-definition cinema mode
                </p>
              </div>

              {!videoKey && (
                <a
                  href={youtubeSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md mt-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Search &ldquo;{title}&rdquo; Trailer on YouTube
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Trailer Modal */}
      <TrailerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={title}
        videoKey={videoKey}
        movieId={id}
        mediaType={mediaType}
      />
    </section>
  );
}

