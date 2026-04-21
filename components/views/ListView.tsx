import { Job, Status } from "@/lib/types";
import { STATUSES, STATUS_COLORS } from "@/lib/constants";
import { formatDateShort } from "@/lib/utils";
import ReminderBadge from "@/components/ui/ReminderBadge";
import StaleBadge from "@/components/ui/StaleBadge";
import StatusPill from "@/components/ui/StatusPill";

interface Props {
  jobs: Job[];
  filteredJobs: Job[];
  filterStatus: string;
  search: string;
  setFilterStatus: (s: string) => void;
  setSearch: (s: string) => void;
  onOpenDetail: (job: Job) => void;
  onAddJob: () => void;
}

export default function ListView({
  jobs,
  filteredJobs,
  filterStatus,
  search,
  setFilterStatus,
  setSearch,
  onOpenDetail,
  onAddJob,
}: Props) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-dm-serif), serif",
            fontSize: 28,
            color: "#f1f5f9",
          }}
        >
          All Applications
        </h2>
        <input
          className="input-field"
          style={{ maxWidth: 240, padding: "8px 14px", fontSize: 13 }}
          placeholder="🔍  Search company, title, notes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["All", ...STATUSES].map((s) => {
            const sc = STATUS_COLORS[s as Status];
            const isActive = filterStatus === s;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  background: isActive ? (sc?.bg || "rgba(255,255,255,0.08)") : "transparent",
                  border: `1px solid ${
                    isActive ? (sc?.accent || "rgba(255,255,255,0.2)") + "66" : "rgba(255,255,255,0.07)"
                  }`,
                  color: isActive ? (sc?.dot || "#e2e8f0") : "#64748b",
                  borderRadius: 20,
                  padding: "5px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  letterSpacing: "0.04em",
                }}
              >
                {s === "All"
                  ? `All (${jobs.length})`
                  : `${s} (${jobs.filter((j) => j.status === s).length})`}
              </button>
            );
          })}
          <button
            onClick={() => setFilterStatus("Stale")}
            style={{
              background: filterStatus === "Stale" ? "rgba(148,103,189,0.2)" : "transparent",
              border: `1px solid ${
                filterStatus === "Stale" ? "rgba(148,103,189,0.5)" : "rgba(255,255,255,0.07)"
              }`,
              color: filterStatus === "Stale" ? "#c084fc" : "#64748b",
              borderRadius: 20,
              padding: "5px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "var(--font-dm-sans), sans-serif",
              letterSpacing: "0.04em",
            }}
          >
            ⏸ Stale ({jobs.filter((j) => j.is_stale).length})
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filteredJobs.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#334155" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: "#475569" }}>
              No applications yet
            </div>
            <div style={{ fontSize: 13, marginTop: 6 }}>
              Add your first job or import a CSV to get started
            </div>
          </div>
        )}

        {filteredJobs.map((job) => {
          const sc = STATUS_COLORS[job.status];
          return (
            <div key={job.id} className="job-row" onClick={() => onOpenDetail(job)}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: sc.bg,
                  border: `1px solid ${sc.accent}44`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 700,
                  color: sc.dot,
                  flexShrink: 0,
                }}
              >
                {job.company[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9" }}>
                  {job.company}
                </div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{job.title}</div>
              </div>
              <ReminderBadge job={job} />
              {job.is_stale && <StaleBadge />}
              {job.salary_range && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#a3e635",
                    background: "rgba(163,230,53,0.07)",
                    border: "1px solid rgba(163,230,53,0.15)",
                    padding: "3px 10px",
                    borderRadius: 6,
                  }}
                >
                  {job.salary_range}
                </div>
              )}
              {job.stage && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#818cf8",
                    background: "rgba(129,140,248,0.07)",
                    border: "1px solid rgba(129,140,248,0.2)",
                    padding: "3px 10px",
                    borderRadius: 6,
                  }}
                >
                  {job.stage}
                </div>
              )}
              {job.round && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#475569",
                    background: "rgba(255,255,255,0.04)",
                    padding: "3px 10px",
                    borderRadius: 6,
                  }}
                >
                  {job.round}
                </div>
              )}
              {job.applied_date && (
                <div style={{ fontSize: 12, color: "#334155", minWidth: 80, textAlign: "right" }}>
                  {formatDateShort(job.applied_date)}
                </div>
              )}
              <StatusPill status={job.status} style={{ minWidth: 80, textAlign: "center" }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
