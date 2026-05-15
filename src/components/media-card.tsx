"use client";

import { clsx } from "clsx";
import { useState } from "react";
import Image from "next/image";
import { MediaModal } from "./media-modal";

export function MediaCard({
  caption,
  src,
  ratio = "16 / 9",
  interactive = !!src,
}: {
  caption: string;
  src?: string;
  ratio?: string;
  interactive?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const interactiveProps = interactive ? {
    tabIndex: 0,
    role: "button",
    "aria-label": `Expand image: ${caption}`,
    onClick: () => src && setIsOpen(true),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (!src) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
    },
  } : {};

  return (
    <>
      <div 
        className={clsx(
          "ph group transition-all",
          interactive ? "cursor-zoom-in hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" : "cursor-default"
        )}
        style={{ aspectRatio: ratio }}
        {...interactiveProps}
      >
        {!src && <div className="ph-stripes" />}
        
        {src && (
          <Image
            src={src}
            alt={caption}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        )}
        
        <div className="ph-caption mono small-caps flex items-center justify-between transition-colors group-hover:bg-paper-2">
          <span>{caption}</span>
          {src && (
            <span className="flex items-center gap-1.5 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Click to expand</span>
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M15 3h6v6" />
                <path d="M9 21H3v-6" />
                <path d="M21 3l-7 7" />
                <path d="M3 21l7-7" />
              </svg>
            </span>
          )}
        </div>
      </div>

      {src && (
        <MediaModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          src={src}
          alt={caption}
        />
      )}
    </>
  );
}
