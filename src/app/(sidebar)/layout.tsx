import { Navbar } from "@/components/navbar";
import { SidebarLayout } from "@/components/sidebar-layout";
import { getAllContent } from "@/lib/content";
import { getModules } from "@/data/lessons";

export default async function CourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const modules = await getModules();
  const allContent = await getAllContent();

  return (
    <div className="min-h-screen">
      <Navbar />
      <SidebarLayout modules={modules} allContent={allContent}>
        {children}
      </SidebarLayout>
    </div>
  );
}
