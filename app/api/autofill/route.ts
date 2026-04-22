import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await request.json();
  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Autofill not configured" }, { status: 503 });
  }

  // Use Jina Reader to render the page (handles JS-heavy job boards)
  const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
    headers: { Accept: "text/plain" },
  });
  if (!jinaRes.ok) {
    return NextResponse.json({ error: "Could not fetch job page" }, { status: 502 });
  }
  const pageText = await jinaRes.text();

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Here is the content of a job posting page:\n\n${pageText.slice(0, 12000)}\n\nExtract and return ONLY a JSON object (no markdown fences, no explanation, raw JSON only) with these exact fields:\n{\n  "company": "the company/employer name",\n  "title": "the exact job title",\n  "salary_range": "the salary or compensation range exactly as written, empty string if not listed",\n  "contact": "recruiter or HR contact email/name if listed, else empty string",\n  "notes": "1-2 sentence summary of the role and key requirements"\n}\n\nReturn raw JSON only.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    return NextResponse.json(
      { error: (err as { error?: { message?: string } }).error?.message || "API error" },
      { status: 502 }
    );
  }

  const data = await response.json();
  const text = (data.content as Array<{ type: string; text?: string }>)
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  const clean = text.replace(/```json|```/g, "").trim();
  const jsonMatch = clean.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "Could not extract job details" }, { status: 422 });
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return NextResponse.json(parsed);
}
