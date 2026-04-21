"use client";

import { useState, useEffect } from "react";
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
  onBulkStatusChange: (ids: string[], status: Status) => Promise<void>;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onBulkStale: (ids: string[], isStale: boolean) => Promise<void>;
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
  onBulkStatusChange,
  onBulkDelete,
  onBulkStale,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Clear selection when filter or search changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [filterStatus, search]);

  const toggleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(
      selectedIds.size === filteredJobs.length
        ? new Set()
        : new Set(filteredJobs.map((j) => j.id))
    );
  };

  const runBulkAction = async (action: () => Promise<void>) => {
    setBulkLoading(true);
    await action();
    setSelectedIds(new Set());
    setBulkLoading(false);
  };

  const handleBulkStatus = async (status: Status) => {
    if (!status) return;
    runBulkAction(() => onBulkStatusChange(Array.from(selectedIds), status));
  };

  const handleBulkDelete = () => {
    const count = selectedIds.size;
    if (!window.confirm(`Delete ${count} job${count > 1 ? "s" : ""}? This can't be undone.`)) return;
    runBulkAction(() => onBulkDelete(Array.from(selectedIds)));
  };

  const allSelected = filteredJobs.length > 0 && selectedIds.size === filteredJobs.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  return (
    <div>
      {/* Header row */}
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
        <h2 style={{ fontFamily: "var(--font-dm-serif), serif", fontSize: 28, color: "#f1f5f9" }}>
          All Applications
        </h2>
        <input
          className="input-field"
          style={{ maxWidth: 240, padding: "8px 14px", fontSize: 13 }}
          placeholder="🔍  Search company, title, notes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filter-pills">
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
                    isActive
                      ? (sc?.accent || "rgba(255,255,255,0.2)") + "66"
                      : "rgba(255,255,255,0.07)"
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

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div
          className="animate-slide-down"
          style={{
            position: "sticky",
            top: 72,
            zIndex: 40,
            background: "#1a2235",
            border: "1px solid rgba(59,130,246,0.3)",
            borderRadius: 12,
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
            backdropFilter: "blur(12px)",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "#60a5fa", minWidth: 80 }}>
            {selectedIds.size} selected
          </span>

          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />

          {/* Status change */}
          <select
            className="input-field"
            style={{ width: "auto", padding: "6px 12px", fontSize: 12, cursor: "pointer" }}
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) handleBulkStatus(e.target.value as Status);
              e.target.value = "";
            }}
            disabled={bulkLoading}
          >
            <option value="" disabled>Change status…</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Mark stale */}
          <button
            onClick={() => runBulkAction(() => onBulkStale(Array.from(selectedIds), true))}
            disabled={bulkLoading}
            style={{
              background: "rgba(148,103,189,0.15)",
              border: "1px solid rgba(148,103,189,0.3)",
              borderRadius: 8,
              padding: "6px 14px",
              color: "#c084fc",
              fontSize: 12,
              fontFamily: "var(--font-dm-sans), sans-serif",
              cursor: "pointer",
              whiteSpace: "nowrap",
              opacity: bulkLoading ? 0.5 : 1,
            }}
          >
            ⏸ Mark Stale
          </button>

          {/* Unmark stale */}
          <button
            onClick={() => runBulkAction(() => onBulkStale(Array.from(selectedIds), false))}
            disabled={bulkLoading}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              padding: "6px 14px",
              color: "#94a3b8",
              fontSize: 12,
              fontFamily: "var(--font-dm-sans), sans-serif",
              cursor: "pointer",
              whiteSpace: "nowrap",
              opacity: bulkLoading ? 0.5 : 1,
            }}
          >
            Unmark Stale
          </button>

          {/* Delete */}
          <button
            onClick={handleBulkDelete}
            disabled={bulkLoading}
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 8,
              padding: "6px 14px",
              color: "#f87171",
              fontSize: 12,
              fontFamily: "var(--font-dm-sans), sans-serif",
              cursor: "pointer",
              whiteSpace: "nowrap",
              opacity: bulkLoading ? 0.5 : 1,
            }}
          >
            Delete
          </button>

          <div style={{ flex: 1 }} />

          {/* Clear */}
          <button
            onClick={() => setSelectedIds(new Set())}
            style={{
              background: "none",
              border: "none",
              color: "#475569",
              fontSize: 18,
              cursor: "pointer",
              lineHeight: 1,
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Job list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Select-all row */}
        {filteredJobs.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "4px 20px",
              marginBottom: 2,
            }}
          >
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onClick={toggleSelectAll}
            />
            <span style={{ fontSize: 11, color: "#334155", userSelect: "none" }}>
              {allSelected ? "Deselect all" : `Select all ${filteredJobs.length}`}
            </span>
          </div>
        )}

        {filteredJobs.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#334155" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: "#475569" }}>No applications yet</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>
              Add your first job or import a CSV to get started
            </div>
          </div>
        )}

        {filteredJobs.map((job) => {
          const sc = STATUS_COLORS[job.status];
          const isSelected = selectedIds.has(job.id);
          return (
            <div
              key={job.id}
              className="job-row"
              onClick={() => onOpenDetail(job)}
              style={{
                outline: isSelected ? "1px solid rgba(59,130,246,0.5)" : undefined,
                background: isSelected ? "rgba(59,130,246,0.06)" : undefined,
              }}
            >
              <Checkbox
                checked={isSelected}
                onClick={(e) => toggleSelect(e, job.id)}
              />
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
                <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9" }}>{job.company}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{job.title}</div>
              </div>
              <ReminderBadge job={job} />
              {job.is_stale && <StaleBadge />}
              {job.salary_range && (
                <div
                  className="job-row-secondary"
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
                  className="job-row-secondary"
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
                  className="job-row-secondary"
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
                <div className="job-row-secondary" style={{ fontSize: 12, color: "#334155", minWidth: 80, textAlign: "right" }}>
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

function Checkbox({
  checked,
  indeterminate,
  onClick,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 18,
        height: 18,
        borderRadius: 4,
        border: `1px solid ${checked || indeterminate ? "#3b82f6" : "rgba(255,255,255,0.2)"}`,
        background: checked ? "#3b82f6" : indeterminate ? "rgba(59,130,246,0.3)" : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        transition: "all 0.15s",
      }}
    >
      {checked && (
        <span style={{ color: "white", fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>
      )}
      {indeterminate && !checked && (
        <span style={{ color: "white", fontSize: 11, fontWeight: 700, lineHeight: 1 }}>—</span>
      )}
    </div>
  );
}
