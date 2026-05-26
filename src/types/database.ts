export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type TaskTypeDb = "simple" | "complex";
export type TaskStatusDb = "not_started" | "in_progress" | "done" | "review" | "blocked" | "waiting";
export type PriorityDb = "urgent" | "medium" | "low";
export type CalendarBlockTypeDb = "free" | "meeting" | "personal" | "breakfast" | "lunch" | "rest" | "focus" | "simple_task" | "complex_task" | "subtask" | "other";
export type CalendarBlockStatusDb = "scheduled" | "in_progress" | "completed" | "cancelled" | "not_completed" | "rescheduled";
export type LinkTypeDb = "figma" | "document" | "meeting" | "sharepoint" | "youtube" | "website" | "other";
export type ThemeDb = "light" | "dark";

type BaseRow = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string | null; email: string | null; created_at: string; updated_at: string };
        Insert: { id: string; full_name?: string | null; email?: string | null; created_at?: string; updated_at?: string };
        Update: { full_name?: string | null; email?: string | null; updated_at?: string };
        Relationships: [];
      };
      organizations: {
        Row: BaseRow & { name: string; description: string | null; deleted_at: string | null };
        Insert: Partial<Pick<BaseRow, "id" | "created_at" | "updated_at">> & { user_id: string; name: string; description?: string | null; deleted_at?: string | null };
        Update: Partial<Omit<Database["public"]["Tables"]["organizations"]["Row"], "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      projects: {
        Row: BaseRow & { organization_id: string; name: string; description: string | null; color: string; deleted_at: string | null };
        Insert: Partial<Pick<BaseRow, "id" | "created_at" | "updated_at">> & { user_id: string; organization_id: string; name: string; description?: string | null; color?: string; deleted_at?: string | null };
        Update: Partial<Omit<Database["public"]["Tables"]["projects"]["Row"], "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      project_tags: {
        Row: BaseRow & { project_id: string; name: string };
        Insert: Partial<Pick<BaseRow, "id" | "created_at" | "updated_at">> & { user_id: string; project_id: string; name: string };
        Update: Partial<Omit<Database["public"]["Tables"]["project_tags"]["Row"], "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      tasks: {
        Row: BaseRow & { organization_id: string | null; project_id: string | null; title: string; description: string; type: TaskTypeDb; status: TaskStatusDb; status_index: number; priority: PriorityDb; due_date: string | null; estimated_hours: number; real_hours: number; progress: number; notes: string | null; is_archived: boolean; archived_at: string | null; completed_at: string | null; deleted_at: string | null };
        Insert: Partial<Pick<BaseRow, "id" | "created_at" | "updated_at">> & { user_id: string; organization_id?: string | null; project_id?: string | null; title: string; description: string; type: TaskTypeDb; status?: TaskStatusDb; status_index?: number; priority?: PriorityDb; due_date?: string | null; estimated_hours?: number; real_hours?: number; progress?: number; notes?: string | null; is_archived?: boolean; archived_at?: string | null; completed_at?: string | null; deleted_at?: string | null };
        Update: Partial<Omit<Database["public"]["Tables"]["tasks"]["Row"], "id" | "user_id" | "created_at" | "type" | "project_id">>;
        Relationships: [];
      };
      subtasks: {
        Row: BaseRow & { task_id: string; title: string; description: string | null; priority: PriorityDb; status: "not_started" | "in_progress" | "done"; estimated_hours: number; real_hours: number; progress: number; completed_at: string | null; deleted_at: string | null };
        Insert: Partial<Pick<BaseRow, "id" | "created_at" | "updated_at">> & { user_id: string; task_id: string; title: string; description?: string | null; priority?: PriorityDb; status?: "not_started" | "in_progress" | "done"; estimated_hours: number; real_hours?: number; progress?: number; completed_at?: string | null; deleted_at?: string | null };
        Update: Partial<Omit<Database["public"]["Tables"]["subtasks"]["Row"], "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      task_links: {
        Row: BaseRow & { task_id: string; title: string; url: string; type: LinkTypeDb; description: string | null };
        Insert: Partial<Pick<BaseRow, "id" | "created_at" | "updated_at">> & { user_id: string; task_id: string; title: string; url: string; type: LinkTypeDb; description?: string | null };
        Update: Partial<Omit<Database["public"]["Tables"]["task_links"]["Row"], "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      calendar_blocks: {
        Row: BaseRow & { organization_id: string | null; project_id: string | null; task_id: string | null; subtask_id: string | null; title: string; description: string | null; block_type: CalendarBlockTypeDb; status: CalendarBlockStatusDb; start_at: string; end_at: string; duration_hours: number; real_hours_applied: number; affects_backlog: boolean; is_recurring: boolean; recurrence_rule: Json | null; completed_at: string | null; deleted_at: string | null; color: string };
        Insert: Partial<Pick<BaseRow, "id" | "created_at" | "updated_at">> & { user_id: string; organization_id?: string | null; project_id?: string | null; task_id?: string | null; subtask_id?: string | null; title: string; description?: string | null; block_type: CalendarBlockTypeDb; status?: CalendarBlockStatusDb; start_at: string; end_at: string; duration_hours: number; real_hours_applied?: number; affects_backlog?: boolean; is_recurring?: boolean; recurrence_rule?: Json | null; completed_at?: string | null; deleted_at?: string | null; color?: string };
        Update: Partial<Omit<Database["public"]["Tables"]["calendar_blocks"]["Row"], "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      activity_logs: {
        Row: BaseRow & { task_id: string | null; calendar_block_id: string | null; event_type: string; message: string };
        Insert: Partial<Pick<BaseRow, "id" | "created_at" | "updated_at">> & { user_id: string; task_id?: string | null; calendar_block_id?: string | null; event_type: string; message: string };
        Update: Partial<Omit<Database["public"]["Tables"]["activity_logs"]["Row"], "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      notifications: {
        Row: BaseRow & { title: string; message: string; type: "reminder" | "due" | "timer" | "summary"; is_read: boolean; related_task_id: string | null; related_calendar_block_id: string | null };
        Insert: Partial<Pick<BaseRow, "id" | "created_at" | "updated_at">> & { user_id: string; title: string; message: string; type: "reminder" | "due" | "timer" | "summary"; is_read?: boolean; related_task_id?: string | null; related_calendar_block_id?: string | null };
        Update: Partial<Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      user_settings: {
        Row: BaseRow & { theme: ThemeDb; primary_color: string; secondary_color: string; priority_colors: Json; enable_review_column: boolean; enable_blocked_column: boolean; enable_waiting_column: boolean; enable_internal_notifications: boolean; notify_before_block_minutes: number; daily_summary: boolean; timer_break_minutes: number; backlog_view: "compact" | "expanded" };
        Insert: Partial<Pick<BaseRow, "id" | "created_at" | "updated_at">> & { user_id: string; theme?: ThemeDb; primary_color?: string; secondary_color?: string; priority_colors?: Json; enable_review_column?: boolean; enable_blocked_column?: boolean; enable_waiting_column?: boolean; enable_internal_notifications?: boolean; notify_before_block_minutes?: number; daily_summary?: boolean; timer_break_minutes?: number; backlog_view?: "compact" | "expanded" };
        Update: Partial<Omit<Database["public"]["Tables"]["user_settings"]["Row"], "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      trash_items: {
        Row: BaseRow & { entity_type: "task" | "organization" | "project"; entity_id: string; name: string; entity_snapshot: Json; deleted_at: string; permanent_delete_at: string };
        Insert: Partial<Pick<BaseRow, "id" | "created_at" | "updated_at">> & { user_id: string; entity_type: "task" | "organization" | "project"; entity_id: string; name: string; entity_snapshot: Json; deleted_at?: string; permanent_delete_at?: string };
        Update: Partial<Omit<Database["public"]["Tables"]["trash_items"]["Row"], "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Regenerate later with:
// supabase gen types typescript --project-id PROJECT_ID > src/types/database.ts
