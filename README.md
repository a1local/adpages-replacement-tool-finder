# AdPages Replacement Tool Opportunity Finder

A dependency-free npm/CLI scaffold for finding replacement-tool backlink campaigns from local backlink, broken-link, or resource-page exports.

It helps an agency or tool builder answer: which old tools with backlinks are broken, outdated, abandoned, or weak enough that a better free replacement is worth building and pitching?

## What It Does

- Reads local CSV or JSON exports from backlink tools, crawlers, resource-page reviews, or manual research sheets.
- Normalizes common field names such as `referring_page_url`, `target_url`, `anchor_text`, `status`, `domain_authority`, and `notes`.
- Scores each target for broken/outdated evidence, resource-page intent, relevance, authority, traffic, and link quality.
- Classifies opportunities into practical replacement ideas:
  - schema validator
  - local business website checker
  - click-to-call tester
  - form endpoint checker
  - GBP link checker
  - mobile CTA checker
- Outputs JSON or CSV for human review.

It does not scrape websites, verify live status codes, send outreach, enrich contacts, or use credentials. Bring your own local exports and verify the final targets manually before outreach.

## Usage

```bash
npm --prefix packages/adpages-replacement-tool-finder run smoke
node packages/adpages-replacement-tool-finder/bin/adpages-replacement-tool-finder.mjs \
  packages/adpages-replacement-tool-finder/examples/input.csv \
  --pretty \
  --min-score 55 \
  --top 25
```

CSV output:

```bash
node packages/adpages-replacement-tool-finder/bin/adpages-replacement-tool-finder.mjs \
  --input packages/adpages-replacement-tool-finder/examples/input.csv \
  --format csv \
  --output replacement-tool-opportunities.csv
```

Expected input columns are flexible. The tool recognizes common aliases for:

| Concept | Example fields |
| --- | --- |
| Referring page | `referring_page_url`, `source_url`, `linking_page_url`, `resource_page_url` |
| Old tool URL | `target_url`, `destination_url`, `broken_url`, `tool_url`, `outbound_url` |
| Link text | `anchor_text`, `anchor`, `link_text` |
| Status | `status`, `http_status`, `status_code` |
| Authority | `domain_authority`, `dr`, `domain_rating`, `page_authority` |
| Traffic | `estimated_monthly_visits`, `organic_traffic`, `traffic` |
| Context | `page_title`, `tool_name`, `notes`, `last_checked` |

JSON input can be an array, or an object with `records[]` or `links[]`.

## Scoring Model

The score is intentionally simple and explainable:

- Broken or unavailable target evidence gets the biggest lift.
- Outdated, abandoned, deprecated, or stale-year evidence adds priority.
- Resource/course/checklist/tool-roundup pages score higher because they are natural editorial placements.
- Stronger authority or traffic signals raise the priority.
- Nofollow, sponsored, UGC, missing URLs, or low-context rows are penalized.

The output includes `scoreBreakdown` so every priority can be reviewed before anyone builds a replacement tool or writes outreach.

## Publishing Position

This is a link-building research utility, not an automation or scraper. The publishable angle is:

> Find resource pages still linking to broken or outdated marketing tools, then prioritize which replacement tools are worth building and pitching manually.

The natural landing page should pair the CLI with a free example workflow:

1. Export backlinks or outbound resource-page links from your existing SEO tool.
2. Run the local finder.
3. Review the highest-priority broken or outdated tools.
4. Build a genuinely better no-login replacement.
5. Pitch editors with the old URL, the issue, and the replacement.

## Publish Blockers

- Validate against real exports from Ahrefs, Semrush, Screaming Frog, Sitebulb, and manual Google Sheets research.
- Add public example exports that do not expose private client data.
- Finalize package license, repository URL, privacy URL, and support URL.
- Confirm the final brand/package name before npm publication.
- Add a landing page with screenshots, a sample report, and a clear no-scraping/no-outreach policy.
- Have a human review all outreach positioning before contacting any site owner.

## Local Checks

```bash
npm --prefix packages/adpages-replacement-tool-finder run check
npm --prefix packages/adpages-replacement-tool-finder run smoke
```

## Publisher

Built by [AdPages from A1 Local](https://a1local.com.au/extensions/) as a free, dependency-light tool for local-service marketers, agencies, and small business site owners.
