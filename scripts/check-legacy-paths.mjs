import fs from "node:fs";
import path from "node:path";

const SEARCH_DIRS = ["src"];
const EXTENSIONS = new Set([".js", ".jsx", ".mdx", ".mjs", ".ts", ".tsx"]);
const LEGACY_PATHS = ["/lessons/", "/docs/"];
const errors = [];

function collectSourceFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return collectSourceFiles(fullPath);
    }

    return entry.isFile() && EXTENSIONS.has(path.extname(entry.name))
      ? [fullPath]
      : [];
  });
}

for (const file of SEARCH_DIRS.flatMap(collectSourceFiles).sort()) {
  const source = fs.readFileSync(file, "utf8");

  for (const legacyPath of LEGACY_PATHS) {
    const pattern = new RegExp(
      `["'\`]${legacyPath.replaceAll("/", "\\/")}`,
      "g",
    );

    if (pattern.test(source)) {
      errors.push(`${file} - contains legacy ${legacyPath} URL`);
    }
  }
}

if (errors.length > 0) {
  console.error(`\n${errors.length} legacy path issue(s) found:\n`);
  errors.forEach((error) => console.error(`  x ${error}`));
  process.exit(1);
}

console.log("Legacy path check passed");
