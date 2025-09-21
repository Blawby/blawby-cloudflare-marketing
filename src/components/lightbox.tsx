"use client";

import { CloseIcon } from "@/icons/close-icon";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import clsx from "clsx";
import Image from "next/image";
import type React from "react";
import { useState } from "react";

interface LightboxProps {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
  children?: React.ReactNode;
}

export function Lightbox({
  src,
  alt,
  caption,
  className,
  children,
}: LightboxProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    console.log("Opening lightbox for:", src);
    setIsOpen(true);
  };

  const handleClose = () => {
    console.log("Closing lightbox");
    setIsOpen(false);
  };

  return (
    <>
      {/* Clickable trigger */}
      <button
        type="button"
        className={clsx(
          "cursor-pointer border-none bg-transparent p-0",
          className,
        )}
        onClick={handleOpen}
        aria-label={
          children ? `Open lightbox for ${alt}` : `View ${alt} in lightbox`
        }
      >
        {children || (
          <Image
            src={src}
            alt={alt}
            width={400}
            height={300}
            className="block rounded-lg border border-gray-200 object-cover shadow-sm transition-shadow hover:shadow-md dark:border-white/10"
          />
        )}
      </button>

      {/* Lightbox modal */}
      {isOpen && (
        <Dialog 
          open={isOpen} 
          onClose={handleClose} 
          className="relative z-50"
          aria-label={`Image lightbox: ${alt}`}
        >
          <DialogBackdrop className="fixed inset-0 bg-black/80 backdrop-blur-sm" />

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel className="relative max-h-full max-w-7xl transform transition-all">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute -top-12 right-0 z-10 p-2 text-white transition-colors hover:text-gray-300"
                aria-label="Close lightbox"
              >
                <CloseIcon className="h-6 w-6 stroke-white" />
              </button>

              {/* Image container */}
              <div className="relative">
                <Image
                  src={src}
                  alt={alt}
                  width={1200}
                  height={800}
                  className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl"
                />

                {/* Caption */}
                {caption && (
                  <div className="absolute right-0 bottom-0 left-0 rounded-b-lg bg-black/70 p-4 text-white">
                    <p className="text-center text-sm">{caption}</p>
                  </div>
                )}
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      )}
    </>
  );
}

// Higher-order component to wrap existing images
export function withLightbox<T extends React.ComponentProps<"img">>(
  Component: React.ComponentType<T>,
) {
  return function LightboxWrapper(
    props: T & { lightboxSrc?: string; lightboxCaption?: string },
  ) {
    const { lightboxSrc, lightboxCaption, ...imageProps } = props;

    if (!lightboxSrc) {
      return <Component {...(imageProps as T)} />;
    }

    return (
      <Lightbox
        src={lightboxSrc}
        alt={imageProps.alt || ""}
        caption={lightboxCaption}
      >
        <Component {...(imageProps as T)} />
      </Lightbox>
    );
  };
}
