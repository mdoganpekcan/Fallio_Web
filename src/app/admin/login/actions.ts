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
  console.log("--- Login Action: Trying to sign in ---", email);

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("❌ Login Hatası:", error.message, error.status);
    return { error: error.message };
  }

  console.log("✅ Giriş başarılı, yönlendiriliyor...");
  redirect("/admin/dashboard");
}
