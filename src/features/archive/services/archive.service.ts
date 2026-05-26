import { getSupabaseClient } from "../../../lib/supabase";
import { failure, success, type ServiceResult } from "../../../lib/service-result";
import type { Database } from "../../../types/database";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

export async function listArchivedTasks(): Promise<ServiceResult<TaskRow[]>> {
  try {
    const { data, error } = await getSupabaseClient().from("tasks").select("*").eq("is_archived", true).is("deleted_at", null).order("archived_at", { ascending: false });
    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}
