export type ReportCategory = "Memory" | "Speech" | "Mobility" | "Conversation";

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

export type SavedReport = {
  id: string;
  personId: string;
  text: string;
  createdAt: string;
};
