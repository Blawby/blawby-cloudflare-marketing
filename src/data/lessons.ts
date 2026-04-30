import { getAllContent, getContent, getContentByCategory, type ContentItem } from "@/lib/content";

export type Module = {
  id: string;
  title: string;
  description: string;
  lessons: ContentItem[];
};

/**
 * Returns the module structure for the sidebar.
 * Lessons are dynamically mapped to their respective modules based on id.
 */
export async function getModules(): Promise<Module[]> {
  const all = await getAllContent();
  const allLessons = all.filter(item => item.origin === "lessons");

  return moduleRegistry.map((mod) => ({
    ...mod,
    lessons: mod.lessonIds
      .map((id) => allLessons.find((l) => l.slug === id))
      .filter((l): l is ContentItem => !!l)
      .map(l => ({ ...l, id: l.slug })), // Add id for backward compat
  }));
}

export async function getLesson(
  slug: string,
): Promise<(ContentItem & { id: string; module: any; next: any | null }) | null> {
  const modules = await getModules();
  let module = modules.find(({ lessons }) =>
    lessons.some((l) => l.slug === slug),
  );

  if (!module) return null;

  let index = module.lessons.findIndex((l) => l.slug === slug);

  const item = module.lessons[index];

  return {
    ...item,
    id: item.slug,
    module,
    next: index < module.lessons.length - 1 ? module.lessons[index + 1] : null,
  };
}


// The moduleRegistry now only defines grouping and ordering of modules
const moduleRegistry = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Learn how to get started with Blawby's legal payment solutions.",
    lessonIds: ["get-started"],
  },
  {
    id: "payments",
    title: "Legal Payments Solutions",
    description: "Compliant credit card payments and invoicing solutions for legal practices.",
    lessonIds: ["payments", "invoicing", "clients", "payouts"],
  },
  {
    id: "ai-intake",
    title: "AI Legal Intake",
    description: "Intelligent client intake powered by AI to capture leads and streamline your practice.",
    lessonIds: ["ai-powered-legal-intake-chatbot"],
  },
];
