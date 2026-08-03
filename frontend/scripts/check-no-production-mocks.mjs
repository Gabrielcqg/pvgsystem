import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "src");
const blockedPatterns = [
  /\bmock(?:s|ed|Data|Handlers)?\b/i,
  /\bfake\b/i,
  /\bdummy\b/i,
  /hardcoded\s+token/i,
  /access_token\s*[:=]\s*["'`]/i,
  /service_role/i,
];

function collectFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["test", "__tests__", "fixtures"].includes(entry.name)) return [];
      return collectFiles(full);
    }
    return /\.(jsx?|tsx?|css)$/.test(entry.name) ? [full] : [];
  });
}

const failures = [];
for (const file of collectFiles(root)) {
  const text = fs.readFileSync(file, "utf8");
  for (const pattern of blockedPatterns) {
    if (pattern.test(text)) failures.push(`${path.relative(process.cwd(), file)}: ${pattern}`);
  }
}

if (failures.length) {
  console.error("Production source contains blocked test/static-data markers:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("No production test/static-data markers found.");
