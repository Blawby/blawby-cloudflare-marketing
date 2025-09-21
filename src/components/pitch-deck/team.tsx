export function Team() {
  return (
    <section className="mb-16">
      <h2 id="team" className="text-3xl font-bold text-gray-950 dark:text-white mb-6">Team</h2>
      
      <div className="mb-8">
        <h3 id="chris-luke-founder-ceo" className="text-2xl font-semibold text-gray-950 dark:text-white mb-4">Chris Luke – Founder & CEO</h3>
        <ul className="space-y-2 text-gray-700 dark:text-gray-300 mb-4">
          <li>15+ years SaaS, data & analytics expertise</li>
          <li>Former CTO, featured speaker at Google AMP Conference</li>
          <li>Build-in-public strategy on <a href="https://twitch.tv/paulchrisluke" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Twitch</a></li>
        </ul>
        <div className="aspect-video">
          <iframe 
            width="560" 
            height="315" 
            src="https://www.youtube.com/embed/96FNOI8hb2s" 
            title="YouTube video player" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            referrerPolicy="strict-origin-when-cross-origin" 
            allowFullScreen
            className="w-full h-full rounded-lg"
          />
        </div>
        {/* TODO: Insert image: Chris speaking at Google AMP Conference */}
      </div>

      <div>
        <h3 id="gitesh-senior-software-engineer" className="text-2xl font-semibold text-gray-950 dark:text-white mb-4">Gitesh – Senior Software Engineer</h3>
        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
          <li>1+ year dedicated, unpaid technical leadership</li>
          <li>Quality assurance & architectural guidance</li>
          <li>$50k/year salary (no equity) upon funding</li>
        </ul>
      </div>
    </section>
  );
}
