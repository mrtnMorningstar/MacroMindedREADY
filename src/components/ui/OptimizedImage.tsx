"use client";

import { useState } from "react";
import Image from "next/image";
import { getThumbnailUrl } from "@/lib/image-utils";

type OptimizedImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  onClick?: () => void;
  onZoom?: boolean; // If true, loads full resolution on click
};

/**
 * Optimized image component that uses thumbnails by default
 * and can load full resolution on click/zoom
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill,
  className,
  sizes,
  priority = false,
  onClick,
  onZoom = false,
}: OptimizedImageProps) {
  const [useFullResolution, setUseFullResolution] = useState(!onZoom);
  const [imageSrc, setImageSrc] = useState(onZoom ? getThumbnailUrl(src) : src);

  const handleClick = () => {
    if (onZoom && !useFullResolution) {
      // Load full resolution on first click
      setImageSrc(src);
      setUseFullResolution(true);
    }
    onClick?.();
  };

  const imageProps = {
    src: imageSrc,
    alt,
    className,
    priority,
    loading: priority ? ("eager" as const) : ("lazy" as const),
    onClick: onZoom ? handleClick : onClick,
    ...(fill
      ? { fill: true }
      : {
          width: width || 400,
          height: height || 400,
        }),
    ...(sizes ? { sizes } : {}),
  };

  return <Image {...imageProps} unoptimized />; // Firebase Storage URLs need unoptimized
}

