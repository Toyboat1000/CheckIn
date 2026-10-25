import {
    CATEGORIES,
    TrendRange,
    TrendSummary,
    buildTrend,
    summarizeTrend,
} from "@/lib/trends";
import type { Checkup, Person, ReportCategory } from "@/types/data";

// How many of the most recent written notes to include in the report.
const MAX_NOTES = 15;

type Stat = {
  average: number | null; // 1–5, or null if there was no data
  direction: TrendSummary["direction"]; // "up" | "down" | "steady" | "not-enough" | "none"
};

type PeriodSummary = {
  daysInPeriod: number;
  daysWithCheckIns: number;
  missedDays: number;
  overall: Stat;
  categories: Record<ReportCategory, Stat>;
};

export type ReportNote = {
  date: string;
  category: ReportCategory;
  score: number; // 1–5
  note: string;
};

export type ReportSummary = {
  personName: string;
  generatedOn: string;
  scale: string;
  periods: {
    lastWeek: PeriodSummary;
    lastMonth: PeriodSummary;
    last3Months: PeriodSummary;
  };
  recentNotes: ReportNote[];
};

/** Average and trend direction for one category (or Overall) over one range. */
function statFor(
  checkups: Checkup[],
  personId: string,
  category: ReportCategory | "Overall",
  range: TrendRange,
): Stat {
  const { points } = buildTrend(checkups, personId, category, range);
  const summary = summarizeTrend(points);
  return { average: summary.average, direction: summary.direction };
}

/** Everything about one time period: coverage, overall stat and each category's stat. */
function periodSummary(
  checkups: Checkup[],
  personId: string,
  range: TrendRange,
  daysInPeriod: number,
): PeriodSummary {
  const { daysWithData } = buildTrend(checkups, personId, "Overall", range);

  const categories = {} as Record<ReportCategory, Stat>;
  for (const category of CATEGORIES) {
    categories[category] = statFor(checkups, personId, category, range);
  }

  return {
    daysInPeriod,
    daysWithCheckIns: daysWithData,
    missedDays: Math.max(0, daysInPeriod - daysWithData),
    overall: statFor(checkups, personId, "Overall", range),
    categories,
  };
}

/** The most recent check-ins that have written notes, newest first. */
function recentNotes(checkups: Checkup[], personId: string): ReportNote[] {
  return checkups
    .filter((c) => c.personId === personId && c.notes.trim() !== "")
    .sort((a, b) => b.reportDate.localeCompare(a.reportDate))
    .slice(0, MAX_NOTES)
    .map((c) => ({
      date: c.reportDate,
      category: c.category,
      score: c.rating + 1, // faces are saved as 0–4; the report uses 1–5
      note: c.notes.trim(),
    }));
}

/**
 * Turns one person's check-ins into a short summary for the AI report.
 * All math happens here, so the AI only writes about numbers we computed.
 */
export function buildReportSummary(
  checkups: Checkup[],
  person: Person,
): ReportSummary {
  return {
    personName: person.name,
    generatedOn: new Date().toDateString(),
    scale:
      "Scores are 1 (very poor) to 5 (very good), from a daily caregiver check-in.",
    periods: {
      lastWeek: periodSummary(checkups, person.id, "week", 7),
      lastMonth: periodSummary(checkups, person.id, "month", 30),
      last3Months: periodSummary(checkups, person.id, "3months", 91),
    },
    recentNotes: recentNotes(checkups, person.id),
  };
}
