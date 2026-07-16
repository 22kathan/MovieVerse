"use client";

import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";

interface SafeImageProps extends Omit<ImageProps, "src"> {
  src: string | null | undefined;
  fallbackType?: "poster" | "backdrop" | "profile";
}

function getFallbackImage(title: string, type: "poster" | "backdrop" | "profile"): string {
  if (type === "profile") {
    const profilePresets = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop",
    ];
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    return profilePresets[Math.abs(hash) % profilePresets.length];
  }

  const presets = type === 'poster' ? [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?w=500&auto=format&fit=crop",
  ] : [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop",
  ];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash);
  return presets[index % presets.length];
}

export default function SafeImage({
  src,
  alt,
  fallbackType = "poster",
  className = "",
  ...props
}: SafeImageProps) {
  const title = alt || "Movie";
  const [imgSrc, setImgSrc] = useState<string>("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setError(true);
    } else {
      setImgSrc(src);
      setError(false);
    }
  }, [src]);

  const handleError = () => {
    setError(true);
  };

  // If image fails to load or no source is provided, return high-quality SVG placeholders
  if (error || !src) {
    if (fallbackType === "profile") {
      return (
        <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-tertiary)] border border-[var(--border-primary)] ${className} min-h-[120px]`}>
          <svg
            className="w-12 h-12 text-[var(--text-muted)] opacity-60 mb-2"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          <span className="text-[10px] font-bold text-[var(--text-muted)] text-center px-2 line-clamp-1">
            {title}
          </span>
        </div>
      );
    }

    if (fallbackType === "poster") {
      return (
        <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-tertiary)] border border-[var(--border-primary)] p-4 text-center ${className} aspect-[2/3]`}>
          <svg
            className="w-10 h-10 text-[var(--brand-primary-light)] opacity-40 mb-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v16.5h16.5V3.75H3.75zm16.5 4.5H3.75m16.5 4.5H3.75m16.5 4.5H3.75" />
          </svg>
          <span className="text-xs font-bold text-[var(--text-secondary)] line-clamp-2 px-1 mb-1">
            {title}
          </span>
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-[var(--brand-primary-light)] opacity-90 px-2 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
            Preview
          </span>
        </div>
      );
    }

    // Default: Backdrop fallback
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-tertiary)] border border-[var(--border-primary)] p-6 text-center ${className} aspect-video`}>
        <svg
          className="w-12 h-12 text-[var(--brand-primary-light)] opacity-30 mb-2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        <span className="text-sm font-semibold text-[var(--text-secondary)] line-clamp-1">
          {title}
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Image
        {...props}
        src={imgSrc}
        alt={title}
        className={`${className} object-cover`}
        onError={handleError}
      />
    </div>
  );
}
