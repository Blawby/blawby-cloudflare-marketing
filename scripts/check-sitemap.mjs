import fs from "node:fs";
import path from "node:path";

const OUT_DIR = "out";
const SITEMAP_PATH = path.join(OUT_DIR, "sitemap.xml");
// Current default export has 17 sitemap URLs. Keep this near 80% so a small
// content change is fine, but a category/content registry regression fails CI.
const MIN_URLS = 14;
const errors = [];

if (!fs.existsSync(SITEMAP_PATH)) {
  errors.push(`${SITEMAP_PATH} - missing sitemap; run the build first`);
} else {
  const sitemap = fs.readFileSync(SITEMAP_PATH, "utf8");
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(
    ([, url]) => url,
  );
  const uniqueUrls = new Set(urls);

  if (urls.length < MIN_URLS) {
    errors.push(
      `sitemap has ${urls.length} URLs; expected at least ${MIN_URLS}`,
    );
  }

  if (uniqueUrls.size !== urls.length) {
    errors.push("sitemap contains duplicate <loc> entries");
  }

  if (!urls.includes("https://blawby.com")) {
    errors.push("sitemap is missing the homepage URL");
  }

  for (const url of urls) {
    let parsedUrl;

    try {
      parsedUrl = new URL(url);
    } catch {
      errors.push(`${url} - invalid sitemap URL`);
      continue;
    }

    if (parsedUrl.origin !== "https://blawby.com") {
      errors.push(`${url} - sitemap URL must use https://blawby.com`);
      continue;
    }

    const pagePath = parsedUrl.pathname === "/" ? "/index" : parsedUrl.pathname;
    const htmlPath = path.join(OUT_DIR, `${pagePath}.html`);
    const indexPath = path.join(OUT_DIR, pagePath, "index.html");

    if (!fs.existsSync(htmlPath) && !fs.existsSync(indexPath)) {
      errors.push(`${url} - sitemap URL has no exported HTML page`);
    }
  }

  console.log(`Sitemap contains ${urls.length} URLs`);
}

if (errors.length > 0) {
  console.error(`\n${errors.length} sitemap issue(s) found:\n`);
  errors.forEach((error) => console.error(`  x ${error}`));
  process.exit(1);
}

console.log("Sitemap check passed");
