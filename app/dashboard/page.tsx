import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import JobTracker from "@/components/JobTracker";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <JobTracker userId={user.id} userEmail={user.email!} />;
}
