import type { Checkup, ReportCategory } from "@/types/data";
import { getLocalDateKey } from "@/utils/date";

export const CATEGORIES: ReportCategory[] = [
  "Memory",
  "Speech",
  "Mobility",
  "Conversation",
];

export type TrendCategory = ReportCategory | "Overall";
export type TrendRange = "day" | "week" | "month" | "3months" | "year";

export const RANGES: TrendRange[] = ["day", "week", "month", "3months", "year"];

export const RANGE_LABELS: Record<TrendRange, string> = {
  day: "Today",
  week: "Week",
  month: "Month",
  "3months": "3 Mo",
  year: "Year",
};

const RANGE_PHRASES: Record<TrendRange, string> = {
  day: "today",
  week: "this week",
  month: "this month",
  "3months": "over the last 3 months",
  year: "over the last year",
};

export type ChartPoint = {
  key: string;
  label: string;
  score: number | null;
  showLabel: boolean;
};

export type TrendData = {
  points: ChartPoint[];
  daysWithData: number;
};

export type TrendSummary = {
  count: number;
  average: number | null;
  direction: "up" | "down" | "steady" | "not-enough" | "none";
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const TREND_THRESHOLD = 0.3;

const round1 = (n: number) => Math.round(n * 10) / 10;

function average(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function dailyScores(
  checkups: Checkup[],
  personId: string,
  category: TrendCategory,
): Map<string, number> {
  const byDate = new Map<string, number[]>();

  for (const c of checkups) {
    if (c.personId !== personId) continue;
    if (category !== "Overall" && c.category !== category) continue;

    const list = byDate.get(c.reportDate) ?? [];
    list.push(c.rating + 1); // faces are saved as 0–4; scores are 1–5
    byDate.set(c.reportDate, list);
  }

  const result = new Map<string, number>();
  byDate.forEach((scores, date) => result.set(date, average(scores)!));
  return result;
}

function averageOver(daily: Map<string, number>, dates: Date[]): number | null {
  const scores = dates
    .map((d) => daily.get(getLocalDateKey(d)))
    .filter((s): s is number => s !== undefined);
  const avg = average(scores);
  return avg === null ? null : round1(avg);
}

export function buildTrend(
  checkups: Checkup[],
  personId: string,
  category: TrendCategory,
  range: TrendRange,
): TrendData {
  const daily = dailyScores(checkups, personId, category);
  const points: ChartPoint[] = [];
  const allDays: Date[] = [];

  if (range === "week" || range === "month") {
    const n = range === "week" ? 7 : 30;
    for (let i = n - 1; i >= 0; i--) {
      const d = daysAgo(i);
      allDays.push(d);
      points.push({
        key: getLocalDateKey(d),
        label:
          range === "week"
            ? WEEKDAYS[d.getDay()]
            : `${d.getMonth() + 1}/${d.getDate()}`,
        score: averageOver(daily, [d]),
        showLabel: range === "week" || i % 7 === 0,
      });
    }
  }

  if (range === "3months") {
    for (let w = 12; w >= 0; w--) {
      const days: Date[] = [];
      for (let i = w * 7 + 6; i >= w * 7; i--) days.push(daysAgo(i));
      allDays.push(...days);
      const start = days[0];
      points.push({
        key: getLocalDateKey(start),
        label: `${start.getMonth() + 1}/${start.getDate()}`,
        score: averageOver(daily, days),
        showLabel: w % 3 === 0,
      });
    }
  }

  if (range === "year") {
    const today = daysAgo(0);
    for (let m = 11; m >= 0; m--) {
      const first = daysAgo(0);
      first.setDate(1); // set the day first so changing the month can't overflow
      first.setMonth(first.getMonth() - m);

      const days: Date[] = [];
      const cursor = new Date(first);
      while (cursor.getMonth() === first.getMonth() && cursor <= today) {
        days.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      allDays.push(...days);
      points.push({
        key: `${first.getFullYear()}-${first.getMonth() + 1}`,
        label: MONTHS[first.getMonth()],
        score: averageOver(daily, days),
        showLabel: m % 2 === 0,
      });
    }
  }

  if (range === "day") {
    allDays.push(daysAgo(0));
  }

  const daysWithData = allDays.filter((d) =>
    daily.has(getLocalDateKey(d)),
  ).length;
  return { points, daysWithData };
}

/** Today's score for each category, or null if that category wasn't checked in today. */
export function todayScores(checkups: Checkup[], personId: string) {
  const todayKey = getLocalDateKey(new Date());
  return CATEGORIES.map((category) => {
    const score = dailyScores(checkups, personId, category).get(todayKey);
    return { category, score: score === undefined ? null : round1(score) };
  });
}

/** Compares the earlier part of the range to the later part. */
export function summarizeTrend(points: ChartPoint[]): TrendSummary {
  const scores = points
    .map((p) => p.score)
    .filter((s): s is number => s !== null);
  const count = scores.length;

  if (count === 0) return { count, average: null, direction: "none" };

  const avg = round1(average(scores)!);
  if (count < 3) return { count, average: avg, direction: "not-enough" };

  const half = Math.floor(count / 2);
  const change =
    average(scores.slice(-half))! - average(scores.slice(0, half))!;
  const direction =
    change > TREND_THRESHOLD
      ? "up"
      : change < -TREND_THRESHOLD
        ? "down"
        : "steady";

  return { count, average: avg, direction };
}

export function describeTrend(
  s: TrendSummary,
  subject: string,
  range: TrendRange,
): string {
  const when = RANGE_PHRASES[range];
  const avg = s.average?.toFixed(1);

  switch (s.direction) {
    case "none":
      return `No check-ins ${when}.`;
    case "not-enough":
      return `Only a few check-ins ${when} so far, so there isn't a clear pattern yet.`;
    case "up":
      return `${subject} scores rose ${when}, averaging ${avg} out of 5.`;
    case "down":
      return `${subject} scores dipped ${when}, averaging ${avg} out of 5. Worth keeping an eye on.`;
    case "steady":
      return `${subject} scores held steady ${when}, averaging ${avg} out of 5.`;
  }
}

/**
 * DEMO ONLY: a year of realistic check-ins for one person, with about 1 in 8 days missed
 * and a gradual memory dip over the last six weeks so the trend views have something to show.
 */
export function generateDemoCheckups(personId: string, days = 365): Checkup[] {
  const offsets: Record<ReportCategory, number> = {
    Memory: 0,
    Speech: 0.7,
    Mobility: -0.9,
    Conversation: 0.6,
  };
  const result: Checkup[] = [];

  for (let i = days - 1; i >= 0; i--) {
    if (i !== 0 && Math.random() < 0.12) continue; // always include today

    const date = daysAgo(i);
    const reportDate = getLocalDateKey(date);

    for (const category of CATEGORIES) {
      let score =
        3.6 +
        0.4 * Math.sin(i / 30) +
        offsets[category] +
        (Math.random() - 0.5) * 1.2;
      if (category === "Memory" && i < 45) score -= ((45 - i) / 45) * 1.0;

      const rating = Math.min(4, Math.max(0, Math.round(score) - 1));
      result.push({
        id: `demo-${reportDate}-${category}`,
        personId,
        category,
        rating,
        notes: "",
        createdAt: date.toISOString(),
        reportDate,
      });
    }
  }

  return result;
}
