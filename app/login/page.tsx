"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        backgroundImage:
          "radial-gradient(ellipse at 20% 0%, #0d1f3c 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, #0d1a0d 0%, transparent 50%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span
            style={{
              fontFamily: "var(--font-dm-serif), serif",
              fontSize: 36,
              color: "#f1f5f9",
              letterSpacing: "-0.02em",
              display: "block",
            }}
          >
            runway
          </span>
          <span style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>job search tracker</span>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: 32,
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-dm-serif), serif",
              fontSize: 24,
              color: "#f1f5f9",
              marginBottom: 8,
            }}
          >
            Welcome back
          </h1>
          <p style={{ fontSize: 13, color: "#475569", marginBottom: 28 }}>
            Sign in to your account
          </p>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div className="label">Email</div>
              <input
                className="input-field"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <div className="label">Password</div>
              <input
                className="input-field"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  color: "#f87171",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            <button
              className="btn-primary"
              type="submit"
              disabled={loading}
              style={{ marginTop: 4, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p style={{ fontSize: 13, color: "#475569", textAlign: "center", marginTop: 24 }}>
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              style={{ color: "#60a5fa", textDecoration: "none", fontWeight: 500 }}
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
