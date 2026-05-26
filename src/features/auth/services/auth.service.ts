import { getSupabaseClient, isSupabaseConfigured, supabase } from "../../../lib/supabase";
import { failure, success, type ServiceResult } from "../../../lib/service-result";

export async function signIn(email: string, password: string): Promise<ServiceResult<unknown>> {
  try {
    const { data, error } = await getSupabaseClient().auth.signInWithPassword({ email, password });
    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export async function signUp(email: string, password: string, fullName?: string): Promise<ServiceResult<unknown>> {
  try {
    const { data, error } = await getSupabaseClient().auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    if (error) return failure(error);
    return success(data);
  } catch (error) {
    return failure(error);
  }
}

export async function signOut(): Promise<ServiceResult<boolean>> {
  try {
    if (!isSupabaseConfigured || !supabase) return success(true);
    const { error } = await supabase.auth.signOut();
    if (error) return failure(error);
    return success(true);
  } catch (error) {
    return failure(error);
  }
}

export async function getSession(): Promise<ServiceResult<unknown>> {
  try {
    if (!isSupabaseConfigured || !supabase) return success(null);
    const { data, error } = await supabase.auth.getSession();
    if (error) return failure(error);
    return success(data.session);
  } catch (error) {
    return failure(error);
  }
}

export async function getCurrentUser(): Promise<ServiceResult<unknown>> {
  try {
    if (!isSupabaseConfigured || !supabase) return success(null);
    const { data, error } = await supabase.auth.getUser();
    if (error) return failure(error);
    return success(data.user);
  } catch (error) {
    return failure(error);
  }
}
