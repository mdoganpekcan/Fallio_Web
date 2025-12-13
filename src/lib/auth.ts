import { createSupabaseServerClient } from "./supabase";
import { supabaseAdmin } from "./supabase-admin";
import type { AdminUser } from "@/types";

export async function getSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const user = await getSession();
  if (!user?.id) return null;
  const { data } = await supabaseAdmin
    .from("admin_users")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();
  return data as AdminUser | null;
}

export async function signOutServer() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}
