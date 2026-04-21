import { STATUSES, EMPTY_FORM } from "./constants";
import type { JobFormData } from "./types";

export function daysDiff(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date().toISOString().split("T")[0];
  const diff = (new Date(dateStr).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24);
  return Math.ceil(diff);
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function parseCSV(text: string): JobFormData[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().toLowerCase().replace(/\s+/g, "").replace(/[^a-z]/g, ""));

  const FIELD_MAP: Record<string, keyof JobFormData> = {
    company: "company",
    companyname: "company",
    title: "title",
    jobtitle: "title",
    position: "title",
    role: "title",
    status: "status",
    url: "url",
    link: "url",
    applicationurl: "url",
    joburl: "url",
    applieddate: "applied_date",
    dateapplied: "applied_date",
    applied: "applied_date",
    contact: "contact",
    recruiter: "contact",
    contactemail: "contact",
    notes: "notes",
    note: "notes",
    comments: "notes",
    round: "round",
    interviewround: "round",
    followupdate: "follow_up_date",
    followup: "follow_up_date",
    followupnote: "follow_up_note",
    remindernote: "follow_up_note",
    stage: "stage",
    interviewstage: "stage",
    salaryrange: "salary_range",
    salary: "salary_range",
    compensation: "salary_range",
    pay: "salary_range",
  };

  return lines
    .slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const cols = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=,)$|^(?=,))/g) || [];
      const clean = cols.map((c) => c.replace(/^"|"$/g, "").trim());
      const obj: JobFormData = { ...EMPTY_FORM };

      headers.forEach((h, idx) => {
        const field = FIELD_MAP[h];
        if (field && clean[idx] !== undefined) {
          (obj as Record<string, unknown>)[field] = clean[idx];
        }
      });

      const matchedStatus = STATUSES.find(
        (s) => s.toLowerCase() === (obj.status as string).toLowerCase()
      );
      obj.status = matchedStatus || "Applied";
      return obj;
    })
    .filter((j) => j.company || j.title);
}
