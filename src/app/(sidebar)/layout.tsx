import { SidebarLayout } from "@/components/sidebar-layout";
import { getModules } from "@/data/lessons";
import { getArticles } from "@/data/articles";
import { getPages } from "@/data/pages";
import type React from "react";

export default async function CourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const modules = await getModules();
  const articles = await getArticles();
  const pages = await getPages();
  
  return (
    <SidebarLayout modules={modules} articles={articles} pages={pages}>
      {children}
    </SidebarLayout>
  );
}
