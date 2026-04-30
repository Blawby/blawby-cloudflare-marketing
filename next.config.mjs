import createMDX from "@next/mdx";
import { dirname, join } from "path";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkFrontmatter, remarkGfm],
    rehypePlugins: [],
  },
});

const nextConfig = {
  turbopack: {},
  outputFileTracingRoot: join(__dirname),
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  images: {
    remotePatterns: [
      new URL("https://assets.tailwindcss.com/templates/compass/**"),
    ],
    domains: [],
    unoptimized: true,
  },
  // Configure for Cloudflare Pages
  output: "export",
};

export default withMDX(nextConfig);
