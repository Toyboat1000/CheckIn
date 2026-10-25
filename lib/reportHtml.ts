import type { ReportSummary } from "@/lib/report";
import type { ReportCategory, ReportSections, SavedReport } from "@/types/data";
import { formatDateTime, formatDay } from "@/utils/date";

const APP_NAME = "Check-In";
const AREAS: ReportCategory[] = [
  "Memory",
  "Speech",
  "Mobility",
  "Conversation",
];

type Stat = { average: number | null; direction: string };

/** Notes are typed by users, so escape them before putting them in HTML. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const ARROWS: Record<string, string> = { up: "↑", down: "↓", steady: "→" };

function scoreCell(stat: Stat): string {
  if (stat.average === null) return `<td class="num">–</td>`;
  const arrow = ARROWS[stat.direction] ?? "";
  return `<td class="num">${stat.average.toFixed(1)}<span class="arrow">${arrow}</span></td>`;
}

/**
 * Builds the report page. The table and notes come straight from your data;
 * only the written paragraphs come from Gemini.
 */
export function buildReportHtml(
  summary: ReportSummary,
  sections: ReportSections,
  createdAt: string,
  logoDataUri?: string,
): string {
  const { lastWeek, lastMonth, last3Months } = summary.periods;
  const periods = [lastWeek, lastMonth, last3Months];

  const rows = [
    `<tr class="overall"><th>Overall</th>${periods.map((p) => scoreCell(p.overall)).join("")}</tr>`,
    ...AREAS.map(
      (area) =>
        `<tr><th>${area}</th>${periods.map((p) => scoreCell(p.categories[area])).join("")}</tr>`,
    ),
    `<tr class="coverage"><th>Days with check-ins</th>${periods
      .map(
        (p) => `<td class="num">${p.daysWithCheckIns} / ${p.daysInPeriod}</td>`,
      )
      .join("")}</tr>`,
  ].join("");

  const discussion =
    sections.changesToDiscuss.length > 0
      ? `<ul>${sections.changesToDiscuss.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>`
      : `<p>No sustained declines in this period.</p>`;

  const observations = AREAS.map(
    (area) => `<p><strong>${area}.</strong> ${esc(sections.areas[area])}</p>`,
  ).join("");

  const notes =
    summary.recentNotes.length > 0
      ? `<table class="notes">
          <thead><tr><th>Date</th><th>Area</th><th class="num">Rating</th><th>Note</th></tr></thead>
          <tbody>${summary.recentNotes
            .map(
              (n) => `<tr>
                <td class="date">${formatDay(n.date)}</td>
                <td>${n.category}</td>
                <td class="num">${n.score}</td>
                <td>${esc(n.note)}</td>
              </tr>`,
            )
            .join("")}</tbody>
        </table>`
      : `<p>No notes recorded.</p>`;

  const logo = logoDataUri
    ? `<img class="logo" src="${logoDataUri}" alt="" />`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(summary.personName)} – ${APP_NAME} report</title>
<style>
  @page { size: letter; margin: 0.75in; }
  * { box-sizing: border-box; }

  body {
    margin: 0;
    color: #1a1a1a;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.45;
  }

  header {
    display: table;
    width: 100%;
    padding-bottom: 10px;
    border-bottom: 2px solid #6d3fa9;
  }
  header > div { display: table-cell; vertical-align: middle; }
  .brand { white-space: nowrap; }
  .logo { height: 28px; vertical-align: middle; margin-right: 8px; }
  .app { font-size: 11pt; font-weight: 700; vertical-align: middle; }
  .doc-title { text-align: right; font-size: 11pt; }

  .patient { width: 100%; margin: 14px 0 6px; border-collapse: collapse; }
  .patient td { padding: 2px 0; vertical-align: top; }
  .patient .label { width: 1%; white-space: nowrap; padding-right: 14px; color: #555; }

  h2 {
    font-size: 11pt;
    margin: 22px 0 6px;
    padding-bottom: 3px;
    border-bottom: 1px solid #ccc;
    page-break-after: avoid;
  }
  p { margin: 0 0 7px; }
  ul { margin: 0; padding-left: 18px; }
  li { margin-bottom: 4px; }

  table.scores, table.notes { width: 100%; border-collapse: collapse; }
  table.scores { page-break-inside: avoid; }
  .scores th, .scores td, .notes th, .notes td {
    padding: 5px 8px;
    border-bottom: 1px solid #e3e3e3;
    text-align: left;
    vertical-align: top;
  }
  thead th { font-weight: 600; color: #555; border-bottom: 1px solid #999; }
  .scores tbody th { font-weight: 400; }
  .overall th, .overall td { font-weight: 700; }
  .coverage th, .coverage td { color: #555; }
  .scores .num, .notes .num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .scores td.num { width: 17%; }
  .arrow { display: inline-block; width: 1.1em; text-align: right; }
  .key { font-size: 9pt; color: #555; margin-top: 5px; }

  .notes { font-size: 10pt; }
  .notes tr { page-break-inside: avoid; }
  .notes .date { white-space: nowrap; width: 1%; padding-right: 14px; }
  .notes .num { width: 1%; }

  footer {
    margin-top: 28px;
    padding-top: 8px;
    border-top: 1px solid #ccc;
    font-size: 8.5pt;
    color: #555;
  }
</style>
</head>
<body>

  <header>
    <div class="brand">${logo}<span class="app">${APP_NAME}</span></div>
    <div class="doc-title">Caregiver check-in report</div>
  </header>

  <table class="patient">
    <tr><td class="label">Name</td><td>${esc(summary.personName)}</td></tr>
    <tr><td class="label">Report date</td><td>${formatDateTime(createdAt)}</td></tr>
    <tr><td class="label">Period</td><td>Last 91 days</td></tr>
    <tr><td class="label">Source</td><td>Daily ratings and notes recorded by a caregiver</td></tr>
  </table>

  <h2>Summary</h2>
  <p>${esc(sections.summary)}</p>

  <h2>Points to discuss</h2>
  ${discussion}

  <h2>Average ratings</h2>
  <table class="scores">
    <thead>
      <tr><th>Area</th><th class="num">7 days</th><th class="num">30 days</th><th class="num">91 days</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="key">Scale 1 (very poor) to 5 (very good). ↑ improving, ↓ declining, → stable within the period; – no data.</p>

  <h2>Observations</h2>
  ${observations}

  <h2>Caregiver notes</h2>
  ${notes}

  <footer>
    Ratings are a caregiver's daily observations, not clinical measurements, and this report is not a diagnosis.
    Written sections were drafted with AI (Google Gemini) from the figures above. Generated by ${APP_NAME}.
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
    `${APP_NAME} report for ${personName}, ${formatDateTime(report.createdAt)}`,
    "",
    s.summary,
    "",
    "Points to discuss:",
    ...(s.changesToDiscuss.length > 0
      ? s.changesToDiscuss.map((c) => `- ${c}`)
      : ["No sustained declines in this period."]),
    "",
    ...AREAS.flatMap((area) => [`${area}: ${s.areas[area]}`, ""]),
  ];

  if (s.notesSummary) lines.push(`Caregiver notes: ${s.notesSummary}`, "");

  lines.push(s.dataCompleteness, "");
  lines.push(
    "Ratings are a caregiver's daily observations on a 1 to 5 scale, not clinical measurements. This report is not a diagnosis.",
  );

  return lines.join("\n");
}
