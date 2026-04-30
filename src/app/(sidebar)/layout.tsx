import { SidebarLayout } from "@/components/sidebar-layout";
import { getArticles } from "@/data/articles";
import { getModules } from "@/data/lessons";
import type React from "react";

export default async function CourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const modules = await getModules();
  const articles = await getArticles();

  return (
    <SidebarLayout modules={modules} articles={articles}>
      {children}
    </SidebarLayout>
  );
}
