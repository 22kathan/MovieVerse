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

  const presets =
    type === "poster"
      ? [
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=500&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=500&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&auto=format&fit=crop",
        ]
      : [
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
    <div className="relative w-full h-full overflow-hidden">
      <Image
        {...props}
        src={imgSrc || getFallbackImage(title, fallbackType)}
        alt={title}
        className={`${className} object-cover`}
        onError={handleError}
      />
    </div>
  );
}
