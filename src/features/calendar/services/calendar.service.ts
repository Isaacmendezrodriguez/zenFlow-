import { getSupabaseClient } from "../../../lib/supabase";
import { failure, success, type ServiceResult } from "../../../lib/service-result";
import type { Database } from "../../../types/database";

type CalendarBlockRow = Database["public"]["Tables"]["calendar_blocks"]["Row"];
type CalendarBlockInsert = Database["public"]["Tables"]["calendar_blocks"]["Insert"];
type CalendarBlockUpdate = Database["public"]["Tables"]["calendar_blocks"]["Update"];

export async function listCalendarBlocks(): Promise<ServiceResult<CalendarBlockRow[]>> {
  try {
    const { data, error } = await getSupabaseClient().from("calendar_blocks").select("*").is("deleted_at", null).order("start_at", { ascending: true });
    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function createCalendarBlock(input: CalendarBlockInsert): Promise<ServiceResult<CalendarBlockRow>> {
  try {
    const { data, error } = await getSupabaseClient().from("calendar_blocks").insert(input).select("*").single();
    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export async function updateCalendarBlock(id: string, input: CalendarBlockUpdate): Promise<ServiceResult<CalendarBlockRow>> {
  try {
    const { data, error } = await getSupabaseClient().from("calendar_blocks").update(input).eq("id", id).select("*").single();
    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export function completeCalendarBlock(id: string, realHoursApplied: number) {
  return updateCalendarBlock(id, { status: "completed", completed_at: new Date().toISOString(), real_hours_applied: realHoursApplied });
}

export function deleteCalendarBlock(id: string) {
  return updateCalendarBlock(id, { deleted_at: new Date().toISOString() });
}
