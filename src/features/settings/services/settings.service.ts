import { getSupabaseClient } from "../../../lib/supabase";
import { failure, success, type ServiceResult } from "../../../lib/service-result";
import type { Database } from "../../../types/database";

type UserSettingsRow = Database["public"]["Tables"]["user_settings"]["Row"];
type UserSettingsUpdate = Database["public"]["Tables"]["user_settings"]["Update"];

async function getUserId() {
  const { data, error } = await getSupabaseClient().auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Usuario no autenticado.");
  return data.user.id;
}

export async function getUserSettings(): Promise<ServiceResult<UserSettingsRow>> {
  try {
    const userId = await getUserId();
    const { data, error } = await getSupabaseClient().from("user_settings").select("*").eq("user_id", userId).single();
    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export async function updateUserSettings(input: UserSettingsUpdate): Promise<ServiceResult<UserSettingsRow>> {
  try {
    const userId = await getUserId();
    const { data, error } = await getSupabaseClient().from("user_settings").update(input).eq("user_id", userId).select("*").single();
    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}
