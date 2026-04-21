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

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "web-search-2025-03-05",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [
        {
          role: "user",
          content: `Fetch and read the full content of this job posting page: ${url}\n\nThen extract and return ONLY a JSON object (absolutely no markdown fences, no explanation, just raw JSON) with these exact fields:\n{\n  "company": "the company/employer name",\n  "title": "the exact job title",\n  "salary_range": "the salary or compensation range exactly as written on the page, empty string if not listed",\n  "contact": "recruiter or HR contact email/name if listed, else empty string",\n  "notes": "1-2 sentence summary of the role and key requirements"\n}\n\nReturn raw JSON only.`,
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
