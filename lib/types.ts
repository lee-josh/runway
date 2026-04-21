export type Status =
  | "Bookmarked"
  | "Applied"
  | "Phone Screen"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Withdrawn";

export interface Job {
  id: string;
  user_id: string;
  company: string;
  title: string;
  status: Status;
  url: string;
  applied_date: string | null;
  contact: string;
  notes: string;
  round: string;
  stage: string;
  follow_up_date: string | null;
  follow_up_note: string;
  salary_range: string;
  is_stale: boolean;
  created_at: string;
  updated_at: string;
}

export type JobFormData = Omit<Job, "id" | "user_id" | "created_at" | "updated_at">;
