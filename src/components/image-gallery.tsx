import Image from "next/image";
import { Lightbox } from "./lightbox";
import clsx from "clsx";

interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
  aspectRatio?: "square" | "4/3" | "16/9" | "3/2" | "auto";
}

interface ImageGalleryProps {
  images: GalleryImage[];
  columns?: 1 | 2 | 3 | 4;
  enableLightbox?: boolean;
  aspectRatio?: "square" | "4/3" | "16/9" | "3/2" | "auto";
  objectFit?: "cover" | "contain" | "fill";
  uniformHeight?: boolean;
  forceUniformSize?: boolean;
}

export function ImageGallery({ 
  images, 
  columns = 3, 
  enableLightbox = true,
  aspectRatio = "4/3",
  objectFit = "cover",
  uniformHeight = false,
  forceUniformSize = true
}: ImageGalleryProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };

  const aspectRatioClasses = {
    square: "aspect-square",
    "4/3": "aspect-[4/3]",
    "16/9": "aspect-[16/9]",
    "3/2": "aspect-[3/2]",
    auto: ""
  };

  const objectFitClasses = {
    cover: "object-cover",
    contain: "object-contain",
    fill: "object-fill"
  };

  return (
    <div className={clsx(
      "grid gap-4",
      gridCols[columns],
      forceUniformSize && "items-start"
    )}>
      {images.map((image, index) => {
        // Force uniform sizing by overriding individual image aspect ratios
        const imageAspectRatio = forceUniformSize ? aspectRatio : (image.aspectRatio || aspectRatio);
        const imageObjectFit = objectFit;
        
        return (
          <div
            key={index}
            className={clsx(
              "flex flex-col items-center space-y-2",
              forceUniformSize && "h-full"
            )}
          >
            {enableLightbox ? (
              <Lightbox 
                src={image.src} 
                alt={image.alt} 
                caption={image.caption}
                className={clsx(
                  "relative w-full",
                  aspectRatioClasses[imageAspectRatio]
                )}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill={imageAspectRatio !== "auto"}
                  width={imageAspectRatio === "auto" ? 400 : undefined}
                  height={imageAspectRatio === "auto" ? 300 : undefined}
                  className={clsx(
                    "block rounded-lg border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow",
                    objectFitClasses[imageObjectFit],
                    imageAspectRatio === "auto" ? "w-full h-auto" : ""
                  )}
                  unoptimized
                />
              </Lightbox>
            ) : (
              <div className={clsx(
                "relative w-full",
                aspectRatioClasses[imageAspectRatio]
              )}>
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill={imageAspectRatio !== "auto"}
                  width={imageAspectRatio === "auto" ? 400 : undefined}
                  height={imageAspectRatio === "auto" ? 300 : undefined}
                  className={clsx(
                    "block rounded-lg border border-gray-200 dark:border-white/10 shadow-sm",
                    objectFitClasses[imageObjectFit],
                    imageAspectRatio === "auto" ? "w-full h-auto" : ""
                  )}
                  unoptimized
                />
              </div>
            )}
            {image.caption && (
              <p className="text-sm text-gray-700 dark:text-gray-300 italic text-center">
                {image.caption}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
