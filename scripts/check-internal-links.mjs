import fs from "node:fs";
import path from "node:path";

const OUT_DIR = "out";
const SITE_ORIGIN = "https://blawby.com";
const LEGACY_PATHS = ["/lessons/", "/docs/"];
const ATTR_PATTERN = /\s(?:href|src)=["']([^"']+)["']/gi;
const errors = [];

function collectHtmlFiles(dir) {
  if (!fs.existsSync(dir)) {
    errors.push(`${dir} - missing export directory; run the build first`);
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return collectHtmlFiles(fullPath);
    }

    return entry.isFile() && entry.name.endsWith(".html") ? [fullPath] : [];
  });
}

function normalizeHtmlPath(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    decoded = pathname;
  }
  const cleanPath = decoded.replace(/\/$/, "");
  return cleanPath === "" ? "/index" : cleanPath;
}

function exportedFileExists(pathname) {
  const htmlPath = path.join(OUT_DIR, `${normalizeHtmlPath(pathname)}.html`);
  const indexPath = path.join(
    OUT_DIR,
    normalizeHtmlPath(pathname),
    "index.html",
  );

  return fs.existsSync(htmlPath) || fs.existsSync(indexPath);
}

for (const file of collectHtmlFiles(OUT_DIR).sort()) {
  const html = fs.readFileSync(file, "utf8");
  const links = [...html.matchAll(ATTR_PATTERN)].map(([, link]) => link);

  for (const link of links) {
    if (
      link.startsWith("#") ||
      link.startsWith("mailto:") ||
      link.startsWith("tel:") ||
      link.startsWith("data:") ||
      link.startsWith("javascript:")
    ) {
      continue;
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(link, SITE_ORIGIN);
    } catch {
      errors.push(`${file} - invalid link: ${link}`);
      continue;
    }

    if (parsedUrl.origin !== SITE_ORIGIN) {
      continue;
    }

    let isLegacy = false;
    for (const legacyPath of LEGACY_PATHS) {
      if (parsedUrl.pathname.startsWith(legacyPath)) {
        errors.push(`${file} - contains legacy internal link: ${link}`);
        isLegacy = true;
        break;
      }
    }

    if (isLegacy) {
      continue;
    }

    if (
      path.extname(parsedUrl.pathname) &&
      !parsedUrl.pathname.endsWith(".html")
    ) {
      continue;
    }

    if (!exportedFileExists(parsedUrl.pathname)) {
      errors.push(`${file} - broken internal link: ${link}`);
    }
  }
}

if (errors.length > 0) {
  console.error(`\n${errors.length} internal link issue(s) found:\n`);
  errors.forEach((error) => console.error(`  x ${error}`));
  process.exit(1);
}

console.log("Internal link check passed");
