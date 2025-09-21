"use client";

import { Lightbox } from "./lightbox";
import { LightboxImage } from "./lightbox-image";
import { ImageGallery } from "./image-gallery";

export function LightboxTest() {
  const testImages = [
    {
      src: "https://picsum.photos/400/300?random=1",
      alt: "Test image 1",
      caption: "This is a test image"
    },
    {
      src: "https://picsum.photos/600/400?random=2", 
      alt: "Test image 2",
      caption: "Another test image"
    },
    {
      src: "https://picsum.photos/300/500?random=3",
      alt: "Test image 3",
      caption: "Third test image"
    }
  ];

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Lightbox Test</h1>
      
      {/* Test individual lightbox image */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Individual Lightbox Image</h2>
        <LightboxImage 
          src="https://picsum.photos/400/300?random=4"
          alt="Click to open in lightbox"
          caption="This should open in a lightbox when clicked"
          width={300}
          height={200}
        />
      </div>

      {/* Test custom lightbox trigger */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Custom Lightbox Trigger</h2>
        <Lightbox 
          src="https://picsum.photos/800/600?random=5"
          alt="High resolution image"
          caption="This is a high resolution version"
        >
          <div className="inline-block p-4 bg-blue-100 dark:bg-blue-900 rounded-lg cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
            <p className="text-blue-800 dark:text-blue-200 font-medium">
              Click here to open lightbox
            </p>
          </div>
        </Lightbox>
      </div>

      {/* Test image gallery with lightbox */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Image Gallery with Lightbox</h2>
        <ImageGallery 
          images={testImages} 
          columns={3} 
          enableLightbox={true}
          aspectRatio="4/3"
          objectFit="cover"
          forceUniformSize={true}
        />
      </div>
    </div>
  );
}
