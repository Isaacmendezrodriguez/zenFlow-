import { getSupabaseClient } from "../../../lib/supabase";
import { failure, success, type ServiceResult } from "../../../lib/service-result";
import type { Database } from "../../../types/database";

type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];

async function getUserId() {
  const { data, error } = await getSupabaseClient().auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Usuario no autenticado.");
  return data.user.id;
}

export async function listOrganizations(): Promise<ServiceResult<OrganizationRow[]>> {
  try {
    const { data, error } = await getSupabaseClient().from("organizations").select("*").is("deleted_at", null).order("created_at", { ascending: false });
    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function getOrganizationById(id: string): Promise<ServiceResult<OrganizationRow>> {
  try {
    const { data, error } = await getSupabaseClient().from("organizations").select("*").eq("id", id).single();
    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export async function createOrganization(input: { name: string; description?: string | null }): Promise<ServiceResult<OrganizationRow>> {
  try {
    const userId = await getUserId();
    const { data, error } = await getSupabaseClient()
      .from("organizations")
      .insert({ user_id: userId, name: input.name.trim(), description: input.description ?? null })
      .select("*")
      .single();
    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export async function updateOrganization(id: string, input: { name?: string; description?: string | null }): Promise<ServiceResult<OrganizationRow>> {
  try {
    const { data, error } = await getSupabaseClient().from("organizations").update(input).eq("id", id).select("*").single();
    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export async function deleteOrganization(id: string): Promise<ServiceResult<boolean>> {
  try {
    const { error } = await getSupabaseClient().from("organizations").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) return failure(error);
    return success(true);
  } catch (error) {
    return failure(error);
  }
}
