#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import {
  findReplacementToolOpportunities,
  opportunitiesToCsv,
  parseInput
} from "../src/index.mjs";

const VERSION = "0.1.0";

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    process.stdout.write(helpText());
    return;
  }

  if (args.version) {
    process.stdout.write(`${VERSION}\n`);
    return;
  }

  if (!args.input) {
    throw new Error("Missing input file. Run with --help for usage.");
  }

  const inputText = await readFile(args.input, "utf8");
  const records = parseInput(inputText, args.input);
  const opportunities = findReplacementToolOpportunities(records, {
    minScore: args.minScore,
    top: args.top
  });

  const output = args.format === "csv"
    ? opportunitiesToCsv(opportunities)
    : `${JSON.stringify(opportunities, null, args.pretty ? 2 : 0)}\n`;

  if (args.output) {
    await writeFile(args.output, output);
  } else {
    process.stdout.write(output);
  }
}

function parseArgs(argv) {
  const args = {
    input: "",
    output: "",
    format: "json",
    minScore: 0,
    top: 0,
    pretty: false,
    help: false,
    version: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (arg === "--version" || arg === "-v") {
      args.version = true;
    } else if (arg === "--input" || arg === "-i") {
      args.input = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--output" || arg === "-o") {
      args.output = requireValue(argv, index, arg);
      index += 1;
    } else if (arg === "--format" || arg === "-f") {
      args.format = requireValue(argv, index, arg).toLowerCase();
      index += 1;
    } else if (arg === "--min-score") {
      args.minScore = Number(requireValue(argv, index, arg));
      index += 1;
    } else if (arg === "--top") {
      args.top = Number(requireValue(argv, index, arg));
      index += 1;
    } else if (arg === "--pretty") {
      args.pretty = true;
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    } else if (!args.input) {
      args.input = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  if (!["json", "csv"].includes(args.format)) {
    throw new Error("--format must be json or csv");
  }
  if (!Number.isFinite(args.minScore) || args.minScore < 0 || args.minScore > 100) {
    throw new Error("--min-score must be a number from 0 to 100");
  }
  if (!Number.isFinite(args.top) || args.top < 0) {
    throw new Error("--top must be a positive number");
  }

  return args;
}

function requireValue(argv, index, option) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${option} requires a value`);
  }
  return value;
}

function helpText() {
  return `AdPages Replacement Tool Opportunity Finder ${VERSION}

Usage:
  adpages-replacement-tool-finder <input.csv|input.json> [options]
  adpages-replacement-tool-finder --input exports/backlinks.csv --format csv --top 25

Options:
  -i, --input <file>       Local CSV or JSON export to analyze
  -o, --output <file>      Write opportunities to a file instead of stdout
  -f, --format <json|csv>  Output format. Default: json
      --min-score <0-100>  Filter out lower-priority opportunities
      --top <number>       Limit result count
      --pretty             Pretty-print JSON output
  -h, --help               Show this help text
  -v, --version            Show version

The CLI only reads local files and writes local output. It does not scrape,
contact websites, send outreach, use credentials, or make network calls.
`;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
