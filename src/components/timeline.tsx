interface TimelineItem {
  id: string;
  date: string;
  title: string;
  description: string;
  link?: {
    text: string;
    href: string;
  };
}

interface TimelineProps {
  items: TimelineItem[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <ol className="relative border-s border-gray-200 dark:border-white/10 list-none">
  {items.map((item, index) => (
    <li
      key={item.id}
      className={`relative ms-6 ${index < items.length - 1 ? "mb-10" : ""}`}
    >
      {/* Dot marker */}
      <div className="absolute -start-1.5 mt-1.5 h-3 w-3 rounded-full border border-white dark:border-gray-900 bg-gradient-to-r from-[var(--color-accent-gradient-from)] to-[var(--color-accent-gradient-to)] dark:from-[var(--color-accent-gradient-from-dark)] dark:to-[var(--color-accent-gradient-to-dark)]"></div>

      {/* Date */}
      <time className="mb-1 block text-sm font-normal leading-none text-gray-500 dark:text-gray-400">
        {item.date}
      </time>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-950 dark:text-white">
        {item.title}
      </h3>

      {/* Description */}
      <p className={`text-base font-normal text-gray-700 dark:text-gray-300 ${item.link ? "mb-4" : ""}`}>
        {item.description}
      </p>

      {item.link && (
        <a
          href={item.link.href}
          className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-950 hover:bg-gray-50 hover:text-blue-600 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-white/10 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:hover:text-blue-400"
        >
          {item.link.text}
        </a>
      )}
    </li>
  ))}
</ol>

  );
}
