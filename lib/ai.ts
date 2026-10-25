import type { ReportSummary } from "@/lib/report";
import type { ReportSections } from "@/types/data";

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Change this one line to switch models.
const MODEL = "gemini-3.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// The app builds the header, score table, raw notes and disclaimer itself.
// Gemini only writes the observation paragraphs, returned as JSON fields.
const SYSTEM_PROMPT = `You write the written sections of a check-in report for a caregiving app. The reader is a doctor, nurse, or another caregiver who needs a clear, accurate picture of how one person has been doing.

INPUT
You will receive a JSON summary of daily check-ins for one person. Each day, a caregiver rates four areas: Memory, Speech, Mobility and Conversation. Ratings run from 1 (very poor) to 5 (very good). These are the caregiver's observations, not clinical measurements.

The summary covers three periods: lastWeek (7 days), lastMonth (30 days) and last3Months (91 days). For each period it gives days with check-ins, missed days, an overall average, and an average and trend direction for each area. Directions are "up", "down", "steady", "not-enough" (too little data) or "none" (no data). It may also include recent caregiver notes with dates and the rating given that day.

Every number has already been calculated. Use only the numbers in the summary. Never calculate new statistics, invent data, or mention dates or events that are not in the input.

The app shows the full score table, the caregiver's notes word for word, and a disclaimer next to your text. Do not repeat the whole table or reproduce every note. Cite the specific numbers that support each point you make.

TONE
Clear, objective and professional. Be specific: "Memory averaged 2.9 over the last 30 days, down from 3.8 over 90 days," not "Memory got worse." No filler, reassurance or emotional language. A busy doctor should understand what changed within two minutes.

FIELDS
Return JSON with these fields:

summary: 3 to 5 sentences. The overall picture across the three periods, the most notable change, and how consistently check-ins were recorded.

memory, speech, mobility, conversation: one paragraph each, 2 to 4 sentences. Describe the direction across the 7-day, 30-day and 90-day periods and what stands out. Treat a difference smaller than 0.3 between periods as stable. If a period has direction "not-enough" or "none", say there is too little data for it rather than describing a trend.

notesSummary: 2 to 4 sentences on what the caregiver's notes describe, citing dates, and whether any notes line up with a change in ratings. If there are no notes, return an empty string.

changesToDiscuss: a list of short items, one per concern. Include any area whose 30-day and 90-day directions are both "down", and any area averaging 2 or below in the last 7 days. Each item names the area, states the numbers, and recommends discussing it with the person's doctor. Return an empty list if nothing qualifies.

dataCompleteness: 1 to 2 sentences on how many days had check-ins in each period and whether gaps limit how much the trends can be trusted.

RULES
- Never diagnose, name a possible condition, or suggest medication, treatment or dosage.
- Never speculate about causes beyond what the caregiver's notes say.
- Plain sentences inside each field: no markdown, asterisks, bullet symbols or emoji.
- Write every field fully. Do not cut sections short to save space.`;

// Tells Gemini exactly what JSON shape to return.
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    memory: { type: "STRING" },
    speech: { type: "STRING" },
    mobility: { type: "STRING" },
    conversation: { type: "STRING" },
    notesSummary: { type: "STRING" },
    changesToDiscuss: { type: "ARRAY", items: { type: "STRING" } },
    dataCompleteness: { type: "STRING" },
  },
  required: [
    "summary",
    "memory",
    "speech",
    "mobility",
    "conversation",
    "notesSummary",
    "changesToDiscuss",
    "dataCompleteness",
  ],
  propertyOrdering: [
    "summary",
    "memory",
    "speech",
    "mobility",
    "conversation",
    "notesSummary",
    "changesToDiscuss",
    "dataCompleteness",
  ],
};

/** Checks that the parsed JSON has every field, so a bad response fails here, not inside the PDF. */
function toSections(value: unknown): ReportSections {
  const v = value as Record<string, unknown>;
  const str = (key: string) => {
    if (typeof v?.[key] !== "string")
      throw new Error(`Report is missing "${key}".`);
    return (v[key] as string).trim();
  };

  const changes = v?.changesToDiscuss;
  if (!Array.isArray(changes))
    throw new Error('Report is missing "changesToDiscuss".');

  return {
    summary: str("summary"),
    areas: {
      Memory: str("memory"),
      Speech: str("speech"),
      Mobility: str("mobility"),
      Conversation: str("conversation"),
    },
    notesSummary: str("notesSummary"),
    changesToDiscuss: changes.filter(
      (c): c is string => typeof c === "string" && c.trim() !== "",
    ),
    dataCompleteness: str("dataCompleteness"),
  };
}

/** Sends the summary to Gemini and returns the written sections. Throws a readable error on failure. */
export async function generateReport(
  summary: ReportSummary,
): Promise<ReportSections> {
  if (!GEMINI_KEY) {
    throw new Error(
      "Missing EXPO_PUBLIC_GEMINI_API_KEY. Add it to .env in the project root and restart Expo.",
    );
  }

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": GEMINI_KEY,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: JSON.stringify(summary) }] }],
      generationConfig: {
        maxOutputTokens: 3500,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ?? `Gemini request failed (${response.status}).`,
    );
  }

  const candidate = data?.candidates?.[0];
  if (candidate?.finishReason === "MAX_TOKENS") {
    throw new Error(
      "The report was cut off. Raise maxOutputTokens in lib/ai.ts.",
    );
  }

  const parts: { text?: string }[] = candidate?.content?.parts ?? [];
  const text = parts
    .map((p) => p.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini returned an empty report. Try again.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Gemini's reply wasn't valid JSON. Try again.");
  }

  return toSections(parsed);
}
