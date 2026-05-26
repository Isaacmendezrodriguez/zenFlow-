import { getSupabaseClient } from "../../../lib/supabase";
import { failure, success, type ServiceResult } from "../../../lib/service-result";
import type { Database } from "../../../types/database";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

async function getUserId() {
  const { data, error } = await getSupabaseClient().auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Usuario no autenticado.");
  return data.user.id;
}

export async function listTasks(): Promise<ServiceResult<TaskRow[]>> {
  try {
    const { data, error } = await getSupabaseClient().from("tasks").select("*").is("deleted_at", null).order("created_at", { ascending: false });
    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function getTaskById(id: string): Promise<ServiceResult<TaskRow>> {
  try {
    const { data, error } = await getSupabaseClient().from("tasks").select("*").eq("id", id).single();
    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export async function createTask(input: TaskInsert): Promise<ServiceResult<TaskRow>> {
  try {
    const { data, error } = await getSupabaseClient().from("tasks").insert(input).select("*").single();
    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export async function createTaskWithSubtasks(input: {
  title: string;
  description: string;
  type: "simple" | "complex";
  organizationId?: string;
  projectId?: string;
  dueDate?: string;
  priority: "urgent" | "medium" | "low";
  subtasks?: Array<{ title: string; description?: string; estimatedHours: number; priority: "urgent" | "medium" | "low" }>;
}): Promise<ServiceResult<TaskRow>> {
  try {
    const userId = await getUserId();
    const estimatedHours = input.type === "complex" ? (input.subtasks ?? []).reduce((total, subtask) => total + subtask.estimatedHours, 0) : 0;
    const { data, error } = await getSupabaseClient()
      .from("tasks")
      .insert({
        user_id: userId,
        organization_id: input.organizationId ?? null,
        project_id: input.projectId ?? null,
        title: input.title.trim(),
        description: input.description.trim(),
        type: input.type,
        status: "not_started",
        priority: input.priority,
        due_date: input.dueDate ?? null,
        estimated_hours: estimatedHours,
        real_hours: 0,
        progress: 0,
      })
      .select("*")
      .single();
    if (error) return failure(error);

    if (input.type === "complex" && input.subtasks?.length) {
      const { error: subtaskError } = await getSupabaseClient().from("subtasks").insert(input.subtasks.map((subtask) => ({
        user_id: userId,
        task_id: data.id,
        title: subtask.title,
        description: subtask.description ?? null,
        priority: subtask.priority,
        estimated_hours: subtask.estimatedHours,
        real_hours: 0,
        progress: 0,
      })));
      if (subtaskError) return failure(subtaskError);
    }

    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export async function updateTask(id: string, input: TaskUpdate): Promise<ServiceResult<TaskRow>> {
  try {
    const { data, error } = await getSupabaseClient().from("tasks").update(input).eq("id", id).select("*").single();
    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export function archiveTask(id: string) {
  return updateTask(id, { is_archived: true, archived_at: new Date().toISOString() });
}

export function softDeleteTask(id: string) {
  return updateTask(id, { deleted_at: new Date().toISOString() });
}
