import fs from "fs";
import path from "path";
import { parseHowToStepsFromMarkdown, getHowToSchema } from "../src/utils/howto-schema";

const lessonsDir = path.join(process.cwd(), "src/data/lessons");
const files = fs.readdirSync(lessonsDir).filter(f => f.endsWith(".mdx"));

let allValid = true;

for (const file of files) {
  const filePath = path.join(lessonsDir, file);
  const content = fs.readFileSync(filePath, "utf-8");
  const steps = parseHowToStepsFromMarkdown(content);
  if (steps.length === 0) {
    console.warn(`❌ No HowTo steps found in ${file}`);
    allValid = false;
    continue;
  }
  try {
    const schema = getHowToSchema({
      name: file.replace(/\.mdx$/, ""),
      description: steps.map(s => s.text).join(" ").slice(0, 160),
      steps,
    });
    // Basic schema validation: must have at least 2 steps
    if (!schema.step || schema.step.length < 2) {
      console.warn(`❌ Not enough HowTo steps in ${file}`);
      allValid = false;
    } else {
      console.log(`✅ ${file}: ${schema.step.length} HowTo steps parsed`);
    }
  } catch (e) {
    console.error(`❌ Error generating schema for ${file}:`, e);
    allValid = false;
  }
}

if (!allValid) {
  process.exit(1);
} else {
  console.log("\nAll lessons have valid HowTo steps and schema.");
} 