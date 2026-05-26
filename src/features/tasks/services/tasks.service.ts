import { getSupabaseClient } from "../../../lib/supabase";
import { failure, success, type ServiceResult } from "../../../lib/service-result";
import type { Database } from "../../../types/database";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

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
