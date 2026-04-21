import { daysDiff } from "@/lib/utils";
import type { Job } from "@/lib/types";

export default function ReminderBadge({ job }: { job: Job }) {
  const d = daysDiff(job.follow_up_date);
  if (!job.follow_up_date || d === null) return null;
  if (d < -7) return null;

  const overdue = d < 0;
  const today = d === 0;
  const soon = d > 0 && d <= 3;
  if (!overdue && !today && !soon) return null;

  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 20,
        background: overdue
          ? "rgba(239,68,68,0.15)"
          : today
          ? "rgba(251,191,36,0.15)"
          : "rgba(99,179,237,0.15)",
        color: overdue ? "#f87171" : today ? "#fbbf24" : "#93c5fd",
        border: `1px solid ${
          overdue ? "rgba(239,68,68,0.3)" : today ? "rgba(251,191,36,0.3)" : "rgba(99,179,237,0.3)"
        }`,
        letterSpacing: "0.04em",
        textTransform: "uppercase" as const,
      }}
    >
      {overdue ? `${Math.abs(d)}d overdue` : today ? "Today" : `In ${d}d`}
    </span>
  );
}
