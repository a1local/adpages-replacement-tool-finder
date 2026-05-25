const FIELD_ALIASES = {
  referringPageUrl: [
    "referring_page_url",
    "source_url",
    "source_page",
    "linking_page_url",
    "linking_url",
    "resource_page_url",
    "page_url",
    "url"
  ],
  pageTitle: [
    "page_title",
    "source_title",
    "referring_page_title",
    "resource_page_title",
    "title"
  ],
  oldToolUrl: [
    "target_url",
    "destination_url",
    "linked_url",
    "broken_url",
    "tool_url",
    "old_tool_url",
    "outbound_url"
  ],
  oldToolName: [
    "tool_name",
    "target_title",
    "destination_title",
    "old_tool_name",
    "linked_tool",
    "name"
  ],
  anchorText: [
    "anchor_text",
    "anchor",
    "link_text",
    "linked_text"
  ],
  status: [
    "status",
    "http_status",
    "target_status",
    "status_code",
    "response_code"
  ],
  authority: [
    "domain_authority",
    "authority",
    "dr",
    "domain_rating",
    "url_rating",
    "page_authority"
  ],
  traffic: [
    "estimated_monthly_visits",
    "organic_traffic",
    "traffic",
    "visits",
    "monthly_visits"
  ],
  linkType: [
    "link_type",
    "rel",
    "follow_type",
    "nofollow"
  ],
  notes: [
    "notes",
    "comment",
    "evidence",
    "issue",
    "status_notes",
    "description"
  ],
  lastChecked: [
    "last_checked",
    "checked_at",
    "last_seen",
    "date_checked",
    "discovered_at"
  ],
  outboundLinks: [
    "outbound_links",
    "external_links",
    "links_on_page"
  ],
  contactHint: [
    "contact",
    "contact_hint",
    "has_contact",
    "editor",
    "owner"
  ]
};

const TOOL_CATEGORIES = [
  {
    id: "schema-validator",
    label: "Schema validator",
    terms: ["schema", "json-ld", "json ld", "structured data", "rich result"],
    angle: "Replace the old link with a no-login schema validator focused on local business pages.",
    productIdea: "Free local business schema validator"
  },
  {
    id: "local-business-website-checker",
    label: "Local business website checker",
    terms: ["local business", "website checker", "site checker", "website audit", "local seo audit", "web design checklist"],
    angle: "Offer a practical local business website checker that tests the basics owners and agencies miss.",
    productIdea: "Free local business website checker"
  },
  {
    id: "click-to-call-tester",
    label: "Click-to-call tester",
    terms: ["click to call", "click-to-call", "tel link", "phone link", "call button", "telephone link"],
    angle: "Replace the old resource with a tester that confirms mobile phone links and call CTAs work.",
    productIdea: "Free click-to-call tester"
  },
  {
    id: "form-endpoint-checker",
    label: "Form endpoint checker",
    terms: ["form endpoint", "form checker", "contact form", "lead form", "form testing", "form qa"],
    angle: "Pitch a safer form endpoint checker that helps teams verify lead capture before campaigns launch.",
    productIdea: "Free form endpoint checker"
  },
  {
    id: "gbp-link-checker",
    label: "GBP link checker",
    terms: ["gbp", "google business profile", "google my business", "gmb", "map link", "maps link"],
    angle: "Suggest a replacement that validates Google Business Profile and map links used on local pages.",
    productIdea: "Free GBP link checker"
  },
  {
    id: "mobile-cta-checker",
    label: "Mobile CTA checker",
    terms: ["mobile cta", "cta checker", "mobile button", "sticky call", "mobile conversion", "tap target"],
    angle: "Offer a mobile CTA checker for small business websites and agency QA workflows.",
    productIdea: "Free mobile CTA checker"
  }
];

const RESOURCE_PAGE_TERMS = [
  "resource",
  "resources",
  "tools",
  "toolkit",
  "checklist",
  "course",
  "tutorial",
  "library",
  "best free",
  "recommended",
  "roundup",
  "links",
  "curriculum",
  "bootcamp"
];

const BROKEN_TERMS = [
  "broken",
  "dead link",
  "not found",
  "404",
  "410",
  "gone",
  "offline",
  "timeout",
  "dns",
  "parked domain",
  "domain expired"
];

const OUTDATED_TERMS = [
  "outdated",
  "old",
  "abandoned",
  "deprecated",
  "unmaintained",
  "no longer updated",
  "last updated",
  "legacy",
  "retired",
  "shut down"
];

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inQuotes) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [headerRow, ...bodyRows] = rows.filter((candidate) => candidate.some((cell) => cell.trim() !== ""));
  if (!headerRow) {
    return [];
  }

  const headers = headerRow.map(normalizeHeader);
  return bodyRows
    .filter((candidate) => candidate.some((cell) => cell.trim() !== ""))
    .map((candidate) => {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = candidate[index] ? candidate[index].trim() : "";
      });
      return record;
    });
}

export function parseInput(text, filename = "input.csv") {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  if (filename.toLowerCase().endsWith(".json") || trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map(normalizeObjectKeys);
    }
    if (Array.isArray(parsed.records)) {
      return parsed.records.map(normalizeObjectKeys);
    }
    if (Array.isArray(parsed.links)) {
      return parsed.links.map(normalizeObjectKeys);
    }
    throw new Error("JSON input must be an array or an object with records[] or links[]");
  }

  return parseCsv(text).map(normalizeObjectKeys);
}

export function findReplacementToolOpportunities(records, options = {}) {
  const minScore = Number.isFinite(options.minScore) ? options.minScore : 0;
  const top = Number.isFinite(options.top) ? options.top : 0;
  const seen = new Set();
  const opportunities = [];

  for (const rawRecord of records) {
    const record = normalizeRecord(rawRecord);
    const dedupeKey = [
      record.referringPageUrl.toLowerCase(),
      record.oldToolUrl.toLowerCase(),
      record.anchorText.toLowerCase()
    ].join("|");

    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);

    const category = inferToolCategory(record);
    const problems = detectProblems(record, options.currentYear);
    const scoreDetail = scoreRecord(record, category, problems);
    const score = Math.max(0, Math.min(100, Math.round(scoreDetail.score)));

    if (score < minScore) {
      continue;
    }

    opportunities.push({
      id: "",
      score,
      priority: priorityForScore(score),
      campaignType: "replacement-tool-backlinks",
      referringPageUrl: record.referringPageUrl,
      referringDomain: hostname(record.referringPageUrl),
      resourcePageTitle: record.pageTitle,
      oldToolUrl: record.oldToolUrl,
      oldToolDomain: hostname(record.oldToolUrl),
      oldToolName: record.oldToolName || record.anchorText || category.label,
      anchorText: record.anchorText,
      detectedProblems: problems,
      recommendedReplacement: {
        category: category.id,
        label: category.label,
        productIdea: category.productIdea,
        angle: category.angle
      },
      evidence: {
        status: record.status,
        authority: record.authority,
        estimatedMonthlyVisits: record.traffic,
        linkType: record.linkType,
        lastChecked: record.lastChecked,
        notes: record.notes
      },
      scoreBreakdown: scoreDetail.reasons,
      outreachPositioning: buildOutreachPositioning(record, category, problems)
    });
  }

  const sorted = opportunities.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    return left.referringDomain.localeCompare(right.referringDomain);
  });

  const sliced = top > 0 ? sorted.slice(0, top) : sorted;
  return sliced.map((opportunity, index) => ({
    ...opportunity,
    id: buildOpportunityId(index + 1, opportunity)
  }));
}

export function opportunitiesToCsv(opportunities) {
  const headers = [
    "id",
    "score",
    "priority",
    "referring_page_url",
    "referring_domain",
    "old_tool_url",
    "old_tool_name",
    "detected_problems",
    "recommended_replacement",
    "outreach_positioning"
  ];

  const rows = opportunities.map((opportunity) => [
    opportunity.id,
    String(opportunity.score),
    opportunity.priority,
    opportunity.referringPageUrl,
    opportunity.referringDomain,
    opportunity.oldToolUrl,
    opportunity.oldToolName,
    opportunity.detectedProblems.join("; "),
    opportunity.recommendedReplacement.productIdea,
    opportunity.outreachPositioning
  ]);

  return serializeCsv([headers, ...rows]);
}

export function normalizeRecord(rawRecord) {
  const record = normalizeObjectKeys(rawRecord);
  return {
    referringPageUrl: pick(record, FIELD_ALIASES.referringPageUrl),
    pageTitle: pick(record, FIELD_ALIASES.pageTitle),
    oldToolUrl: pick(record, FIELD_ALIASES.oldToolUrl),
    oldToolName: pick(record, FIELD_ALIASES.oldToolName),
    anchorText: pick(record, FIELD_ALIASES.anchorText),
    status: pick(record, FIELD_ALIASES.status),
    authority: asNumber(pick(record, FIELD_ALIASES.authority)),
    traffic: asNumber(pick(record, FIELD_ALIASES.traffic)),
    linkType: pick(record, FIELD_ALIASES.linkType),
    notes: pick(record, FIELD_ALIASES.notes),
    lastChecked: pick(record, FIELD_ALIASES.lastChecked),
    outboundLinks: asNumber(pick(record, FIELD_ALIASES.outboundLinks)),
    contactHint: pick(record, FIELD_ALIASES.contactHint)
  };
}

export function inferToolCategory(record) {
  const haystack = [
    record.referringPageUrl,
    record.pageTitle,
    record.oldToolUrl,
    record.oldToolName,
    record.anchorText,
    record.notes
  ].join(" ").toLowerCase();

  let best = TOOL_CATEGORIES[1];
  let bestHits = 0;

  for (const category of TOOL_CATEGORIES) {
    const hits = category.terms.filter((term) => haystack.includes(term)).length;
    if (hits > bestHits) {
      best = category;
      bestHits = hits;
    }
  }

  return best;
}

export function detectProblems(record, currentYear = new Date().getFullYear()) {
  const problems = [];
  const status = asNumber(record.status);
  const haystack = [
    record.status,
    record.pageTitle,
    record.oldToolName,
    record.anchorText,
    record.oldToolUrl,
    record.notes
  ].join(" ").toLowerCase();

  if (status >= 400 || BROKEN_TERMS.some((term) => haystack.includes(term))) {
    problems.push(status >= 400 ? `broken_target_${status}` : "broken_or_unavailable_target");
  }

  if (OUTDATED_TERMS.some((term) => haystack.includes(term))) {
    problems.push("outdated_or_abandoned_tool");
  }

  const years = [...haystack.matchAll(/\b(20\d{2}|19\d{2})\b/g)].map((match) => Number(match[1]));
  const staleYear = years.find((year) => year <= currentYear - 3);
  if (staleYear) {
    problems.push(`stale_reference_${staleYear}`);
  }

  if (status >= 300 && status < 400) {
    problems.push(`redirecting_target_${status}`);
  }

  if (record.oldToolUrl.startsWith("http://")) {
    problems.push("insecure_http_tool_url");
  }

  return [...new Set(problems)];
}

export function scoreRecord(record, category, problems) {
  const reasons = [];
  let score = 10;

  if (problems.some((problem) => problem.startsWith("broken_target") || problem === "broken_or_unavailable_target")) {
    score += 35;
    reasons.push("broken target +35");
  }

  if (problems.includes("outdated_or_abandoned_tool") || problems.some((problem) => problem.startsWith("stale_reference"))) {
    score += 22;
    reasons.push("outdated or stale tool evidence +22");
  }

  if (problems.some((problem) => problem.startsWith("redirecting_target"))) {
    score += 8;
    reasons.push("redirecting target +8");
  }

  if (category) {
    score += 12;
    reasons.push(`${category.label} match +12`);
  }

  if (isResourcePage(record)) {
    score += 10;
    reasons.push("resource page intent +10");
  }

  if (record.authority > 0) {
    const authorityScore = Math.min(15, Math.round(record.authority / 7));
    score += authorityScore;
    reasons.push(`authority signal +${authorityScore}`);
  }

  if (record.traffic > 0) {
    const trafficScore = Math.min(8, Math.max(1, Math.round(Math.log10(record.traffic + 1) * 2)));
    score += trafficScore;
    reasons.push(`traffic signal +${trafficScore}`);
  }

  if (record.outboundLinks > 0 && record.outboundLinks <= 80) {
    score += 4;
    reasons.push("curated page size +4");
  }

  if (record.contactHint && !/no|false|none/i.test(record.contactHint)) {
    score += 3;
    reasons.push("editor/contact hint +3");
  }

  if (/nofollow/i.test(record.linkType)) {
    score -= 4;
    reasons.push("nofollow link -4");
  }

  if (/sponsored|ugc/i.test(record.linkType)) {
    score -= 8;
    reasons.push("sponsored or UGC link -8");
  }

  if (!record.referringPageUrl || !record.oldToolUrl) {
    score -= 10;
    reasons.push("missing source or target URL -10");
  }

  return {
    score,
    reasons
  };
}

function buildOutreachPositioning(record, category, problems) {
  const problemText = problems.length > 0
    ? problems.join(", ").replaceAll("_", " ")
    : "lower confidence issue";
  const page = record.pageTitle || hostname(record.referringPageUrl) || "the resource page";
  const oldTool = record.oldToolName || record.anchorText || hostname(record.oldToolUrl) || "the old tool";
  return `${page} links to ${oldTool}; evidence suggests ${problemText}. Pitch ${category.productIdea} as a maintained, no-login replacement and include the exact old URL for easy verification.`;
}

function isResourcePage(record) {
  const haystack = [
    record.referringPageUrl,
    record.pageTitle,
    record.anchorText,
    record.notes
  ].join(" ").toLowerCase();
  return RESOURCE_PAGE_TERMS.some((term) => haystack.includes(term));
}

function buildOpportunityId(index, opportunity) {
  const domain = slugify(opportunity.referringDomain || "unknown-domain");
  const category = slugify(opportunity.recommendedReplacement.category);
  return `rto-${String(index).padStart(3, "0")}-${domain}-${category}`;
}

function priorityForScore(score) {
  if (score >= 75) {
    return "high";
  }
  if (score >= 55) {
    return "medium";
  }
  return "low";
}

function pick(record, aliases) {
  for (const alias of aliases) {
    if (record[alias] !== undefined && record[alias] !== null && String(record[alias]).trim() !== "") {
      return String(record[alias]).trim();
    }
  }
  return "";
}

function normalizeObjectKeys(record) {
  const normalized = {};
  for (const [key, value] of Object.entries(record || {})) {
    normalized[normalizeHeader(key)] = value;
  }
  return normalized;
}

function normalizeHeader(header) {
  return String(header)
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function asNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const match = String(value || "").replaceAll(",", "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function hostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "unknown";
}

function serializeCsv(rows) {
  return `${rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n")}\n`;
}

function escapeCsvCell(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}
