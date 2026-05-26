import { getSupabaseClient } from "../../../lib/supabase";
import { failure, success, type ServiceResult } from "../../../lib/service-result";
import type { Database } from "../../../types/database";

type TrashItemRow = Database["public"]["Tables"]["trash_items"]["Row"];

export async function listTrashItems(): Promise<ServiceResult<TrashItemRow[]>> {
  try {
    const { data, error } = await getSupabaseClient().from("trash_items").select("*").order("deleted_at", { ascending: false });
    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function restoreTrashItem(id: string): Promise<ServiceResult<boolean>> {
  // TODO: Restore entity snapshot according to entity_type once each module is migrated.
  try {
    const { error } = await getSupabaseClient().from("trash_items").delete().eq("id", id);
    if (error) return failure(error);
    return success(true);
  } catch (error) {
    return failure(error);
  }
}

export async function permanentlyDeleteTrashItem(id: string): Promise<ServiceResult<boolean>> {
  try {
    const { error } = await getSupabaseClient().from("trash_items").delete().eq("id", id);
    if (error) return failure(error);
    return success(true);
  } catch (error) {
    return failure(error);
  }
}

export async function emptyTrash(): Promise<ServiceResult<boolean>> {
  try {
    const { data: userData, error: userError } = await getSupabaseClient().auth.getUser();
    if (userError) return failure(userError);
    if (!userData.user) return failure("Usuario no autenticado.");
    const { error } = await getSupabaseClient().from("trash_items").delete().eq("user_id", userData.user.id);
    if (error) return failure(error);
    return success(true);
  } catch (error) {
    return failure(error);
  }
}
