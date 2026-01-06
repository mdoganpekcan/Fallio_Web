"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function updatePersona(formData: FormData) {
  const id = formData.get("id") as string;
  const persona = formData.get("persona") as string;

  if (!id || !persona) {
    return { success: false, message: "Geçersiz veri." };
  }

  try {
    const { error } = await supabaseAdmin
      .from("prompt_personas")
      .update({ persona, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/admin/prompts");
    return { success: true, message: "Prompt başarıyla güncellendi." };
  } catch (error: any) {
    console.error("Error updating persona:", error);
    return { success: false, message: error.message };
  }
}
