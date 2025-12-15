"use server";

import { generateHoroscopes } from "@/lib/services/horoscope-generator";
import { revalidatePath } from "next/cache";

export async function triggerHoroscopeGeneration(type: string) {
  try {
    console.log(`[Manual Trigger] Generating horoscopes for type: ${type}`);
    const results = await generateHoroscopes([type]);
    
    revalidatePath("/admin/horoscopes");
    
    const errors = results.filter(r => r.status === "error");
    if (errors.length > 0) {
      return { 
        success: false, 
        message: `${results.length} işlemden ${errors.length} tanesi hatalı.`,
        details: errors
      };
    }

    return { success: true, message: "Burç yorumları başarıyla oluşturuldu." };
  } catch (error: any) {
    console.error("Manual generation failed:", error);
    return { success: false, message: error.message };
  }
}
