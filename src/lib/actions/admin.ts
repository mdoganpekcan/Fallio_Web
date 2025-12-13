"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "../supabase-admin";
import { sendPushNotification } from "../notifications";

export async function upsertTeller(formData: FormData) {
  const id = (formData.get("id") as string) || null;
  const name = formData.get("name") as string;
  const avatar_url = (formData.get("avatar_url") as string) || null;
  const expertise = ((formData.get("expertise") as string) || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const price = Number(formData.get("price") || 0);
  const rating = Number(formData.get("rating") || 5);
  const is_online = formData.get("is_online") === "on" || formData.get("is_online") === "true";
  const is_active = formData.get("is_active") === "on" || formData.get("is_active") === "true";
  const is_ai = formData.get("is_ai") === "on" || formData.get("is_ai") === "true";
  const ai_provider = is_ai ? ((formData.get("ai_provider") as string) || null) : null;
  const ai_model = is_ai ? ((formData.get("ai_model") as string) || null) : null;
  const bio = (formData.get("bio") as string) || null;

  const payload = {
    name,
    avatar_url,
    expertise,
    price,
    rating,
    is_online,
    is_active,
    is_ai,
    ai_provider,
    ai_model,
    bio,
  };

  try {
    const { error } = id
      ? await supabaseAdmin.from("fortune_tellers").update(payload).eq("id", id)
      : await supabaseAdmin.from("fortune_tellers").insert(payload);

    if (error) {
      console.error("Supabase Error:", error);
      return { error: error.message };
    }
  } catch (e: any) {
    console.error("Server Action Error:", e);
    return { error: e.message || "Bir hata oluştu" };
  }

  revalidatePath("/admin/tellers");
  return { success: true };
}

export async function deleteTeller(formData: FormData) {
  const id = formData.get("id") as string;
  const { error } = await supabaseAdmin.from("fortune_tellers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/tellers");
  return { success: true };
}

export async function toggleTellerStatus(formData: FormData) {
  const id = formData.get("id") as string;
  const isActive = formData.get("is_active") === "true";
  
  const { error } = await supabaseAdmin
    .from("fortune_tellers")
    .update({ is_active: isActive })
    .eq("id", id);
    
  if (error) return { error: error.message };
  revalidatePath("/admin/tellers");
  return { success: true };
}

export async function upsertCreditPackage(formData: FormData) {
  const id = formData.get("id") as string | null;
  const name = formData.get("name") as string;
  const credits = Number(formData.get("credits"));
  const price = Number(formData.get("price"));
  const active = formData.get("active") === "on" || formData.get("active") === "true";

  const payload = { name, credits, price, active };
  const { error } = id
    ? await supabaseAdmin.from("credit_packages").update(payload).eq("id", id)
    : await supabaseAdmin.from("credit_packages").insert(payload);

  if (error) return { error: error.message };
  revalidatePath("/admin/credits");
  return { success: true };
}

export async function deleteCreditPackage(formData: FormData) {
  const id = formData.get("id") as string;
  const { error } = await supabaseAdmin.from("credit_packages").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/credits");
  return { success: true };
}

export async function updateUserStatus(formData: FormData) {
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  const { error } = await supabaseAdmin
    .from("users")
    .update({ status })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { success: true };
}

export async function adjustUserBalance(formData: FormData) {
  const id = formData.get("id") as string;
  const credits = Number(formData.get("credits"));
  const diamonds = Number(formData.get("diamonds"));
  const { error } = await supabaseAdmin
    .from("wallet")
    .upsert({ user_id: id, credits, diamonds }, { onConflict: "user_id" });
  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { success: true };
}

export async function upsertEarningRule(formData: FormData) {
  const id = formData.get("id") as string | null;
  const title = formData.get("title") as string;
  const diamonds = Number(formData.get("diamonds"));
  const type = formData.get("type") as string;
  const active = formData.get("active") === "on" || formData.get("active") === "true";

  const payload = { title, diamonds, type, active };
  const { error } = id
    ? await supabaseAdmin.from("earning_rules").update(payload).eq("id", id)
    : await supabaseAdmin.from("earning_rules").insert(payload);
  if (error) return { error: error.message };
  revalidatePath("/admin/credits");
  return { success: true };
}

export async function upsertSubscription(formData: FormData) {
  const id = formData.get("id") as string | null;
  const plan_name = formData.get("name") as string;
  const price = Number(formData.get("price"));
  const cycle = formData.get("cycle") as string;
  const perks = (formData.get("perks") as string)
    ?.split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const payload = { plan_name, price, cycle, perks };
  const { error } = id
    ? await supabaseAdmin.from("subscriptions").update(payload).eq("id", id)
    : await supabaseAdmin.from("subscriptions").insert(payload);
  if (error) return { error: error.message };
  revalidatePath("/admin/credits");
  return { success: true };
}

export async function saveHoroscope(formData: FormData) {
  const sign = formData.get("sign") as string;
  const scope = formData.get("scope") as string;
  const love = formData.get("love") as string;
  const money = formData.get("money") as string;
  const health = formData.get("health") as string;
  const general = formData.get("general") as string;

  const payload = { sign, scope, love, money, health, general, updated_at: new Date().toISOString() };

  const { error } = await supabaseAdmin
    .from("horoscopes")
    .upsert(payload, { onConflict: "sign,scope" });
  if (error) return { error: error.message };
  revalidatePath("/admin/horoscopes");
  return { success: true };
}

export async function sendNotification(formData: FormData) {
  const title = formData.get("title") as string;
  const message = formData.get("message") as string;
  const segment = formData.get("segment") as string;
  const user_id = formData.get("user_id") as string | null;
  const { error } = await supabaseAdmin.from("notifications").insert({
    title,
    message,
    segment,
    user_id: user_id || null,
    status: "queued",
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/notifications");
  return { success: true };
}

export async function upsertSetting(formData: FormData) {
  const theme = formData.get("theme") as string;
  const ai_enabled = formData.get("ai_enabled") === "true" || formData.get("ai_enabled") === "on";
  const support_email = formData.get("support_email") as string;
  const instagram = formData.get("instagram") as string;
  const twitter = formData.get("twitter") as string;
  const facebook = formData.get("facebook") as string;
  const { error } = await supabaseAdmin.from("settings").upsert(
    {
      theme,
      ai_enabled,
      support_email,
      instagram,
      twitter,
      facebook,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (error) return { error: error.message };
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function upsertAdminUser(formData: FormData) {
  const id = formData.get("id") as string | null;
  const email = formData.get("email") as string;
  const role = formData.get("role") as string;
  const display_name = formData.get("display_name") as string;
  const password = formData.get("password") as string | null;

  // 1. Ensure user exists in Auth
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  let authUserId = users?.find((u) => u.email === email)?.id;

  if (!authUserId) {
    if (!password) {
      return { error: "Yeni kullanıcı için şifre gereklidir." };
    }
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: display_name },
    });
    if (createError) return { error: createError.message };
    authUserId = newUser.user.id;
  } else if (password && password.trim().length > 0) {
    // Update password if provided
    await supabaseAdmin.auth.admin.updateUserById(authUserId, { password });
  }

  // 2. Upsert into admin_users
  const payload = { auth_user_id: authUserId, email, role, display_name };
  
  // If we have an ID (admin_users.id), update by that. 
  // Otherwise, we might want to upsert by auth_user_id or email to avoid duplicates.
  // But the table likely has a unique constraint on auth_user_id or email.
  
  let error;
  if (id) {
     const { error: updateError } = await supabaseAdmin.from("admin_users").update(payload).eq("id", id);
     error = updateError;
  } else {
     // Check if admin record exists for this auth user
     const { data: existing } = await supabaseAdmin.from("admin_users").select("id").eq("auth_user_id", authUserId).maybeSingle();
     if (existing) {
        const { error: updateError } = await supabaseAdmin.from("admin_users").update(payload).eq("id", existing.id);
        error = updateError;
     } else {
        const { error: insertError } = await supabaseAdmin.from("admin_users").insert(payload);
        error = insertError;
     }
  }

  if (error) return { error: error.message };
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function upsertAISettings(formData: FormData) {
  const base_prompt = (formData.get("base_prompt") as string) || "";
  const claude_api_key = (formData.get("claude_api_key") as string) || null;
  const claude_model = (formData.get("claude_model") as string) || null;
  const gemini_api_key = (formData.get("gemini_api_key") as string) || null;
  const gemini_model = (formData.get("gemini_model") as string) || null;
  const openai_api_key = (formData.get("openai_api_key") as string) || null;
  const openai_model = (formData.get("openai_model") as string) || null;

  const { error } = await supabaseAdmin
    .from("ai_settings")
    .upsert(
      {
        id: 1,
        base_prompt,
        claude_api_key,
        claude_model,
        gemini_api_key,
        gemini_model,
        openai_api_key,
        openai_model,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  if (error) return { error: error.message };
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function resolveFortune(formData: FormData) {
  const fortuneId = formData.get("id") as string;
  const response = formData.get("response") as string;
  const status = formData.get("status") as string;
  const teller_id = formData.get("teller_id") as string | null;

  const { error } = await supabaseAdmin
    .from("fortunes")
    .update({
      response,
      status,
      completed_at: status === "completed" ? new Date().toISOString() : null,
      teller_id: teller_id || null,
    })
    .eq("id", fortuneId);

  if (error) return { error: error.message };

  const userId = formData.get("user_id") as string;

  // Optional notification to user
  await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    title: "Falınız hazır",
    message: "Fal talebiniz sonuçlandı.",
    segment: "single",
    status: "queued",
  });

  // Send Push Notification
  if (status === "completed") {
    await sendPushNotification(
      userId,
      "Falınız Hazır! 🔮",
      "Fal yorumunuz tamamlandı. Hemen okumak için tıklayın.",
      { fortuneId }
    );
  }

  revalidatePath("/admin/fortunes");
  revalidatePath(`/admin/fortunes/${fortuneId}`);
  return { success: true };
}
