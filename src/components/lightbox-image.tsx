import Image from "next/image";
import { Lightbox } from "./lightbox";

interface LightboxImageProps {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  className?: string;
  lightboxClassName?: string;
}

export function LightboxImage({
  src,
  alt,
  caption,
  width = 400,
  height = 300,
  className,
  lightboxClassName,
}: LightboxImageProps) {
  return (
    <Lightbox
      src={src}
      alt={alt}
      caption={caption}
      className={lightboxClassName}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`block rounded-lg border border-gray-200 object-cover shadow-sm transition-shadow hover:shadow-md dark:border-white/10 ${className || ""}`}
      />
    </Lightbox>
  );
}
