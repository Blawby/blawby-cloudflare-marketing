"use client";

import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { CloseIcon } from "@/icons/close-icon";
import { IconButton } from "./icon-button";
import Image from "next/image";

export function MediaModal({
  isOpen,
  onClose,
  src,
  alt,
  type = "image",
}: {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt: string;
  type?: "image" | "video";
}) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-ink/90 backdrop-blur-sm transition-opacity" />

      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          <DialogPanel className="relative transform overflow-hidden rounded-lg bg-paper text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl">
            <div className="absolute right-4 top-4 z-20">
              <IconButton onClick={onClose} aria-label="Close">
                <CloseIcon className="h-6 w-6 stroke-ink" />
              </IconButton>
            </div>

            <div className="bg-paper p-2">
              {type === "image" ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-md border border-rule">
                  <Image
                    src={src}
                    alt={alt}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1200px) 100vw, 1200px"
                  />
                </div>
              ) : (
                <div className="relative aspect-video w-full overflow-hidden rounded-md border border-rule">
                  <video
                    src={src}
                    controls
                    autoPlay
                    muted
                    playsInline
                    className="h-full w-full object-contain"
                  />
                </div>
              )}
            </div>
            {alt && (
              <div className="bg-paper px-6 py-4 border-t border-rule">
                <p className="text-sm text-ink-2 font-medium">{alt}</p>
              </div>
            )}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
