import { clsx } from "clsx";
import { MediaCard } from "./media-card";

type DocPlaceholderKind = "screenshot" | "video" | "diagram";

const KIND_STYLES: Record<
  DocPlaceholderKind,
  { label: string; aspect: string; icon: React.ReactNode }
> = {
  screenshot: {
    label: "Screenshot",
    aspect: "16 / 9",
    icon: (
      <svg
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
        className="h-4 w-4"
      >
        <path d="M2.5 3.5A1.5 1.5 0 0 1 4 2h2.31a1 1 0 0 1 .85.47l.5.83A1 1 0 0 0 8.5 3.8H12a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 12 12.8H4a1.5 1.5 0 0 1-1.5-1.5V3.5Zm5.5 6.3a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      </svg>
    ),
  },
  video: {
    label: "Video",
    aspect: "16 / 9",
    icon: (
      <svg
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
        className="h-4 w-4"
      >
        <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h6A1.5 1.5 0 0 1 11 4.5v.94l3-1.7v8.52l-3-1.7v.94A1.5 1.5 0 0 1 9.5 13h-6A1.5 1.5 0 0 1 2 11.5v-7Z" />
      </svg>
    ),
  },
  diagram: {
    label: "Diagram",
    aspect: "16 / 9",
    icon: (
      <svg
        viewBox="0 0 16 16"
        fill="currentColor"
        aria-hidden="true"
        className="h-4 w-4"
      >
        <path d="M2.5 2.5a1 1 0 0 1 1-1H6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1v-2Zm6 0a1 1 0 0 1 1-1H12a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9.5a1 1 0 0 1-1-1v-2ZM2.5 8.5a1 1 0 0 1 1-1H6a1 1 0 0 1 1 1V13a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V8.5Zm6 1.5a1 1 0 0 1 1-1H12a1 1 0 0 1 1 1V13a1 1 0 0 1-1 1H9.5a1 1 0 0 1-1-1v-3Z" />
      </svg>
    ),
  },
};

export function DocPlaceholder({
  kind = "screenshot",
  src,
  caption,
  description,
}: {
  kind?: DocPlaceholderKind;
  src: string;
  caption?: string;
  description?: string;
}) {
  const styles = KIND_STYLES[kind];

  return (
    <div className="my-10 relative group/doc-ph">
      <MediaCard
        src={undefined} // Force placeholder state
        caption={caption || `Placeholder: ${src}`}
        ratio={styles.aspect}
      />
      
      {/* Overlay placeholder info */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-y-2 p-6 text-center pointer-events-none">
        <div className="flex items-center gap-x-2 text-[10px] font-bold uppercase tracking-widest text-accent">
          {styles.icon}
          <span>{styles.label} TODO</span>
        </div>
        {description && (
          <p className="max-w-sm text-sm leading-snug text-ink-2 opacity-80">{description}</p>
        )}
        <code className="mt-1 break-all rounded bg-ink/5 px-2 py-1 font-mono text-[10px] text-ink-2 dark:bg-white/5">
          {src}
        </code>
      </div>

      {/* Warning border for development visibility */}
      <div className="absolute inset-0 border-2 border-dashed border-accent/20 rounded-lg pointer-events-none group-hover/doc-ph:border-accent/40 transition-colors" />
    </div>
  );
}
