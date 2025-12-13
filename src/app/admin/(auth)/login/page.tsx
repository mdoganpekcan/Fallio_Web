import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_20%_20%,rgba(124,92,255,0.18),transparent_25%),radial-gradient(circle_at_80%_0,rgba(109,211,255,0.12),transparent_30%),var(--background)] px-4">
      <LoginForm />
    </div>
  );
}
