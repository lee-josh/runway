import { STATUSES, EMPTY_FORM } from "./constants";
import type { JobFormData, Status } from "./types";

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

// Converts M/D/YY, M/D/YYYY, or already-ISO dates to YYYY-MM-DD. Returns null if empty/invalid.
function parseDate(s: string | null | undefined): string | null {
  if (!s?.trim()) return null;
  const t = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    const year = m[3].length === 2 ? "20" + m[3] : m[3];
    return `${year}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  }
  return null;
}

// Proper CSV line splitter — handles quoted fields containing commas and escaped quotes.
function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Derives app status from the Applied/Response/Interview/Stage columns used in Josh's CSV format.
// Priority order: explicit stage text > interview result > response result > default
function deriveStatus(
  applied: string,
  response: string,
  interview: string,
  stage: string
): Status {
  const isApplied = ["true", "yes", "1"].includes(applied.toLowerCase().trim());
  if (!isApplied) return "Bookmarked";

  const s = stage.toLowerCase().trim();
  const r = response.toLowerCase().trim();
  const i = interview.toLowerCase().trim();

  // Explicit stage text wins first
  if (s.includes("rejection") || s === "rejected") return "Rejected";
  if (s.includes("offer")) return "Offer";
  if (s.includes("technical interview") || s.includes("final round") || s.includes("on-site")) return "Interview";
  if (s.includes("recruiter screening") || s.includes("phone screen")) return "Phone Screen";

  // Interview column
  if (i === "no") return "Rejected";
  if (i === "yes") return "Interview";
  if (i && i !== "") return "Phone Screen"; // catches "For Another Role", etc.

  // Response column
  if (r === "yes") return "Phone Screen";
  if (r === "no") return "Rejected";

  return "Applied";
}

export function parseCSV(text: string): JobFormData[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const rawHeaders = splitCSVLine(lines[0]);
  const headers = rawHeaders.map((h) =>
    h.trim().toLowerCase().replace(/\s+/g, "").replace(/[^a-z]/g, "")
  );

  // Detect Josh-style status-derivation columns
  const colIdx = {
    applied: headers.indexOf("applied"),       // "Applied?" → TRUE/FALSE
    response: headers.indexOf("response"),     // "Response?" → Yes/No
    interview: headers.indexOf("interview"),   // "Interview?" → Yes/No/other
    stage: headers.indexOf("stage"),           // "Stage" → free text
    customquestions: headers.indexOf("customquestions"),
    answer: headers.indexOf("answer"),
    applieddate: Math.max(
      headers.indexOf("applieddate"),
      headers.indexOf("dateapplied")
    ),
  };

  // If any of the status-derivation columns exist, use smart derivation mode
  const smartMode = colIdx.applied >= 0 || colIdx.response >= 0 || colIdx.interview >= 0;

  const FIELD_MAP: Record<string, keyof JobFormData> = {
    company: "company",     companyname: "company",
    title: "title",         jobtitle: "title",    position: "title", role: "title",
    status: "status",
    url: "url",             link: "url",          applicationurl: "url", joburl: "url",
    applieddate: "applied_date", dateapplied: "applied_date",
    contact: "contact",     recruiter: "contact", contactemail: "contact",
    notes: "notes",         note: "notes",        comments: "notes",
    round: "round",         interviewround: "round",
    followupdate: "follow_up_date", followup: "follow_up_date",
    followupnote: "follow_up_note", remindernote: "follow_up_note",
    stage: "stage",         interviewstage: "stage",
    salaryrange: "salary_range", salary: "salary_range", compensation: "salary_range", pay: "salary_range",
  };

  // In generic (non-smart) mode, "applied" column → applied_date
  if (!smartMode) FIELD_MAP["applied"] = "applied_date";

  const SKIP_IN_SMART = new Set(["applied", "response", "interview", "customquestions", "answer"]);

  return lines
    .slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const cols = splitCSVLine(line);
      const obj: JobFormData = { ...EMPTY_FORM };

      headers.forEach((h, idx) => {
        if (smartMode && SKIP_IN_SMART.has(h)) return;
        const field = FIELD_MAP[h];
        if (field && cols[idx] !== undefined) {
          (obj as Record<string, unknown>)[field] = cols[idx] || null;
        }
      });

      // Normalize dates regardless of source format
      obj.applied_date = parseDate(obj.applied_date as string | null);
      obj.follow_up_date = parseDate(obj.follow_up_date as string | null);

      if (smartMode) {
        // Derive status from the boolean/signal columns
        const applied   = colIdx.applied   >= 0 ? (cols[colIdx.applied]   || "") : "true";
        const response  = colIdx.response  >= 0 ? (cols[colIdx.response]  || "") : "";
        const interview = colIdx.interview >= 0 ? (cols[colIdx.interview] || "") : "";
        const stage     = (obj.stage as string) || "";
        obj.status = deriveStatus(applied, response, interview, stage);

        // Merge Custom Questions + Answer into notes
        const customQ = colIdx.customquestions >= 0 ? (cols[colIdx.customquestions] || "") : "";
        const answer  = colIdx.answer          >= 0 ? (cols[colIdx.answer]          || "") : "";
        const extra = [
          customQ && `Q: ${customQ}`,
          answer  && `A: ${answer}`,
        ].filter(Boolean).join("\n");
        if (extra) {
          obj.notes = obj.notes ? `${obj.notes}\n\n${extra}` : extra;
        }
      } else {
        const matchedStatus = STATUSES.find(
          (s) => s.toLowerCase() === (obj.status as string).toLowerCase()
        );
        obj.status = matchedStatus || "Applied";
      }

      return obj;
    })
    .filter((j) => j.company || j.title);
}
