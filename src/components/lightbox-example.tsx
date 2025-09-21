import { ImageGallery } from "./image-gallery";
import { Lightbox } from "./lightbox";
import { LightboxImage } from "./lightbox-image";

// Example usage of the lightbox components
export function LightboxExample() {
  const sampleImages = [
    {
      src: "/api/placeholder/400/600", // Tall image
      alt: "Tall image 1",
      caption: "This is a tall image",
    },
    {
      src: "/api/placeholder/600/400", // Wide image
      alt: "Wide image 1",
      caption: "This is a wide image",
    },
    {
      src: "/api/placeholder/400/400", // Square image
      alt: "Square image 1",
      caption: "This is a square image",
    },
    {
      src: "/api/placeholder/800/300", // Very wide image
      alt: "Very wide image 1",
      caption: "This is a very wide image",
    },
    {
      src: "/api/placeholder/300/800", // Very tall image
      alt: "Very tall image 1",
      caption: "This is a very tall image",
    },
    {
      src: "/api/placeholder/500/500", // Another square
      alt: "Square image 2",
      caption: "Another square image",
    },
  ];

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold">Lightbox Examples</h2>

        {/* Individual lightbox image */}
        <div className="mb-8">
          <h3 className="mb-2 text-lg font-semibold">
            Individual Lightbox Image
          </h3>
          <LightboxImage
            src="/api/placeholder/400/300"
            alt="Click to open in lightbox"
            caption="This image opens in a lightbox when clicked"
            width={300}
            height={200}
          />
        </div>

        {/* Custom lightbox with different content */}
        <div className="mb-8">
          <h3 className="mb-2 text-lg font-semibold">
            Custom Lightbox Trigger
          </h3>
          <Lightbox
            src="/api/placeholder/800/600"
            alt="High resolution image"
            caption="This is a high resolution version of the image"
          >
            <div className="inline-block cursor-pointer rounded-lg bg-blue-100 p-4 transition-colors hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800">
              <p className="font-medium text-blue-800 dark:text-blue-200">
                Click here to open lightbox
              </p>
            </div>
          </Lightbox>
        </div>

        {/* Image gallery with uniform sizing (default) */}
        <div className="mb-8">
          <h3 className="mb-2 text-lg font-semibold">
            Uniform Size Gallery (Default)
          </h3>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            All images forced to 4:3 aspect ratio with object-cover
          </p>
          <ImageGallery
            images={sampleImages}
            columns={3}
            enableLightbox={true}
            aspectRatio="4/3"
            objectFit="cover"
            forceUniformSize={true}
          />
        </div>

        {/* Image gallery with square aspect ratio */}
        <div className="mb-8">
          <h3 className="mb-2 text-lg font-semibold">Square Gallery</h3>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            All images forced to square aspect ratio
          </p>
          <ImageGallery
            images={sampleImages}
            columns={3}
            enableLightbox={true}
            aspectRatio="square"
            objectFit="cover"
            forceUniformSize={true}
          />
        </div>

        {/* Image gallery with natural aspect ratios (masonry-like) */}
        <div className="mb-8">
          <h3 className="mb-2 text-lg font-semibold">
            Natural Aspect Ratios (Masonry-like)
          </h3>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Images keep their natural aspect ratios - creates masonry effect
          </p>
          <ImageGallery
            images={sampleImages}
            columns={3}
            enableLightbox={true}
            aspectRatio="auto"
            objectFit="contain"
            forceUniformSize={false}
          />
        </div>

        {/* Image gallery with object-contain */}
        <div>
          <h3 className="mb-2 text-lg font-semibold">Object-Contain Gallery</h3>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Uniform containers with object-contain to show full images
          </p>
          <ImageGallery
            images={sampleImages}
            columns={3}
            enableLightbox={true}
            aspectRatio="4/3"
            objectFit="contain"
            forceUniformSize={true}
          />
        </div>
      </div>
    </div>
  );
}
