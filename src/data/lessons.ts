export type Module = {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
};

export type Lesson = {
  id: string;
  title: string;
  description: string;
  contentType: "lesson" | "article" | "guide";
  video: {
    thumbnail: string;
    duration: number;
    url: string;
  } | null;
  // Article-specific metadata
  category?: string;
  tags?: string[];
  datePublished?: string;
  dateModified?: string;
  author?: string;
};

export function getModules(): Module[] {
  return lessons;
}

export async function getLesson(
  slug: string,
): Promise<(Lesson & { module: Module; next: Lesson | null }) | null> {
  let module = lessons.find(({ lessons }) =>
    lessons.some(({ id }) => id === slug),
  );

  if (!module) {
    return null;
  }

  let index = module.lessons.findIndex(({ id }) => id === slug);

  return {
    ...module.lessons[index],
    module,
    next: index < module.lessons.length - 1 ? module.lessons[index + 1] : null,
  };
}

export async function getLessonContent(slug: string) {
  if (slug === "privacy" || slug === "terms") {
    return (await import(`@/data/legal/${slug}.mdx`)).default;
  }
  
  // First try to find the lesson to determine its content type
  const lesson = await getLesson(slug);
  if (!lesson) {
    throw new Error(`Lesson not found: ${slug}`);
  }
  
  // Import from appropriate directory based on content type
  if (lesson.contentType === "guide" || lesson.contentType === "article") {
    return (await import(`@/data/articles/${slug}.mdx`)).default;
  } else {
    return (await import(`@/data/lessons/${slug}.mdx`)).default;
  }
}

const lessons = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Learn how to get started with Blawby's legal payment solutions.",
    lessons: [
      {
        id: "get-started",
        title: "Quick Start Guide",
        description: "Get up and running with Blawby's payment processing platform.",
        contentType: "lesson" as const,
        category: "lessons",
        video: null,
      }
    ],
  },
  {
    id: "payments",
    title: "Legal Payments Solutions",
    description: "Compliant credit card payments and invoicing solutions for legal practices.",
    lessons: [
      {
        id: "payments",
        title: "Payments",
        description: "Accept credit card, debit card, and ACH/Bank Transfer payments with ease. Ensure compliance with ABA and IOLTA guidelines.",
        contentType: "lesson" as const,
        category: "lessons",
        video: null,
      },
      {
        id: "invoicing",
        title: "Invoicing",
        description: "Streamline your billing process with automated invoicing and payment collection.",
        contentType: "lesson" as const,
        category: "lessons",
        video: null,
      },
      {
        id: "clients",
        title: "Clients",
        description: "Efficiently manage your client information, communications, and payment history.",
        contentType: "lesson" as const,
        category: "lessons",
        video: null,
      },
      {
        id: "payouts",
        title: "Payouts",
        description: "Manage your firm's cash flow with secure and efficient payout processing.",
        contentType: "lesson" as const,
        category: "lessons",
        video: null,
      },
    ],
  },
  {
    id: "ai-intake",
    title: "AI Legal Intake",
    description: "Intelligent client intake powered by AI to capture leads and streamline your practice.",
    lessons: [
      {
        id: "ai-legal-intake",
        title: "AI Legal Intake",
        description: "Set up and use Blawby's AI-powered legal intake chatbot to automatically collect client information and process consultation fees.",
        contentType: "lesson" as const,
        category: "lessons",
        video: null,
      },
    ],
  },
];
