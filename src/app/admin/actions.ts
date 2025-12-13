"use server";

import { createSupabaseServerClient } from "@/lib/supabase";
import { redirect } from "next/navigation";

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
