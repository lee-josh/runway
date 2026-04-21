import { JobFormData } from "@/lib/types";
import { STATUSES } from "@/lib/constants";

interface Props {
  form: JobFormData;
  setForm: (f: JobFormData) => void;
  editId: string | null;
  errors: Record<string, string>;
  scraping: boolean;
  scrapeError: string;
  scrapeSuccess: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  onScrapeURL: () => void;
}

export default function AddEditForm({
  form,
  setForm,
  editId,
  errors,
  scraping,
  scrapeError,
  scrapeSuccess,
  onSubmit,
  onCancel,
  onScrapeURL,
}: Props) {
  const update = (key: keyof JobFormData, value: string | boolean | null) =>
    setForm({ ...form, [key]: value });

  return (
    <div style={{ maxWidth: 680, animation: "fadeIn 0.3s ease" }}>
      <div style={{ marginBottom: 32 }}>
        <p
          style={{
            color: "#475569",
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 6,
          }}
        >
          {editId ? "Edit application" : "New application"}
        </p>
        <h2
          style={{
            fontFamily: "var(--font-dm-serif), serif",
            fontSize: 32,
            color: "#f1f5f9",
          }}
        >
          {editId ? "Update this role" : "Track a new role"}
        </h2>
      </div>

      {/* URL autofill */}
      <div style={{ marginBottom: 16 }}>
        <div className="label">Application URL</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="input-field"
            placeholder="https://..."
            value={form.url}
            onChange={(e) => update("url", e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            onClick={onScrapeURL}
            disabled={scraping}
            style={{
              background: scrapeSuccess
                ? "linear-gradient(135deg,#22c55e,#16a34a)"
                : "linear-gradient(135deg,#6366f1,#4338ca)",
              border: "none",
              borderRadius: 10,
              padding: "0 18px",
              color: "white",
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 13,
              fontWeight: 600,
              cursor: scraping ? "wait" : "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.3s",
              opacity: scraping ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {scraping ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: 12,
                    height: 12,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "white",
                    borderRadius: "50%",
                    animation: "spinLoader 0.7s linear infinite",
                  }}
                />
                Fetching…
              </>
            ) : scrapeSuccess ? (
              "✓ Done!"
            ) : (
              "✦ Autofill"
            )}
          </button>
        </div>
        {scrapeError && (
          <p style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>{scrapeError}</p>
        )}
        {scrapeSuccess && (
          <p style={{ color: "#4ade80", fontSize: 12, marginTop: 6 }}>
            ✓ Fields filled from job posting!
          </p>
        )}
      </div>

      <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {(
          [
            { key: "company", label: "Company *", placeholder: "e.g. Stripe" },
            { key: "title", label: "Job Title *", placeholder: "e.g. Operations Manager" },
            { key: "contact", label: "Contact / Recruiter", placeholder: "name@company.com" },
            { key: "applied_date", label: "Applied Date", placeholder: "", type: "date" },
            { key: "round", label: "Interview Round", placeholder: "e.g. Round 1, Final" },
            {
              key: "stage",
              label: "Interview Stage",
              placeholder: "e.g. Recruiter Screening, Technical Interview",
            },
            { key: "salary_range", label: "Salary Range", placeholder: "e.g. $120k – $160k" },
          ] as Array<{
            key: keyof JobFormData;
            label: string;
            placeholder: string;
            type?: string;
          }>
        ).map((f) => (
          <div key={f.key}>
            <div className="label">{f.label}</div>
            <input
              className="input-field"
              type={f.type || "text"}
              placeholder={f.placeholder}
              value={(form[f.key] as string) || ""}
              onChange={(e) => update(f.key, e.target.value)}
            />
            {errors[f.key] && <div className="err">{errors[f.key]}</div>}
          </div>
        ))}

        <div>
          <div className="label">Status</div>
          <select
            className="input-field"
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Stale toggle */}
        <div className="form-full" style={{ gridColumn: "span 2" }}>
          <div
            style={{
              height: 1,
              background: "rgba(255,255,255,0.06)",
              margin: "4px 0 20px",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: form.is_stale ? "rgba(148,103,189,0.08)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${form.is_stale ? "rgba(148,103,189,0.3)" : "rgba(255,255,255,0.07)"}`,
              borderRadius: 12,
              padding: "14px 18px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: form.is_stale ? "#c084fc" : "#94a3b8",
                  marginBottom: 3,
                }}
              >
                ⏸ Mark as Stale
              </div>
              <div style={{ fontSize: 12, color: "#475569" }}>
                No response in 2+ weeks — flag for review or archive
              </div>
            </div>
            <button
              onClick={() => update("is_stale", !form.is_stale)}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s",
                flexShrink: 0,
                background: form.is_stale ? "#9333ea" : "rgba(255,255,255,0.1)",
                position: "relative",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: form.is_stale ? 23 : 3,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "white",
                  transition: "left 0.3s",
                  display: "block",
                }}
              />
            </button>
          </div>
        </div>

        {/* Follow-up section */}
        <div className="form-full" style={{ gridColumn: "span 2", marginTop: 8 }}>
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 20 }} />
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#94a3b8",
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 16 }}>🔔</span> Follow-up Reminder
          </div>
        </div>

        <div>
          <div className="label">Reminder Date</div>
          <input
            className="input-field"
            type="date"
            value={form.follow_up_date || ""}
            onChange={(e) => update("follow_up_date", e.target.value || null)}
          />
        </div>
        <div>
          <div className="label">Reminder Note</div>
          <input
            className="input-field"
            placeholder="e.g. Send thank-you email"
            value={form.follow_up_note}
            onChange={(e) => update("follow_up_note", e.target.value)}
          />
        </div>

        <div className="form-full" style={{ gridColumn: "span 2" }}>
          <div className="label">Notes</div>
          <textarea
            className="input-field"
            rows={3}
            placeholder="Interview feedback, follow-up reminders, impressions..."
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            style={{ resize: "vertical" }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
        <button className="btn-primary" onClick={onSubmit}>
          {editId ? "Save Changes" : "Add Application"}
        </button>
        <button className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
