import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  detectProblems,
  findReplacementToolOpportunities,
  inferToolCategory,
  opportunitiesToCsv,
  parseInput
} from "../src/index.mjs";

const root = new URL("../", import.meta.url);
const requiredFiles = [
  "package.json",
  "README.md",
  "PRIVACY.md",
  "PUBLISH_BLOCKERS.md",
  "src/index.mjs",
  "bin/adpages-replacement-tool-finder.mjs",
  "examples/input.csv",
  "examples/opportunities.json",
  "scripts/check.mjs",
  "scripts/smoke.mjs"
];
const localSourceFiles = [
  "src/index.mjs",
  "bin/adpages-replacement-tool-finder.mjs",
  "scripts/check.mjs",
  "scripts/smoke.mjs"
];
const networkPattern = new RegExp([
  "fe" + "tch\\s*\\(",
  "XML" + "HttpRequest",
  "send" + "Beacon",
  "Web" + "Socket",
  "Event" + "Source",
  "node:" + "https",
  "node:" + "http",
  "ax" + "ios",
  "chee" + "rio",
  "play" + "wright",
  "pup" + "peteer"
].join("|"), "i");
const credentialPattern = new RegExp([
  "API" + "_KEY",
  "SEC" + "RET",
  "TOK" + "EN",
  "PASS" + "WORD",
  "PRIVATE" + "_KEY"
].join("|"), "i");

async function main() {
  const contents = new Map();
  for (const file of requiredFiles) {
    const content = await readText(file);
    contents.set(file, content);
    assert(content.trim().length > 0, `${file} must not be empty`);
  }

  const packageJson = JSON.parse(contents.get("package.json"));
  assert.equal(packageJson.name, "@a1local/adpages-replacement-tool-finder");
  assert.equal(packageJson.type, "module");
  assert.notEqual(packageJson.private, true, "package must not be private after public package prep");
  assert.equal(packageJson.license, "MIT");
  assert.equal(packageJson.publishConfig.access, "public");
  assert(packageJson.repository.url.includes("github.com/a1local/adpages-replacement-tool-finder"));
  assert.equal(packageJson.bin["adpages-replacement-tool-finder"], "./bin/adpages-replacement-tool-finder.mjs");
  assert(!packageJson.dependencies, "package must not add runtime dependencies");
  assert(!packageJson.devDependencies, "package must not require dev dependencies for local checks");
  assert(packageJson.scripts.check, "package must define check script");
  assert(packageJson.scripts.smoke, "package must define smoke script");

  const sampleRecords = parseInput(contents.get("examples/input.csv"), "input.csv");
  assert.equal(sampleRecords.length, 8, "sample CSV should include eight rows");

  const opportunities = findReplacementToolOpportunities(sampleRecords, { minScore: 40, currentYear: 2026 });
  assert(opportunities.length >= 6, "sample should produce multiple opportunities");
  assert.equal(opportunities[0].priority, "high", "top opportunity should be high priority");
  assert(opportunities[0].score >= 75, "top opportunity must score at least 75");
  assert(opportunities.some((item) => item.recommendedReplacement.category === "schema-validator"), "schema validator idea missing");
  assert(opportunities.some((item) => item.recommendedReplacement.category === "form-endpoint-checker"), "form endpoint idea missing");
  assert(opportunities.some((item) => item.recommendedReplacement.category === "gbp-link-checker"), "GBP checker idea missing");
  assert(opportunities.every((item) => item.campaignType === "replacement-tool-backlinks"), "campaign type mismatch");

  const csv = opportunitiesToCsv(opportunities.slice(0, 2));
  assert(csv.startsWith("id,score,priority"), "CSV output should include headers");
  assert(csv.includes("replacement"), "CSV output should include replacement positioning");

  const category = inferToolCategory({
    referringPageUrl: "https://example.com/resources",
    pageTitle: "Best click-to-call tools",
    oldToolUrl: "https://example.com/call-checker",
    oldToolName: "Phone link tester",
    anchorText: "click-to-call tester",
    notes: "old"
  });
  assert.equal(category.id, "click-to-call-tester");

  const problems = detectProblems({
    status: "404",
    oldToolUrl: "http://dead.example/tool",
    pageTitle: "Old 2018 schema tool",
    oldToolName: "Legacy schema checker",
    anchorText: "schema checker",
    notes: "abandoned and not found"
  }, 2026);
  assert(problems.includes("broken_target_404"));
  assert(problems.includes("outdated_or_abandoned_tool"));
  assert(problems.includes("stale_reference_2018"));
  assert(problems.includes("insecure_http_tool_url"));

  const expectedExamples = JSON.parse(contents.get("examples/opportunities.json"));
  assert(Array.isArray(expectedExamples), "example opportunities should be JSON array");
  assert(expectedExamples.length >= 3, "example opportunities should show at least three targets");

  const readme = contents.get("README.md");
  assert(readme.includes("Publishing Position"), "README must include publishing position");
  assert(readme.includes("Publish Blockers"), "README must include publish blockers");
  assert(readme.includes("does not scrape"), "README must state no scraping");

  const privacy = contents.get("PRIVACY.md");
  assert(privacy.includes("does not make network calls"), "PRIVACY must disclose network behavior");
  assert(privacy.includes("does not send outreach"), "PRIVACY must disclose outreach behavior");

  for (const file of localSourceFiles) {
    const content = contents.get(file);
    assert(!networkPattern.test(content), `${file} must not include network or scraping libraries`);
    assert(!credentialPattern.test(content), `${file} must not contain credential patterns`);
  }

  console.log("replacement tool finder checks passed");
}

async function readText(file) {
  return readFile(new URL(file, root), "utf8");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
