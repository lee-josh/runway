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

  const { url: rawUrl } = await request.json();
  if (!rawUrl) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  // Strip post-apply suffixes that lead to confirmation/thank-you pages
  let url = rawUrl.replace(/\/(confirmation|application|apply|applied|success|thank[-_]?you|thanks)(\/.*)?(\?.*)?$/i, "");

  // Rewrite embedded ATS URLs to their canonical hosted job board URLs.
  // Companies often embed ATS widgets on their own career pages via a query param;
  // Jina sees the company shell (no job content) unless we redirect to the real listing.
  try {
    const parsed = new URL(url);
    const companySlug = parsed.hostname.replace(/^www\./, "").split(".")[0];

    // Greenhouse: company.com/careers?gh_jid=ID → job-boards.greenhouse.io/COMPANY/jobs/ID
    const ghJid = parsed.searchParams.get("gh_jid");
    if (ghJid) {
      url = `https://job-boards.greenhouse.io/${companySlug}/jobs/${ghJid}`;
    }

    // Ashby: company.com/careers?ashby_jid=UUID → jobs.ashbyhq.com/COMPANY/UUID
    const ashbyJid = parsed.searchParams.get("ashby_jid");
    if (ashbyJid) {
      url = `https://jobs.ashbyhq.com/${companySlug}/${ashbyJid}`;
    }

    // Lever embedded: company.com/jobs?lever-job-id=UUID → jobs.lever.co/COMPANY/UUID
    const leverJid = parsed.searchParams.get("lever-job-id");
    if (leverJid) {
      url = `https://jobs.lever.co/${companySlug}/${leverJid}`;
    }
  } catch {
    // invalid URL — leave as-is and let the fetch fail naturally
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Autofill not configured" }, { status: 503 });
  }

  // Detect client location for location-based salary matching
  let salaryLocationHint = "If multiple ranges are listed by region, return the US range or the first one listed.";
  try {
    const clientIp = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0].trim();
    if (clientIp && clientIp !== "127.0.0.1" && clientIp !== "::1") {
      const geoRes = await fetch(`https://ipapi.co/${clientIp}/json/`, {
        headers: { "User-Agent": "runway-job-tracker/1.0" },
      });
      if (geoRes.ok) {
        const geo = await geoRes.json();
        if (geo.country_name && !geo.error) {
          const location = geo.region ? `${geo.region}, ${geo.country_name}` : geo.country_name;
          salaryLocationHint = `The user is located in ${location}. If salary ranges are listed by region or location, return the range that applies to them specifically. For example, if California and non-California US ranges are both listed and the user is in California, return the California range.`;
        }
      }
    }
  } catch {
    // geolocation failed — fall back to default hint
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
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Here is the content of a job posting page:\n\n${pageText.slice(0, 30000)}\n\nExtract and return ONLY a JSON object (no markdown fences, no explanation, raw JSON only) with these exact fields:\n{\n  "company": "the company/employer name",\n  "title": "the exact job title",\n  "salary_range": "the salary or compensation range. Look for any dollar or currency amounts described as salary, pay, or compensation — they may appear in a table, a paragraph, or inline text. Simplify verbose formats like '$143,000 [minimum salary in lowest market] to $205,000 [maximum]' into '$143,000 – $205,000'. ${salaryLocationHint} Empty string only if no salary figures appear anywhere on the page.",\n  "contact": "recruiter or HR contact email/name if listed, else empty string",\n  "notes": "1-2 sentence summary of the role and key requirements"\n}\n\nReturn raw JSON only.`,
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
