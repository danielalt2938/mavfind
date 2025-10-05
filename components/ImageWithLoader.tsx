"use client";

import { useState } from "react";

interface ImageWithLoaderProps {
  src: string;
  alt: string;
  className?: string;
  onRemove?: () => void;
  showRemoveButton?: boolean;
  label?: string;
}

export default function ImageWithLoader({
  src,
  alt,
  className = "",
  onRemove,
  showRemoveButton = false,
  label,
}: ImageWithLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative group aspect-square">
      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-bgElevated rounded-xl border-2 border-border z-20">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-utaOrange border-t-transparent"></div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-bgElevated rounded-xl border-2 border-border z-20">
          <div className="text-center p-4">
            <svg
              className="w-8 h-8 text-red-400 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-xs text-muted">Failed to load</p>
          </div>
        </div>
      )}

      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl z-10" />

      {/* Image */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover rounded-xl border-2 border-border hover:border-utaOrange/50 transition-all ${
          isLoading || hasError ? "opacity-0" : "opacity-100"
        } ${className}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />

      {/* Remove button */}
      {showRemoveButton && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-20"
          title="Remove image"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      {/* Label */}
      {label && (
        <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <div className="text-xs text-white font-medium bg-black/50 backdrop-blur-sm px-2 py-1 rounded">
            {label}
          </div>
        </div>
      )}
    </div>
  );
}
