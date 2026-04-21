import { Job } from "@/lib/types";
import { daysDiff, formatDateShort } from "@/lib/utils";
import ReminderBadge from "@/components/ui/ReminderBadge";

interface Props {
  jobs: Job[];
  reminders: Job[];
  dismissedReminders: string[];
  setDismissedReminders: (ids: string[]) => void;
  onOpenDetail: (job: Job) => void;
}

export default function RemindersView({
  jobs,
  reminders,
  dismissedReminders,
  setDismissedReminders,
  onOpenDetail,
}: Props) {
  const upcoming = jobs
    .filter((j) => {
      if (!j.follow_up_date || dismissedReminders.includes(j.id)) return false;
      const d = daysDiff(j.follow_up_date);
      return d !== null && d > 3 && d <= 14;
    })
    .sort((a, b) => (a.follow_up_date || "").localeCompare(b.follow_up_date || ""));

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 32 }}>
        <p
          style={{
            color: "#475569",
            fontSize: 13,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 6,
          }}
        >
          Action needed
        </p>
        <h2
          style={{
            fontFamily: "var(--font-dm-serif), serif",
            fontSize: 32,
            color: "#f1f5f9",
          }}
        >
          Follow-up Reminders
        </h2>
      </div>

      {reminders.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <div
            style={{
              fontFamily: "var(--font-dm-serif), serif",
              fontSize: 24,
              color: "#475569",
              marginBottom: 8,
            }}
          >
            All caught up
          </div>
          <div style={{ fontSize: 14, color: "#334155" }}>
            No follow-ups due in the next 3 days
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 40 }}>
        {reminders.map((job) => {
          const d = daysDiff(job.follow_up_date);
          const overdue = d !== null && d < 0;
          const isToday = d === 0;
          const borderColor = overdue
            ? "rgba(239,68,68,0.25)"
            : isToday
            ? "rgba(251,191,36,0.25)"
            : "rgba(99,179,237,0.2)";
          const bgColor = overdue
            ? "rgba(239,68,68,0.06)"
            : isToday
            ? "rgba(251,191,36,0.06)"
            : "rgba(99,179,237,0.05)";
          const dotColor = overdue ? "#f87171" : isToday ? "#fbbf24" : "#93c5fd";

          return (
            <div
              key={job.id}
              className="reminder-card"
              style={{ background: bgColor, border: `1px solid ${borderColor}` }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: dotColor,
                  marginTop: 6,
                  flexShrink: 0,
                  boxShadow: `0 0 6px ${dotColor}`,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 4,
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9" }}>
                    {job.company}
                  </span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>·</span>
                  <span style={{ fontSize: 13, color: "#94a3b8" }}>{job.title}</span>
                  <ReminderBadge job={job} />
                </div>
                {job.follow_up_note && (
                  <p style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>
                    {job.follow_up_note}
                  </p>
                )}
                <p style={{ fontSize: 12, color: "#334155" }}>
                  {overdue
                    ? `Was due ${formatDateShort(job.follow_up_date)}`
                    : isToday
                    ? "Due today"
                    : `Due ${formatDateShort(job.follow_up_date)}`}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => onOpenDetail(job)}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    padding: "6px 14px",
                    color: "#94a3b8",
                    fontSize: 12,
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    cursor: "pointer",
                  }}
                >
                  View
                </button>
                <button
                  onClick={() => setDismissedReminders([...dismissedReminders, job.id])}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 8,
                    padding: "6px 14px",
                    color: "#475569",
                    fontSize: 12,
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    cursor: "pointer",
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {upcoming.length > 0 && (
        <div>
          <div className="label" style={{ marginBottom: 12 }}>
            Coming up (next 2 weeks)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upcoming.map((job) => (
              <div
                key={job.id}
                onClick={() => onOpenDetail(job)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 10,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.04)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.02)")
                }
              >
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0" }}>
                    {job.company}
                  </span>
                  <span style={{ fontSize: 12, color: "#475569", marginLeft: 8 }}>
                    {job.follow_up_note || "Follow up"}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: "#475569" }}>
                  {formatDateShort(job.follow_up_date)}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "#334155",
                    background: "rgba(255,255,255,0.04)",
                    padding: "2px 10px",
                    borderRadius: 6,
                  }}
                >
                  in {daysDiff(job.follow_up_date)}d
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
