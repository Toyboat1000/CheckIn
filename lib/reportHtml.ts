import type { ReportSummary } from "@/lib/report";
import type { ReportCategory, ReportSections, SavedReport } from "@/types/data";

const APP_NAME = "Check-up";
const AREAS: ReportCategory[] = [
  "Memory",
  "Speech",
  "Mobility",
  "Conversation",
];

type Stat = { average: number | null; direction: string };

// ---------- small helpers ----------

/** Notes are typed by users, so escape them before putting them in HTML. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** "2026-10-21" -> "Oct 21, 2026", read as a local date (not UTC). */
function formatDay(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const ARROWS: Record<string, string> = { up: "↑", down: "↓", steady: "→" };
const DIRECTION_WORDS: Record<string, string> = {
  up: "improving",
  down: "declining",
  steady: "stable",
  "not-enough": "too little data",
  none: "no data",
};

/** Cell tint from the score: low scores warm, high scores cool green. */
function scoreClass(average: number | null): string {
  if (average === null) return "s-none";
  if (average < 2) return "s-1";
  if (average < 3) return "s-2";
  if (average < 4) return "s-3";
  return "s-4";
}

function scoreCell(stat: Stat): string {
  if (stat.average === null) {
    return `<td class="score s-none">–</td>`;
  }
  const arrow = ARROWS[stat.direction] ?? "";
  const label = DIRECTION_WORDS[stat.direction] ?? stat.direction;
  return `<td class="score ${scoreClass(stat.average)}">
    <span class="num">${stat.average.toFixed(1)}</span>
    <span class="dir dir-${stat.direction}" title="${label}">${arrow}</span>
  </td>`;
}

// ---------- the HTML ----------

/**
 * Builds the full report page. Numbers in the table and the notes come straight
 * from your own data; only the paragraphs come from Gemini.
 */
export function buildReportHtml(
  summary: ReportSummary,
  sections: ReportSections,
  createdAt: string,
  logoDataUri?: string,
): string {
  const { lastWeek, lastMonth, last3Months } = summary.periods;
  const periods = [lastWeek, lastMonth, last3Months];

  const tableRows = [
    `<tr class="overall">
      <th scope="row">Overall</th>
      ${periods.map((p) => scoreCell(p.overall)).join("")}
    </tr>`,
    ...AREAS.map(
      (area) => `<tr>
        <th scope="row">${area}</th>
        ${periods.map((p) => scoreCell(p.categories[area])).join("")}
      </tr>`,
    ),
    `<tr class="coverage">
      <th scope="row">Days checked in</th>
      ${periods.map((p) => `<td>${p.daysWithCheckIns} of ${p.daysInPeriod}</td>`).join("")}
    </tr>`,
  ].join("");

  const changes =
    sections.changesToDiscuss.length > 0
      ? `<section class="flag">
          <h2>Changes worth discussing</h2>
          <ul>${sections.changesToDiscuss.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
        </section>`
      : `<section class="flag flag-clear">
          <h2>Changes worth discussing</h2>
          <p>No sustained declines were found in this period.</p>
        </section>`;

  const areaParagraphs = AREAS.map(
    (area) => `<div class="area">
      <h3>${area}</h3>
      <p>${esc(sections.areas[area])}</p>
    </div>`,
  ).join("");

  const notesTable =
    summary.recentNotes.length > 0
      ? `<table class="notes">
          <thead>
            <tr><th>Date</th><th>Area</th><th>Rating</th><th>Caregiver's note</th></tr>
          </thead>
          <tbody>
            ${summary.recentNotes
              .map(
                (n) => `<tr>
                  <td class="nowrap">${formatDay(n.date)}</td>
                  <td>${n.category}</td>
                  <td class="center">${n.score} / 5</td>
                  <td>${esc(n.note)}</td>
                </tr>`,
              )
              .join("")}
          </tbody>
        </table>`
      : `<p class="muted">No notes were recorded in this period.</p>`;

  const brand = logoDataUri
    ? `<img class="logo" src="${logoDataUri}" alt="" />`
    : `<div class="mark" aria-hidden="true">✓</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(summary.personName)} – Check-in report</title>
<style>
  @page { size: letter; margin: 0.6in 0.65in; }

  :root {
    --purple: #6d3fa9;
    --purple-dark: #3d2163;
    --lavender: #f1e9fb;
    --green: #7ecf9a;
    --ink: #1f1a29;
    --muted: #6b6478;
    --rule: #ddd3ea;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    color: var(--ink);
    font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Header */
  .masthead {
    display: table;
    width: 100%;
    border-bottom: 3px solid var(--purple);
    padding-bottom: 12px;
  }
  .masthead > div { display: table-cell; vertical-align: bottom; }
  .brand { width: 1%; white-space: nowrap; padding-right: 14px; }
  .logo { width: 44px; height: 44px; border-radius: 10px; display: block; }
  .mark {
    width: 44px; height: 44px; border-radius: 10px;
    background: var(--purple); color: #fff;
    font-size: 26px; line-height: 44px; text-align: center; font-weight: 700;
  }
  .app-name { font-size: 9pt; color: var(--purple); font-weight: 700; margin: 0 0 2px; }
  h1 { font-size: 20pt; line-height: 1.15; margin: 0; color: var(--purple-dark); }
  .meta { text-align: right; color: var(--muted); font-size: 9pt; line-height: 1.4; }
  .meta strong { color: var(--ink); }

  h2 {
    font-size: 12pt;
    color: var(--purple-dark);
    margin: 22px 0 8px;
    page-break-after: avoid;
  }
  h3 { font-size: 10.5pt; margin: 0 0 2px; color: var(--purple); }
  p { margin: 0 0 8px; }
  .muted { color: var(--muted); }

  .summary { font-size: 11.5pt; line-height: 1.55; margin-top: 16px; }

  /* Score table */
  table { width: 100%; border-collapse: collapse; page-break-inside: avoid; }
  .scores th, .scores td { padding: 7px 10px; border-bottom: 1px solid var(--rule); }
  .scores thead th {
    font-size: 9pt; color: var(--muted); font-weight: 600; text-align: center;
    border-bottom: 2px solid var(--purple);
  }
  .scores thead th:first-child { text-align: left; }
  .scores tbody th { text-align: left; font-weight: 600; width: 34%; }
  .scores .overall th, .scores .overall .num { font-weight: 800; }
  .scores .coverage td, .scores .coverage th { color: var(--muted); font-size: 9pt; text-align: center; }
  .scores .coverage th { text-align: left; font-weight: 600; }

  .score { text-align: center; white-space: nowrap; }
  .num { font-size: 11pt; font-variant-numeric: tabular-nums; }
  .dir { display: inline-block; width: 1em; margin-left: 4px; font-weight: 700; }
  .dir-up { color: #23854a; }
  .dir-down { color: #b3412e; }
  .dir-steady { color: var(--muted); }

  .s-1 { background: #f7d9d2; }
  .s-2 { background: #fbe9d6; }
  .s-3 { background: #f1e9fb; }
  .s-4 { background: #dcf2e3; }
  .s-none { color: var(--muted); }

  .legend { font-size: 8.5pt; color: var(--muted); margin-top: 6px; }

  /* Flag box */
  .flag {
    margin-top: 22px;
    padding: 12px 16px;
    border-left: 4px solid #b3412e;
    background: #fbf1ef;
    page-break-inside: avoid;
  }
  .flag h2 { margin-top: 0; color: #8a2f20; }
  .flag ul { margin: 0; padding-left: 18px; }
  .flag li { margin-bottom: 4px; }
  .flag-clear { border-left-color: var(--green); background: #eef8f1; }
  .flag-clear h2 { color: #23663c; }

  .area { margin-bottom: 10px; page-break-inside: avoid; }

  /* Notes */
  .notes { font-size: 9.5pt; }
  .notes th {
    text-align: left; font-size: 8.5pt; color: var(--muted); font-weight: 600;
    border-bottom: 2px solid var(--purple); padding: 5px 8px;
  }
  .notes td { padding: 6px 8px; border-bottom: 1px solid var(--rule); vertical-align: top; }
  .notes tr { page-break-inside: avoid; }
  .nowrap { white-space: nowrap; }
  .center { text-align: center; white-space: nowrap; }

  footer {
    margin-top: 26px;
    padding-top: 10px;
    border-top: 1px solid var(--rule);
    font-size: 8.5pt;
    color: var(--muted);
  }
</style>
</head>
<body>

  <header class="masthead">
    <div class="brand">${brand}</div>
    <div>
      <p class="app-name">${APP_NAME}</p>
      <h1>${esc(summary.personName)}</h1>
    </div>
    <div class="meta">
      <strong>Caregiver check-in report</strong><br />
      Generated ${formatDateTime(createdAt)}<br />
      Covers the last 91 days
    </div>
  </header>

  <p class="summary">${esc(sections.summary)}</p>

  <h2>Average ratings</h2>
  <table class="scores">
    <thead>
      <tr><th>Area</th><th>Last 7 days</th><th>Last 30 days</th><th>Last 91 days</th></tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
  <p class="legend">
    Ratings are 1 (very poor) to 5 (very good). Arrows show the direction within each period:
    ↑ improving, ↓ declining, → stable. A dash means no check-ins.
  </p>

  ${changes}

  <h2>Observations by area</h2>
  ${areaParagraphs}

  <h2>Caregiver notes</h2>
  ${sections.notesSummary ? `<p>${esc(sections.notesSummary)}</p>` : ""}
  ${notesTable}

  <h2>Data completeness</h2>
  <p>${esc(sections.dataCompleteness)}</p>

  <footer>
    Ratings are daily observations recorded by a caregiver in ${APP_NAME} on a 1 to 5 scale.
    This report summarizes patterns in those observations and is not a medical assessment or diagnosis.
    Written sections were drafted by AI (Google Gemini) from the figures shown above.
  </footer>

</body>
</html>`;
}

// ---------- plain text (for the in-app card and "Send as text") ----------

/** Works for new JSON reports and for older reports saved as plain text. */
export function reportToPlainText(
  report: SavedReport,
  personName: string,
): string {
  if (!report.sections) return report.text ?? "";

  const s = report.sections;
  const lines = [
    `Check-in report for ${personName}, ${formatDateTime(report.createdAt)}`,
    "",
    s.summary,
    "",
    ...AREAS.flatMap((area) => [`${area}: ${s.areas[area]}`, ""]),
  ];

  if (s.notesSummary) lines.push(`Caregiver notes: ${s.notesSummary}`, "");

  lines.push("Changes worth discussing:");
  if (s.changesToDiscuss.length > 0) {
    s.changesToDiscuss.forEach((c) => lines.push(`- ${c}`));
  } else {
    lines.push("No sustained declines were found.");
  }
  lines.push("", s.dataCompleteness, "");
  lines.push(
    "Ratings are daily caregiver observations on a 1 to 5 scale. This report summarizes patterns and is not a medical assessment or diagnosis.",
  );

  return lines.join("\n");
}
