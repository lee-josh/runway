import { Job } from "@/lib/types";
import { STATUS_COLORS, STATUSES } from "@/lib/constants";
import { formatDateShort } from "@/lib/utils";
import ReminderBadge from "@/components/ui/ReminderBadge";
import StatusPill from "@/components/ui/StatusPill";

interface Stats {
  total: number;
  applied: number;
  active: number;
  offers: number;
  responseRate: number;
  stale: number;
  byStatus: { status: string; count: number }[];
}

interface Props {
  jobs: Job[];
  stats: Stats;
  reminders: Job[];
  onNavigate: (view: string, filterStatus?: string) => void;
  onOpenDetail: (job: Job) => void;
}

export default function DashboardView({ jobs, stats, reminders, onNavigate, onOpenDetail }: Props) {
  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 40 }}>
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
          Your job search
        </p>
        <h1
          style={{
            fontFamily: "var(--font-dm-serif), serif",
            fontSize: 42,
            color: "#f1f5f9",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}
        >
          {stats.active > 0 ? `${stats.active} active opportunities` : "Let's get started"}
        </h1>
      </div>

      {reminders.length > 0 && (
        <div
          onClick={() => onNavigate("reminders")}
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 12,
            padding: "12px 20px",
            marginBottom: 24,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(239,68,68,0.12)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(239,68,68,0.08)")
          }
        >
          <span style={{ fontSize: 13, color: "#fca5a5" }}>
            🔔{" "}
            <strong>
              {reminders.length} follow-up{reminders.length > 1 ? "s" : ""}
            </strong>{" "}
            due soon — click to review
          </span>
          <span style={{ color: "#f87171", fontSize: 12 }}>View →</span>
        </div>
      )}

      {stats.stale > 0 && (
        <div
          onClick={() => onNavigate("list", "Stale")}
          style={{
            background: "rgba(148,103,189,0.08)",
            border: "1px solid rgba(148,103,189,0.2)",
            borderRadius: 12,
            padding: "12px 20px",
            marginBottom: 24,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(148,103,189,0.12)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(148,103,189,0.08)")
          }
        >
          <span style={{ fontSize: 13, color: "#d8b4fe" }}>
            ⏸{" "}
            <strong>
              {stats.stale} role{stats.stale > 1 ? "s" : ""}
            </strong>{" "}
            marked stale — consider following up or archiving
          </span>
          <span style={{ color: "#c084fc", fontSize: 12 }}>View →</span>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {[
          { label: "Total Tracked", value: stats.total, sub: "positions", color: "#94a3b8" },
          { label: "Applications Sent", value: stats.applied, sub: "submitted", color: "#60a5fa" },
          {
            label: "Response Rate",
            value: `${stats.responseRate}%`,
            sub: "of applications",
            color: "#2dd4bf",
          },
          { label: "Active Offers", value: stats.offers, sub: "to consider", color: "#4ade80" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="label">{s.label}</div>
            <div
              style={{
                fontSize: 44,
                fontFamily: "var(--font-dm-serif), serif",
                color: s.color,
                lineHeight: 1.1,
                margin: "8px 0 4px",
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: "#334155" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="stat-card">
          <div className="label" style={{ marginBottom: 20 }}>
            Pipeline Breakdown
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {stats.byStatus
              .filter((s) => s.count > 0)
              .map((s) => {
                const sc = STATUS_COLORS[s.status as keyof typeof STATUS_COLORS];
                return (
                  <div key={s.status}>
                    <div
                      style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          color: "#94a3b8",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: sc?.dot,
                            display: "inline-block",
                          }}
                        />
                        {s.status}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: sc?.dot }}>
                        {s.count}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${(s.count / stats.total) * 100}%`,
                          background: sc?.accent,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="stat-card">
          <div className="label" style={{ marginBottom: 20 }}>
            Recent Activity
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[...jobs]
              .sort((a, b) => (b.applied_date || "").localeCompare(a.applied_date || ""))
              .slice(0, 5)
              .map((job) => {
                const sc = STATUS_COLORS[job.status];
                return (
                  <div
                    key={job.id}
                    onClick={() => onOpenDetail(job)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 12px",
                      borderRadius: 8,
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(255,255,255,0.04)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: sc.bg,
                        border: `1px solid ${sc.accent}33`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 700,
                        color: sc.dot,
                        flexShrink: 0,
                      }}
                    >
                      {job.company[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#e2e8f0",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {job.company}
                      </div>
                      <div style={{ fontSize: 11, color: "#475569" }}>{job.title}</div>
                    </div>
                    <ReminderBadge job={job} />
                    <StatusPill status={job.status} style={{ flexShrink: 0 }} />
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
