"use client";

import { useState, useRef } from "react";
import { JobFormData } from "@/lib/types";
import { STATUS_COLORS } from "@/lib/constants";
import { parseCSV } from "@/lib/utils";

interface Props {
  onImport: (jobs: JobFormData[]) => void;
  onClose: () => void;
}

export default function CsvImportModal({ onImport, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<JobFormData[] | null>(null);
  const [error, setError] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseCSV(ev.target?.result as string);
        if (!parsed.length) {
          setError("No valid rows found. Make sure your CSV has Company and Title columns.");
          return;
        }
        setPreview(parsed);
      } catch {
        setError("Could not parse this file. Please check the format.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: "var(--font-dm-serif), serif",
                fontSize: 24,
                color: "#f1f5f9",
                marginBottom: 4,
              }}
            >
              Import from CSV
            </h3>
            <p style={{ fontSize: 13, color: "#475569" }}>
              Upload your Google Sheet export or any CSV with job data
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#475569",
              fontSize: 20,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {!preview ? (
          <>
            <div className="drop-zone" onClick={() => fileRef.current?.click()}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📂</div>
              <p
                style={{ fontSize: 14, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}
              >
                Click to choose your CSV file
              </p>
              <p style={{ fontSize: 12, color: "#334155" }}>or drag and drop here</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
            </div>
            {error && (
              <p style={{ color: "#f87171", fontSize: 13, marginTop: 12 }}>{error}</p>
            )}
          </>
        ) : (
          <>
            <div
              style={{
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.2)",
                borderRadius: 10,
                padding: "12px 16px",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 16 }}>✅</span>
              <span style={{ fontSize: 13, color: "#4ade80" }}>
                <strong>{preview.length} rows</strong> detected and ready to import
              </span>
            </div>
            <div style={{ maxHeight: 280, overflowY: "auto", marginBottom: 20 }}>
              {preview.map((job, i) => {
                const sc = STATUS_COLORS[job.status];
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 12px",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: sc?.bg || "#1e293b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        color: sc?.dot || "#94a3b8",
                        flexShrink: 0,
                      }}
                    >
                      {(job.company || "?")[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0" }}>
                        {job.company || <em style={{ color: "#475569" }}>No company</em>}
                      </div>
                      <div style={{ fontSize: 12, color: "#475569" }}>{job.title}</div>
                    </div>
                    <span
                      className="status-pill"
                      style={{
                        background: sc?.bg,
                        color: sc?.dot,
                        border: `1px solid ${sc?.accent}44`,
                        flexShrink: 0,
                      }}
                    >
                      {job.status}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-primary" onClick={() => onImport(preview)}>
                Import {preview.length} Jobs
              </button>
              <button className="btn-ghost" onClick={() => setPreview(null)}>
                ← Choose different file
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

