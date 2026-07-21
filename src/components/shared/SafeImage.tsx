"use client";

import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import { Film } from "lucide-react";

interface SafeImageProps extends Omit<ImageProps, "src"> {
  src: string | null | undefined;
  fallbackType?: "poster" | "backdrop" | "profile";
}

const CINEMA_PRESETS = {
  poster: [
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop", // Cinema projector
    "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&auto=format&fit=crop", // Theater seats
    "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=500&auto=format&fit=crop", // Film reel
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop", // Cinema screen
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&auto=format&fit=crop", // Stage lights
  ],
  backdrop: [
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop",
  ],
  profile: [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop",
  ],
};

function getFallbackImage(title: string, type: "poster" | "backdrop" | "profile"): string {
  const list = CINEMA_PRESETS[type] || CINEMA_PRESETS.poster;
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return list[Math.abs(hash) % list.length];
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
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!src || src.trim() === "") {
      setImgSrc(getFallbackImage(title, fallbackType));
      setHasError(false);
    } else {
      setImgSrc(src);
      setHasError(false);
    }
  }, [src, title, fallbackType]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(getFallbackImage(title, fallbackType));
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-950 flex items-center justify-center">
      <Image
        {...props}
        src={imgSrc || getFallbackImage(title, fallbackType)}
        alt={title}
        className={`${className} object-cover`}
        onError={handleError}
      />
      {hasError && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col items-center justify-end p-3 text-center pointer-events-none">
          <Film className="w-6 h-6 text-amber-400 mb-1 opacity-80" />
          <span className="text-[10px] font-bold text-white/90 line-clamp-1">{title}</span>
        </div>
      )}
    </div>
  );
}
