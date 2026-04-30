import { Navbar } from "@/components/navbar";
import { SidebarLayout } from "@/components/sidebar-layout";
import { getArticles } from "@/data/articles";
import { getModules } from "@/data/lessons";

export default async function CourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const modules = await getModules();
  const articles = await getArticles();

  return (
    <div className="min-h-screen">
      <Navbar />
      <SidebarLayout modules={modules} articles={articles}>
        {children}
      </SidebarLayout>
    </div>
  );
}
