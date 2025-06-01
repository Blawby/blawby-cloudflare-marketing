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
  video: {
    thumbnail: string;
    duration: number;
    url: string;
  } | null;
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
  return (await import(`@/data/lessons/${slug}.mdx`)).default;
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
        id: "payment-processing",
        title: "Payments",
        description: "Accept credit card, debit card, and eCheck payments with ease. Ensure compliance with ABA and IOLTA guidelines.",
        video: null,
      },
      {
        id: "invoicing",
        title: "Invoicing",
        description: "Streamline your billing process with automated invoicing and payment collection.",
        video: null,
      },
      {
        id: "clients",
        title: "Clients",
        description: "Efficiently manage your client information, communications, and payment history.",
        video: null,
      },
      {
        id: "payouts",
        title: "Payouts",
        description: "Manage your firm's cash flow with secure and efficient payout processing.",
        video: null,
      },
      {
        id: "pricing",
        title: "Pricing",
        description: "Simple, transparent pricing with no hidden fees. Pay-as-you-go with monthly billing.",
        video: null,
      }
    ],
  },
  {
    id: "resources",
    title: "Resources & Guides",
    description: "Helpful guides and best practices for legal payment processing.",
    lessons: [
      {
        id: "iolta-compliance",
        title: "IOLTA Compliance Guide",
        description: "Understanding trust account requirements for legal payments.",
        video: null,
      }
    ],
  },
  {
    id: "legal",
    title: "Legal Information",
    description: "Legal documents, privacy policy, and terms of service.",
    lessons: [
      {
        id: "privacy",
        title: "Privacy Policy",
        description: "Our commitment to protecting your privacy and personal data.",
        video: null,
      },
      {
        id: "terms",
        title: "Terms of Service",
        description: "Terms and conditions for using Blawby's services.",
        video: null,
      },
    ],
  },
];
