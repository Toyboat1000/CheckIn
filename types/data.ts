export type ReportCategory = "Memory" | "Speech" | "Mobility" | "Conversation";
import type { ReportSummary } from "@/lib/report";

export type Person = {
  id: string;
  name: string;
  createdAt: string;
};

export type Checkup = {
  id: string;
  personId: string;
  category: ReportCategory;
  rating: number;
  notes: string;
  createdAt: string;
  reportDate: string;
};

export type ReportSections = {
  summary: string;
  areas: Record<ReportCategory, string>;
  notesSummary: string;
  changesToDiscuss: string[];
  dataCompleteness: string;
};

export type SavedReport = {
  id: string;
  personId: string;
  createdAt: string;
  summary?: ReportSummary; // numbers used for the PDF table
  sections?: ReportSections; // Gemini's paragraphs
  text?: string; // only on older plain-text reports
};
