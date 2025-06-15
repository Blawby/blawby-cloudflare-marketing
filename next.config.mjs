import createMDX from "@next/mdx";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

const nextConfig = {
  turbopack: {},
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  images: {
    remotePatterns: [
      new URL("https://assets.tailwindcss.com/templates/compass/**"),
    ],
    domains: [],
    unoptimized: true
  },
  // Configure for Cloudflare Pages
  output: 'export',
  // Optimize build output
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(js|jsx)$/,
      include: [/node_modules\/react-pay-icons/],
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-react']
        }
      }
    });

    // Split chunks into smaller pieces
    config.optimization.splitChunks = {
      chunks: 'all',
      maxInitialRequests: 25,
      minSize: 20000,
      maxSize: 24000000, // Keep chunks under 24MB
      cacheGroups: {
        default: false,
        vendors: false,
        commons: {
          name: 'commons',
          chunks: 'all',
          minChunks: 2,
          reuseExistingChunk: true,
        },
        lib: {
          test(module) {
            return module.size() > 160000;
          },
          name(module) {
            const moduleFileName = module.libIdent ? module.libIdent({ context: __dirname }) : module.identifier();
            return `chunk-${moduleFileName.replace(/[^a-zA-Z0-9]/g, '-')}`;
          },
          chunks: 'all',
          minChunks: 1,
          reuseExistingChunk: true,
        },
      },
    };
    return config;
  },
  // Configure static file serving
  async rewrites() {
    return [
      {
        source: '/site.webmanifest',
        destination: '/public/site.webmanifest'
      }
    ]
  },
};

export default withMDX(nextConfig);
