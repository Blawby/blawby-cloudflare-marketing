import fs from "node:fs";
import path from "node:path";

const OUT_DIR = "out";
const errors = [];
const warnings = [];
const LEGACY_PATHS = ["/lessons/", "/docs/"];

function collectHtmlFiles(dir) {
  if (!fs.existsSync(dir)) {
    errors.push(`${dir} - missing export directory; run the build first`);
    return [];
  }

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return collectHtmlFiles(fullPath);
      }

      return entry.isFile() && entry.name.endsWith(".html") ? [fullPath] : [];
    })
    .sort();
}

function filePathToUrl(file) {
  const relativePath = path.relative(OUT_DIR, file).replaceAll(path.sep, "/");

  if (relativePath === "index.html") {
    return "/";
  }

  return `/${relativePath.replace(/(?:\/index)?\.html$/, "")}`;
}

function decodeHtmlEntities(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function stripTags(value) {
  return value.replace(/<[^>]*>/g, "").trim();
}

const files = collectHtmlFiles(OUT_DIR);
let checkedPages = 0;
let skippedPages = 0;

for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const url = filePathToUrl(file);
  const isNoIndex =
    /<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["'][^"']*noindex/i.test(
      html,
    ) ||
    /<meta\b[^>]*\bcontent=["'][^"']*noindex[^>]*\bname=["']robots["']/i.test(
      html,
    );

  if (isNoIndex) {
    skippedPages += 1;
    continue;
  }

  checkedPages += 1;

  if (!/<title>[^<]+<\/title>/i.test(html)) {
    errors.push(`${url} - missing <title>`);
  }

  if (
    !/<meta\b[^>]*\bname=["']description["'][^>]*\bcontent=["'][^"']*["'][^>]*>/i.test(
      html,
    ) &&
    !/<meta\b[^>]*\bcontent=["'][^"']*["'][^>]*\bname=["']description["'][^>]*>/i.test(
      html,
    )
  ) {
    errors.push(`${url} - missing meta description`);
  }

  if (!/<link\s+[^>]*rel=["']canonical["'][^>]*>/i.test(html)) {
    errors.push(`${url} - missing canonical`);
  }

  if (!/<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>/i.test(html)) {
    errors.push(`${url} - missing JSON-LD`);
  }

  if (/<title>\s*Blawby\s*<\/title>/i.test(html)) {
    errors.push(`${url} - generic title, needs real title`);
  }

  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  if (titleMatch) {
    const title = decodeHtmlEntities(titleMatch[1]).trim();

    if (title.length < 30) {
      warnings.push(
        `${url} - title too short (${title.length} chars, aim for 50-60)`,
      );
    }

    if (title.length > 60) {
      warnings.push(`${url} - title too long (${title.length} chars)`);
    }
  }

  let descriptionContent = null;
  const metaTags = html.matchAll(/<meta\b([^>]*?)>/gi);
  for (const [_, attributes] of metaTags) {
    const isDescription = /\bname=["']description["']/i.test(attributes);
    if (isDescription) {
      const contentMatch = attributes.match(/\bcontent=["']([^"']*)["']/i);
      if (contentMatch) {
        descriptionContent = contentMatch[1];
        break;
      }
    }
  }

  if (descriptionContent !== null) {
    const description = decodeHtmlEntities(descriptionContent).trim();

    if (description.length < 100) {
      warnings.push(
        `${url} - description too short (${description.length} chars, aim for 150-160)`,
      );
    }

    if (description.length > 160) {
      warnings.push(
        `${url} - description too long (${description.length} chars)`,
      );
    }
  }

  let canonical = null;
  const linkTags = html.matchAll(/<link\s+([^>]*?)>/gi);
  for (const [_, attributes] of linkTags) {
    if (/\brel=["']canonical["']/i.test(attributes)) {
      const hrefMatch = attributes.match(/\bhref=["']([^"']*)["']/i);
      if (hrefMatch) {
        canonical = hrefMatch[1];
        break;
      }
    }
  }

  if (canonical) {
    try {
      const urlObj = new URL(canonical);
      if (urlObj.protocol !== "https:" || urlObj.hostname !== "blawby.com") {
        errors.push(`${url} - canonical points to wrong domain: ${canonical}`);
      }
    } catch {
      errors.push(`${url} - invalid canonical URL: ${canonical}`);
    }

    for (const legacyPath of LEGACY_PATHS) {
      if (canonical.includes(legacyPath)) {
        errors.push(
          `${url} - canonical still points to legacy ${legacyPath} path`,
        );
      }
    }
  }

  if (!/<meta\s+[^>]*property=["']og:image["'][^>]*>/i.test(html)) {
    warnings.push(`${url} - missing og:image`);
  }

  const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  if (h1Matches.length === 0) {
    warnings.push(`${url} - missing H1`);
  }

  if (h1Matches.length > 1) {
    warnings.push(`${url} - multiple H1 tags (${h1Matches.length})`);
  }

  const h1Texts = h1Matches.map((match) =>
    decodeHtmlEntities(stripTags(match[1])),
  );
  if (new Set(h1Texts).size !== h1Texts.length) {
    warnings.push(`${url} - duplicate H1 text`);
  }

  const jsonLdMatches = [
    ...html.matchAll(
      /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ];
  for (const match of jsonLdMatches) {
    try {
      JSON.parse(decodeHtmlEntities(match[1]));
    } catch {
      errors.push(`${url} - invalid JSON-LD`);
    }
  }

  for (const legacyPath of LEGACY_PATHS) {
    if (
      html.includes(`href="${legacyPath}`) ||
      html.includes(`href='${legacyPath}`)
    ) {
      errors.push(`${url} - contains legacy link to ${legacyPath}`);
    }
  }
}

if (warnings.length > 0) {
  console.warn(`\n${warnings.length} SEO warning(s):\n`);
  warnings.forEach((warning) => console.warn(`  ! ${warning}`));
}

if (errors.length > 0) {
  console.error(`\n${errors.length} SEO issue(s) found:\n`);
  errors.forEach((error) => console.error(`  x ${error}`));
  process.exit(1);
}

console.log(
  `SEO check passed (${checkedPages} indexable pages, ${skippedPages} noindex pages skipped)`,
);
