import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  if (!req.nextUrl.pathname.startsWith("/admin")) {
    return res;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) =>
          res.cookies.set({ name, value, ...options })
        );
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const isLoginPage = req.nextUrl.pathname.startsWith("/admin/login");

  // Eğer rate-limit veya başka bir hata varsa, login sayfasına düşmesine izin verelim
  if (error?.status === 429) {
    return res;
  }

  if (!user && !isLoginPage) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/admin/login";
    redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  let adminUser: { id: string; role: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from("admin_users")
      .select("id, role")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    adminUser = data as { id: string; role: string } | null;
  }

  if (user && !adminUser) {
    // Admin kaydı yoksa session'ı temizleyip login'e döndür.
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/admin/login";
    redirectUrl.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(redirectUrl);
  }

  // Role-based access control
  if (user && adminUser) {
    const path = req.nextUrl.pathname;
    
    // Fortune Teller Restrictions
    if (adminUser.role === 'fortune_teller') {
      const allowedPaths = [
        '/admin/fortunes',
        '/admin/horoscopes',
        '/admin/login',
        '/admin/dashboard'
      ];
      
      // Check if path starts with any allowed path
      const isAllowed = allowedPaths.some(p => path.startsWith(p));
      
      if (!isAllowed && !path.includes('.')) { 
         const redirectUrl = req.nextUrl.clone();
         redirectUrl.pathname = "/admin/fortunes";
         return NextResponse.redirect(redirectUrl);
      }
    }

    if (isLoginPage) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/admin/dashboard";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
