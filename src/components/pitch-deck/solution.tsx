import { PlayIcon } from "@/icons/play-icon";

export function Solution() {
  return (
    <section className="mb-16">
      <h2 id="solution" className="text-3xl font-bold text-gray-950 dark:text-white mb-6">Solution</h2>
      <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-lg mb-6">
        <li>• IOLTA-compliant payments</li>
        <li>• AI-powered intake & scheduling</li>
        <li>• Automated billing & retainers</li>
        <li>• Lightweight matter management</li>
      </ul>
        
        {/* TODO: Insert screenshot of intake chatbot conversation */}
        
        <div className="mt-6">
          <a 
            href="https://ai.blawby.com/?teamId=north-carolina-legal-services&position=inline"
            className="inline-flex items-center gap-x-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
          >
            <PlayIcon className="fill-current" />
            Live AI Intake Demo
          </a>
        </div>
    </section>
  );
}
