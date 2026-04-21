"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import { Job, JobFormData, Status } from "@/lib/types";
import { STATUSES, EMPTY_FORM } from "@/lib/constants";
import { daysDiff } from "@/lib/utils";
import DashboardView from "@/components/views/DashboardView";
import ListView from "@/components/views/ListView";
import RemindersView from "@/components/views/RemindersView";
import AddEditForm from "@/components/views/AddEditForm";
import DetailView from "@/components/views/DetailView";
import CsvImportModal from "@/components/views/CsvImportModal";

type View = "dashboard" | "list" | "reminders" | "add" | "detail";

interface Props {
  userId: string;
  userEmail: string;
}

export default function JobTracker({ userId, userEmail }: Props) {
  const supabase = createClient();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("dashboard");
  const [form, setForm] = useState<JobFormData>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [csvModal, setCsvModal] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [dismissedReminders, setDismissedReminders] = useState<string[]>([]);
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState("");
  const [scrapeSuccess, setScrapeSuccess] = useState(false);

  // Load jobs from Supabase
  useEffect(() => {
    async function loadJobs() {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (!error && data) setJobs(data as Job[]);
      setLoading(false);
    }
    loadJobs();
  }, [userId]);

  const handleScrapeURL = async () => {
    if (!form.url || !form.url.startsWith("http")) {
      setScrapeError("Please enter a valid URL starting with http");
      return;
    }
    setScraping(true);
    setScrapeError("");
    setScrapeSuccess(false);
    try {
      const res = await fetch("/api/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.url }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "API error");
      }
      const data = await res.json();
      setForm((prev) => ({
        ...prev,
        company: data.company || prev.company,
        title: data.title || prev.title,
        salary_range: data.salary_range || prev.salary_range,
        contact: data.contact || prev.contact,
        notes: data.notes
          ? prev.notes
            ? prev.notes + "\n" + data.notes
            : data.notes
          : prev.notes,
      }));
      setScrapeSuccess(true);
      setTimeout(() => setScrapeSuccess(false), 3000);
    } catch (err) {
      setScrapeError(
        err instanceof Error ? err.message : "Couldn't extract details from this URL."
      );
    } finally {
      setScraping(false);
    }
  };

  const reminders = useMemo(
    () =>
      jobs
        .filter((j) => {
          if (!j.follow_up_date || dismissedReminders.includes(j.id)) return false;
          const d = daysDiff(j.follow_up_date);
          return d !== null && d <= 3;
        })
        .sort((a, b) => (a.follow_up_date || "").localeCompare(b.follow_up_date || "")),
    [jobs, dismissedReminders]
  );

  const stats = useMemo(() => {
    const total = jobs.length;
    const applied = jobs.filter((j) => j.status !== "Bookmarked").length;
    const active = jobs.filter((j) =>
      ["Applied", "Phone Screen", "Interview"].includes(j.status)
    ).length;
    const offers = jobs.filter((j) => j.status === "Offer").length;
    const responseRate =
      applied > 0
        ? Math.round(
            (jobs.filter((j) => ["Phone Screen", "Interview", "Offer"].includes(j.status))
              .length /
              applied) *
              100
          )
        : 0;
    const stale = jobs.filter((j) => j.is_stale).length;
    const byStatus = STATUSES.map((s) => ({
      status: s,
      count: jobs.filter((j) => j.status === s).length,
    }));
    return { total, applied, active, offers, responseRate, byStatus, stale };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    let list =
      filterStatus === "Stale"
        ? jobs.filter((j) => j.is_stale)
        : filterStatus === "All"
        ? jobs
        : jobs.filter((j) => j.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (j) =>
          (j.company || "").toLowerCase().includes(q) ||
          (j.title || "").toLowerCase().includes(q) ||
          (j.notes || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [jobs, filterStatus, search]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.company.trim()) e.company = "Required";
    if (!form.title.trim()) e.title = "Required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    if (editId) {
      const { data, error } = await supabase
        .from("jobs")
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq("id", editId)
        .eq("user_id", userId)
        .select()
        .single();
      if (!error && data) {
        setJobs((prev) => prev.map((j) => (j.id === editId ? (data as Job) : j)));
      }
      setEditId(null);
    } else {
      const { data, error } = await supabase
        .from("jobs")
        .insert({ ...form, user_id: userId })
        .select()
        .single();
      if (!error && data) {
        setJobs((prev) => [data as Job, ...prev]);
      }
    }

    setForm(EMPTY_FORM);
    setErrors({});
    setView("list");
  };

  const handleEdit = (job: Job) => {
    const formData: JobFormData = {
      company: job.company,
      title: job.title,
      status: job.status,
      url: job.url,
      applied_date: job.applied_date,
      contact: job.contact,
      notes: job.notes,
      round: job.round,
      stage: job.stage,
      follow_up_date: job.follow_up_date,
      follow_up_note: job.follow_up_note,
      salary_range: job.salary_range,
      is_stale: job.is_stale,
    };
    setForm(formData);
    setEditId(job.id);
    setView("add");
  };

  const handleDelete = async (id: string) => {
    await supabase.from("jobs").delete().eq("id", id).eq("user_id", userId);
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setSelectedJob(null);
    setView("list");
  };

  const openDetail = (job: Job) => {
    setSelectedJob(job);
    setView("detail");
  };

  const handleBulkStatusChange = async (ids: string[], status: Status) => {
    await supabase
      .from("jobs")
      .update({ status, updated_at: new Date().toISOString() })
      .in("id", ids)
      .eq("user_id", userId);
    setJobs((prev) => prev.map((j) => ids.includes(j.id) ? { ...j, status } : j));
  };

  const handleBulkDelete = async (ids: string[]) => {
    await supabase.from("jobs").delete().in("id", ids).eq("user_id", userId);
    setJobs((prev) => prev.filter((j) => !ids.includes(j.id)));
  };

  const handleBulkStale = async (ids: string[], isStale: boolean) => {
    await supabase
      .from("jobs")
      .update({ is_stale: isStale, updated_at: new Date().toISOString() })
      .in("id", ids)
      .eq("user_id", userId);
    setJobs((prev) => prev.map((j) => ids.includes(j.id) ? { ...j, is_stale: isStale } : j));
  };

  const toggleStale = async (id: string) => {
    const job = jobs.find((j) => j.id === id);
    if (!job) return;
    const newVal = !job.is_stale;
    await supabase
      .from("jobs")
      .update({ is_stale: newVal, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, is_stale: newVal } : j))
    );
    if (selectedJob?.id === id) {
      setSelectedJob((prev) => prev ? { ...prev, is_stale: newVal } : prev);
    }
  };

  const handleImportCsv = async (rows: JobFormData[]) => {
    const toInsert = rows.map((r) => ({
      ...r,
      user_id: userId,
      notes: r.notes || "",
      contact: r.contact || "",
      round: r.round || "",
      stage: r.stage || "",
      applied_date: r.applied_date || null,
      follow_up_date: r.follow_up_date || null,
    }));
    const { data, error } = await supabase.from("jobs").insert(toInsert).select();
    if (error) {
      alert(`Import failed: ${error.message}`);
      return;
    }
    if (data) {
      setJobs((prev) => [...(data as Job[]), ...prev]);
    }
    setCsvModal(false);
    setImportDone(true);
    setTimeout(() => setImportDone(false), 3000);
  };

  const handleNavigate = (v: string, fs?: string) => {
    setView(v as View);
    if (fs) setFilterStatus(fs);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0a0f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 32,
              height: 32,
              border: "2px solid rgba(255,255,255,0.1)",
              borderTopColor: "#3b82f6",
              borderRadius: "50%",
              animation: "spinLoader 0.7s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <div style={{ fontSize: 13, color: "#475569" }}>Loading your jobs…</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        color: "#e2e8f0",
        fontFamily: "var(--font-dm-sans), sans-serif",
        backgroundImage:
          "radial-gradient(ellipse at 20% 0%, #0d1f3c 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, #0d1a0d 0%, transparent 50%)",
      }}
    >
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
          position: "sticky",
          top: 0,
          background: "rgba(10,10,15,0.9)",
          backdropFilter: "blur(12px)",
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              fontFamily: "var(--font-dm-serif), serif",
              fontSize: 22,
              color: "#f1f5f9",
              letterSpacing: "-0.02em",
            }}
          >
            runway
          </span>
          <span style={{ fontSize: 12, color: "#334155", fontWeight: 500 }}>job search</span>
        </div>

        <nav style={{ display: "flex", gap: 4 }}>
          {(["dashboard", "list", "reminders"] as const).map((v) => (
            <button
              key={v}
              className={`nav-btn ${view === v ? "active" : ""}`}
              onClick={() => setView(v)}
            >
              {v === "dashboard" ? (
                "Overview"
              ) : v === "list" ? (
                "Applications"
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  Reminders
                  {reminders.length > 0 && (
                    <span
                      className="animate-pulse-custom"
                      style={{
                        background: "#ef4444",
                        color: "white",
                        borderRadius: "50%",
                        width: 16,
                        height: 16,
                        fontSize: 10,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {reminders.length}
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#334155" }}>{userEmail}</span>
          <button
            className="btn-ghost"
            style={{ padding: "6px 12px", fontSize: 12 }}
            onClick={handleSignOut}
          >
            Sign out
          </button>
          <button
            className="btn-ghost"
            style={{ padding: "8px 16px", fontSize: 13 }}
            onClick={() => setCsvModal(true)}
          >
            ↑ Import CSV
          </button>
          <button
            className="btn-primary"
            style={{ padding: "8px 20px", fontSize: 13 }}
            onClick={() => {
              setForm(EMPTY_FORM);
              setEditId(null);
              setErrors({});
              setView("add");
            }}
          >
            + Add Job
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 32px" }}>
        {view === "dashboard" && (
          <DashboardView
            jobs={jobs}
            stats={stats}
            reminders={reminders}
            onNavigate={handleNavigate}
            onOpenDetail={openDetail}
          />
        )}

        {view === "list" && (
          <ListView
            jobs={jobs}
            filteredJobs={filteredJobs}
            filterStatus={filterStatus}
            search={search}
            setFilterStatus={setFilterStatus}
            setSearch={setSearch}
            onOpenDetail={openDetail}
            onAddJob={() => {
              setForm(EMPTY_FORM);
              setEditId(null);
              setErrors({});
              setView("add");
            }}
            onBulkStatusChange={handleBulkStatusChange}
            onBulkDelete={handleBulkDelete}
            onBulkStale={handleBulkStale}
          />
        )}

        {view === "reminders" && (
          <RemindersView
            jobs={jobs}
            reminders={reminders}
            dismissedReminders={dismissedReminders}
            setDismissedReminders={setDismissedReminders}
            onOpenDetail={openDetail}
          />
        )}

        {view === "add" && (
          <AddEditForm
            form={form}
            setForm={setForm}
            editId={editId}
            errors={errors}
            scraping={scraping}
            scrapeError={scrapeError}
            scrapeSuccess={scrapeSuccess}
            onSubmit={handleSubmit}
            onCancel={() => {
              setView(editId ? "detail" : "list");
              setErrors({});
            }}
            onScrapeURL={handleScrapeURL}
          />
        )}

        {view === "detail" && selectedJob && (
          <DetailView
            job={jobs.find((j) => j.id === selectedJob.id) || selectedJob}
            onBack={() => setView("list")}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStale={toggleStale}
          />
        )}
      </main>

      {csvModal && (
        <CsvImportModal onImport={handleImportCsv} onClose={() => setCsvModal(false)} />
      )}

      {importDone && <div className="toast">✓ Jobs imported successfully!</div>}
    </div>
  );
}
