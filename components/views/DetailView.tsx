import { Job } from "@/lib/types";
import { STATUS_COLORS } from "@/lib/constants";
import { daysDiff, formatDate, formatDateShort } from "@/lib/utils";
import StatusPill from "@/components/ui/StatusPill";
import StaleBadge from "@/components/ui/StaleBadge";

interface Props {
  job: Job;
  onBack: () => void;
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
  onToggleStale: (id: string) => void;
}

export default function DetailView({ job, onBack, onEdit, onDelete, onToggleStale }: Props) {
  const sc = STATUS_COLORS[job.status];
  const d = daysDiff(job.follow_up_date);

  return (
    <div style={{ maxWidth: 680, animation: "fadeIn 0.3s ease" }}>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: "#475569",
          cursor: "pointer",
          fontSize: 13,
          fontFamily: "var(--font-dm-sans), sans-serif",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        ← Back to list
      </button>

      <div
        style={{
          background: sc.bg,
          border: `1px solid ${sc.accent}33`,
          borderRadius: 20,
          padding: 32,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "rgba(0,0,0,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: 700,
                  color: sc.dot,
                }}
              >
                {job.company[0]}
              </div>
              <StatusPill
                status={job.status}
                style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${sc.accent}66` }}
              />
              {job.is_stale && <StaleBadge />}
            </div>
            <h2
              style={{
                fontFamily: "var(--font-dm-serif), serif",
                fontSize: 32,
                color: "#f1f5f9",
                marginBottom: 4,
              }}
            >
              {job.company}
            </h2>
            <p style={{ fontSize: 16, color: "#94a3b8" }}>{job.title}</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => onToggleStale(job.id)}
              style={{
                background: job.is_stale ? "rgba(147,51,234,0.15)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${job.is_stale ? "rgba(147,51,234,0.4)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 10,
                padding: "8px 16px",
                color: job.is_stale ? "#c084fc" : "#64748b",
                fontSize: 13,
                fontFamily: "var(--font-dm-sans), sans-serif",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {job.is_stale ? "⏸ Stale" : "Mark Stale"}
            </button>
            <button
              className="btn-ghost"
              style={{ padding: "8px 16px", fontSize: 13 }}
              onClick={() => onEdit(job)}
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(job.id)}
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 10,
                padding: "8px 16px",
                color: "#f87171",
                fontSize: 13,
                fontFamily: "var(--font-dm-sans), sans-serif",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {job.follow_up_date && d !== null && d <= 7 && (
        <div
          style={{
            background:
              d < 0
                ? "rgba(239,68,68,0.08)"
                : d === 0
                ? "rgba(251,191,36,0.08)"
                : "rgba(99,179,237,0.07)",
            border: `1px solid ${
              d < 0
                ? "rgba(239,68,68,0.2)"
                : d === 0
                ? "rgba(251,191,36,0.2)"
                : "rgba(99,179,237,0.15)"
            }`,
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 16 }}>🔔</span>
          <div style={{ flex: 1 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: d < 0 ? "#fca5a5" : d === 0 ? "#fde68a" : "#bfdbfe",
              }}
            >
              {job.follow_up_note || "Follow up reminder"}
            </span>
            <span style={{ fontSize: 12, color: "#475569", marginLeft: 10 }}>
              {d < 0 ? `${Math.abs(d)} days overdue` : d === 0 ? "Due today" : `Due in ${d} days`}
            </span>
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 12,
        }}
      >
        {(
          [
            { label: "Applied", value: formatDate(job.applied_date) },
            { label: "Interview Round", value: job.round || "—" },
            { label: "Contact", value: job.contact || "—" },
            {
              label: "Application URL",
              value: job.url ? "View posting ↗" : "—",
              link: job.url || undefined,
            },
            { label: "Stage", value: job.stage || "—" },
            { label: "Salary Range", value: job.salary_range || "—" },
            { label: "Stale", value: job.is_stale ? "⏸ Marked stale" : "Active" },
            { label: "Follow-up Date", value: formatDate(job.follow_up_date) },
            { label: "Follow-up Note", value: job.follow_up_note || "—" },
          ] as Array<{ label: string; value: string; link?: string }>
        ).map((f) => (
          <div key={f.label} className="stat-card" style={{ padding: "16px 20px" }}>
            <div className="label">{f.label}</div>
            {f.link ? (
              <a
                href={f.link}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#60a5fa", fontSize: 14, textDecoration: "none" }}
              >
                {f.value}
              </a>
            ) : (
              <div
                style={{
                  fontSize: 14,
                  color: f.value === "—" ? "#334155" : "#e2e8f0",
                  marginTop: 4,
                }}
              >
                {f.value}
              </div>
            )}
          </div>
        ))}
      </div>

      {job.notes && (
        <div className="stat-card">
          <div className="label" style={{ marginBottom: 10 }}>
            Notes
          </div>
          <p
            style={{
              fontSize: 14,
              color: "#94a3b8",
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}
          >
            {job.notes}
          </p>
        </div>
      )}
    </div>
  );
}
