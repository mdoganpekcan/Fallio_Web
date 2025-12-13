export type UserStatus = "active" | "banned";
export type FortuneStatus = "pending" | "completed";
export type HoroscopeScope = "daily" | "weekly" | "monthly";
export type AdminRole = "admin" | "moderator" | "fortune_teller";
export type AIProvider = "claude" | "gemini" | "chatgpt";

export interface User {
  id: string;
  email: string;
  full_name: string;
  zodiac_sign?: string | null;
  avatar_url?: string | null;
  credits: number;
  diamonds: number;
  status: UserStatus;
  city?: string | null;
  created_at?: string | null;
}

export interface FortuneTeller {
  id: string;
  name: string;
  avatar_url?: string | null;
  expertise: string[];
  price: number;
  rating: number;
  is_online: boolean;
  is_active?: boolean;
  is_ai: boolean;
  ai_provider?: AIProvider | null;
  ai_model?: string | null;
}

export interface Fortune {
  id: string;
  user_name: string;
  type: string;
  teller_name: string;
  status: FortuneStatus;
  submitted_at: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  active: boolean;
}

export interface EarningRule {
  id: string;
  title: string;
  diamonds: number;
  active: boolean;
  type: "ad" | "daily" | "invite";
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  cycle: SubscriptionCycle;
  perks: string[];
}

export type SubscriptionCycle = "monthly" | "yearly";

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  display_name?: string | null;
  avatar_url?: string | null;
}

export interface NotificationItem {
  id: string;
  title: string;
  segment: string;
  status: "sent" | "error" | "queued";
  created_at?: string;
}

export interface Settings {
  theme: "light" | "dark";
  ai_enabled: boolean;
  support_email: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
}

export interface AISettings {
  id: number;
  base_prompt: string;
  claude_api_key?: string | null;
  claude_model?: string | null;
  gemini_api_key?: string | null;
  gemini_model?: string | null;
  openai_api_key?: string | null;
  openai_model?: string | null;
  updated_at?: string | null;
}
