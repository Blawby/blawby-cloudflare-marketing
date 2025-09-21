import { ImageGallery } from "@/components/image-gallery";

export function Traction() {
  return (
    <section className="mb-16">
      <h2 id="traction-validation" className="text-3xl font-bold text-gray-950 dark:text-white mb-6">Traction & Validation</h2>
      <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-lg">
        <li>• <strong>Beta client live:</strong> <a href="https://northcarolinalegalservices.org" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">North Carolina Legal Services (NCLS)</a></li>
        <li>• <strong>Revenue proof:</strong> $10k+ processed in first month</li>
        <li>• <strong>Retention:</strong> NCLS continues subscription through development</li>
        <li>• <strong>Roadmap:</strong> Matter Management live, Scheduling rolling out</li>
      </ul>
      
      <div className="mt-8">
        <h3 id="client-management-interface" className="text-xl font-semibold text-gray-950 dark:text-white mb-4">Client Management Interface</h3>
        <ImageGallery
          images={[
            {
              src: "https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/5a0bfa71-2562-42eb-4fbf-638562200400/public",
              alt: "Client List Interface",
              caption: "Figure 6: Client management interface showing organized contact information and matter associations"
            },
            {
              src: "https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/2e0073b0-bd20-451a-ccc3-f75cceb20e00/public",
              alt: "Create Client Interface",
              caption: "Figure 7: Intuitive client onboarding form with automated data validation and matter linking"
            },
            {
              src: "https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/53d99077-3fa2-47b4-fb6f-fc9ad18b4e00/public",
              alt: "Create Matter Interface",
              caption: "Figure 8: Comprehensive matter management system with case tracking and billing integration"
            }
          ]}
          columns={3}
        />
      </div>
    </section>
  );
}
