import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = new URL("../", import.meta.url);
const bin = fileURLToPath(new URL("bin/adpages-replacement-tool-finder.mjs", root));
const sample = fileURLToPath(new URL("examples/input.csv", root));

async function main() {
  const jsonRun = await execFileAsync(process.execPath, [
    bin,
    sample,
    "--pretty",
    "--min-score",
    "55",
    "--top",
    "5"
  ]);
  const opportunities = JSON.parse(jsonRun.stdout);
  assert.equal(opportunities.length, 5, "top filter should return five JSON opportunities");
  assert(opportunities[0].score >= opportunities[1].score, "JSON output should be sorted by score");
  assert(opportunities[0].id.startsWith("rto-001-"), "JSON output should include stable IDs");
  assert(opportunities.some((item) => item.recommendedReplacement.category === "schema-validator"), "schema target missing");

  const csvRun = await execFileAsync(process.execPath, [
    bin,
    "--input",
    sample,
    "--format",
    "csv",
    "--min-score",
    "75"
  ]);
  assert(csvRun.stdout.startsWith("id,score,priority"), "CSV output must include a header row");
  assert(csvRun.stdout.includes("high"), "CSV output should include high-priority targets");
  assert(csvRun.stdout.includes("Free local business schema validator"), "CSV output should include replacement ideas");

  const helpRun = await execFileAsync(process.execPath, [bin, "--help"]);
  assert(helpRun.stdout.includes("does not scrape"), "help text should disclose no scraping");

  console.log("replacement tool finder smoke passed");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
