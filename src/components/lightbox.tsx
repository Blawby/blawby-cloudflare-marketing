"use client";

import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { clsx } from "clsx";
import Image from "next/image";
import type React from "react";
import { useState } from "react";
import { CloseIcon } from "@/icons/close-icon";

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
  children 
}: LightboxProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    console.log('Opening lightbox for:', src);
    setIsOpen(true);
  };

  const handleClose = () => {
    console.log('Closing lightbox');
    setIsOpen(false);
  };

  return (
    <>
      {/* Clickable trigger */}
      <div 
        className={clsx("cursor-pointer", className)}
        onClick={handleOpen}
      >
        {children || (
          <Image
            src={src}
            alt={alt}
            width={400}
            height={300}
            className="block object-cover rounded-lg border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow"
          />
        )}
      </div>

      {/* Lightbox modal */}
      <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="relative max-w-7xl max-h-full transform transition-all">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute -top-12 right-0 z-10 p-2 text-white hover:text-gray-300 transition-colors"
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
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                priority
              />
              
              {/* Caption */}
              {caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4 rounded-b-lg">
                  <p className="text-sm text-center">{caption}</p>
                </div>
              )}
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}

// Higher-order component to wrap existing images
export function withLightbox<T extends React.ComponentProps<"img">>(
  Component: React.ComponentType<T>
) {
  return function LightboxWrapper(props: T & { lightboxSrc?: string; lightboxCaption?: string }) {
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
