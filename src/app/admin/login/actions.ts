"use server";

import { createSupabaseServerClient } from "@/lib/supabase";
import { redirect } from "next/navigation";

export async function loginAction(
  _prevState: { error?: string | null },
  formData: FormData
) {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/admin/dashboard");
}
