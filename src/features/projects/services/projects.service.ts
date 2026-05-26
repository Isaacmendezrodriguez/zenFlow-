import { getSupabaseClient } from "../../../lib/supabase";
import { failure, success, type ServiceResult } from "../../../lib/service-result";
import type { Database } from "../../../types/database";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

async function getUserId() {
  const { data, error } = await getSupabaseClient().auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Usuario no autenticado.");
  return data.user.id;
}

export async function listProjects(): Promise<ServiceResult<ProjectRow[]>> {
  try {
    const { data, error } = await getSupabaseClient().from("projects").select("*").is("deleted_at", null).order("created_at", { ascending: false });
    if (error) return failure(error);
    return success(data ?? []);
  } catch (error) {
    return failure(error);
  }
}

export async function getProjectById(id: string): Promise<ServiceResult<ProjectRow>> {
  try {
    const { data, error } = await getSupabaseClient().from("projects").select("*").eq("id", id).single();
    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export async function createProject(input: { organizationId: string; name: string; description?: string | null; color?: string }): Promise<ServiceResult<ProjectRow>> {
  try {
    const userId = await getUserId();
    const { data, error } = await getSupabaseClient()
      .from("projects")
      .insert({ user_id: userId, organization_id: input.organizationId, name: input.name.trim(), description: input.description ?? null, color: input.color ?? "#10a37f" })
      .select("*")
      .single();
    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export async function updateProject(id: string, input: { name?: string; description?: string | null; color?: string }): Promise<ServiceResult<ProjectRow>> {
  try {
    const { data, error } = await getSupabaseClient().from("projects").update(input).eq("id", id).select("*").single();
    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export async function moveProjectToOrganization(id: string, organizationId: string): Promise<ServiceResult<ProjectRow>> {
  try {
    const { data, error } = await getSupabaseClient().from("projects").update({ organization_id: organizationId }).eq("id", id).select("*").single();
    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export async function deleteProject(id: string): Promise<ServiceResult<boolean>> {
  try {
    const { error } = await getSupabaseClient().from("projects").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) return failure(error);
    return success(true);
  } catch (error) {
    return failure(error);
  }
}
