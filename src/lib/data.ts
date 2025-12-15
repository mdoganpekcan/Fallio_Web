import { supabaseAdmin } from "./supabase-admin";
import type {
  AISettings,
  AdminUser,
  AppConfig,
  CreditPackage,
  EarningRule,
  Fortune,
  FortuneStatus,
  FortuneTeller,
  NotificationItem,
  Settings,
  SubscriptionCycle,
  SubscriptionPlan,
  User,
} from "@/types";

export async function fetchAppConfig(): Promise<AppConfig> {
  const { data, error } = await supabaseAdmin
    .from("app_config")
    .select("*")
    .single();

  if (error) {
    console.error("Error fetching app config:", error);
    // Return default values if table doesn't exist or empty
    return {
      id: 1,
      ad_reward_amount: 1,
      welcome_credits: 500,
      daily_free_fortune_limit: 0,
      maintenance_mode: false,
      contact_email: "destek@fallio.com",
      fortune_costs: {
        coffee: 50,
        tarot: 150,
        palm: 150,
        dream: 5,
        love: 100,
        card: 100,
        color: 50
      },
    };
  }

  return data as AppConfig;
}

export async function fetchDashboardStats() {
  const [usersRes, fortunesRes, tellersRes] = await Promise.all([
    supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("fortunes")
      .select("id", { count: "exact", head: true }),
    supabaseAdmin
      .from("fortune_tellers")
      .select("id", { count: "exact", head: true }),
  ]);

  return {
    totalUsers: usersRes.count ?? 0,
    totalFortunes: fortunesRes.count ?? 0,
    activeTellers: tellersRes.count ?? 0,
    dailyRevenue: 0,
  };
}

export async function fetchRecentUsers(limit = 5): Promise<User[]> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as User[]) ?? [];
}

type FortuneViewRow = {
  id: string;
  user_name: string;
  type: string;
  teller_name: string;
  status: FortuneStatus;
  created_at: string;
};

export async function fetchRecentFortunes(limit = 6): Promise<Fortune[]> {
  const { data } = await supabaseAdmin
    .from("fortunes_view")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data) return [];

  return (data as FortuneViewRow[]).map((row) => ({
    id: row.id,
    user_name: row.user_name,
    type: row.type,
    teller_name: row.teller_name,
    status: row.status,
    submitted_at: row.created_at,
  }));
}

export async function fetchUsers({
  page = 1,
  pageSize = 10,
  search,
  status,
  zodiac,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  zodiac?: string;
}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabaseAdmin
    .from("users")
    .select("*, wallet:wallet(credits)", { count: "exact" });
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (status && status !== "all") query = query.eq("status", status);
  if (zodiac && zodiac !== "all") query = query.eq("zodiac_sign", zodiac);
  const { data, count } = await query.range(from, to);
  const mapped =
    data?.map((u) => ({
      ...(u as any),
      credits: (u as any).wallet?.credits ?? 0,
    })) ?? [];
  return { data: mapped as User[], count: count ?? 0 };
}

export async function fetchTellers() {
  const { data } = await supabaseAdmin.from("fortune_tellers").select("*");
  return (data as FortuneTeller[]) ?? [];
}

export async function fetchCreditPackages(): Promise<CreditPackage[]> {
  const { data } = await supabaseAdmin
    .from("credit_packages")
    .select("*")
    .order("created_at", { ascending: true });
  return (data as CreditPackage[]) ?? [];
}

export async function fetchEarningRules(): Promise<EarningRule[]> {
  const { data } = await supabaseAdmin
    .from("earning_rules")
    .select("*")
    .order("created_at", { ascending: true });
  return (data as EarningRule[]) ?? [];
}

export async function fetchSubscriptions(): Promise<SubscriptionPlan[]> {
  const { data } = await supabaseAdmin.from("subscriptions").select("*");
  if (!data) return [];
  return data.map((item: Record<string, string | number | string[]>) => ({
    id: item.id as string,
    name: item.plan_name as string,
    price: Number(item.price),
    cycle: item.cycle as SubscriptionCycle,
    perks: (item.perks as string[]) ?? [],
  }));
}

export async function fetchAdmins(): Promise<AdminUser[]> {
  const { data } = await supabaseAdmin.from("admin_users").select("*");
  return (data as AdminUser[]) ?? [];
}

export async function fetchNotifications(limit = 20): Promise<NotificationItem[]> {
  const { data } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as NotificationItem[]) ?? [];
}

export async function fetchSettings(): Promise<Settings> {
  const { data } = await supabaseAdmin.from("settings").select("*").limit(1).single();
  return (data as Settings) ?? {
    theme: "dark",
    ai_enabled: false,
    support_email: "",
    instagram: "",
    twitter: "",
    facebook: "",
  };
}

export async function fetchAISettings(): Promise<AISettings> {
  const { data } = await supabaseAdmin.from("ai_settings").select("*").limit(1).maybeSingle();
  return (
    (data as AISettings) ?? {
      id: 1,
      base_prompt: "",
      claude_api_key: null,
      claude_model: "",
      gemini_api_key: null,
      gemini_model: "",
      openai_api_key: null,
      openai_model: "",
      updated_at: null,
    }
  );
}

export async function fetchFortuneDetail(id: string) {
  const { data, error } = await supabaseAdmin
    .from("fortunes")
    .select(
      "*, users:users(id, full_name, email, avatar_url, zodiac_sign, job, relationship_status), fortune_tellers:fortune_tellers(id, name), fortune_images(url)"
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;

  type FortuneUser = {
    id: string;
    full_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
    zodiac_sign?: string | null;
    job?: string | null;
    relationship_status?: string | null;
  };

  type FortuneTellerView = {
    id: string;
    name?: string | null;
  };

  return {
    id: data.id as string,
    user_id: data.user_id as string,
    teller_id: data.teller_id as string | null,
    type: data.type as string,
    status: data.status as FortuneStatus,
    user_note: (data as { user_note?: string }).user_note ?? null,
    response: (data as { response?: string }).response ?? null,
    created_at: data.created_at as string,
    completed_at: (data as { completed_at?: string | null }).completed_at ?? null,
    user: (data as { users?: FortuneUser | null }).users,
    teller: (data as { fortune_tellers?: FortuneTellerView | null }).fortune_tellers,
    images: (data as { fortune_images?: { url: string }[] }).fortune_images ?? [],
  };
}
