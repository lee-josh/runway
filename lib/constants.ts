import type { Status, JobFormData } from "./types";

export const STATUSES: Status[] = [
  "Bookmarked",
  "Applied",
  "Phone Screen",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
];

export const STATUS_COLORS: Record<Status, { bg: string; accent: string; dot: string }> = {
  Bookmarked:     { bg: "#1e293b", accent: "#64748b", dot: "#94a3b8" },
  Applied:        { bg: "#0f2744", accent: "#3b82f6", dot: "#60a5fa" },
  "Phone Screen": { bg: "#0f2d2d", accent: "#14b8a6", dot: "#2dd4bf" },
  Interview:      { bg: "#1a1f0e", accent: "#84cc16", dot: "#a3e635" },
  Offer:          { bg: "#0f2f1a", accent: "#22c55e", dot: "#4ade80" },
  Rejected:       { bg: "#2d0f0f", accent: "#ef4444", dot: "#f87171" },
  Withdrawn:      { bg: "#1a1a1a", accent: "#6b7280", dot: "#9ca3af" },
};

export const EMPTY_FORM: JobFormData = {
  company: "",
  title: "",
  status: "Applied",
  url: "",
  applied_date: null,
  contact: "",
  notes: "",
  round: "",
  stage: "",
  follow_up_date: null,
  follow_up_note: "",
  salary_range: "",
  is_stale: false,
};
