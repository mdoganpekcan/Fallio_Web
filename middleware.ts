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
    const redirectRes = NextResponse.redirect(redirectUrl);
    // Copy cookies from res to redirectRes to ensure session updates are propagated
    res.cookies.getAll().forEach(cookie => {
      redirectRes.cookies.set(cookie);
    });
    return redirectRes;
  }

  let adminUser: { id: string; role: string } | null = null;
  if (user) {
    console.log("--- Middleware: Checking Admin Role via JWT ---");
    // Get role from JWT app_metadata injected by our PostgreSQL trigger
    const role = user.app_metadata?.role;
    
    if (role) {
      adminUser = { id: user.id, role: role as string };
      console.log("Admin User Role from JWT:", adminUser.role);
    } else {
      console.log("No admin role found in JWT.");
    }
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
    const redirectRes = NextResponse.redirect(redirectUrl);
    // Copy cookies (which now include the signOut/clear cookie directives)
    res.cookies.getAll().forEach(cookie => {
      redirectRes.cookies.set(cookie);
    });
    return redirectRes;
  }

  // Role-based access control
  if (user && adminUser) {
    const path = req.nextUrl.pathname;

    // 1. ADMIN - Tam Erişim
    if (adminUser.role === 'admin') {
      // Admin her yere girebilir, login sayfasındaysa dashboard'a yönlendir
      if (isLoginPage) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = "/admin/dashboard";
        const redirectRes = NextResponse.redirect(redirectUrl);
        res.cookies.getAll().forEach(cookie => redirectRes.cookies.set(cookie));
        return redirectRes;
      }
      return res;
    }

    // 2. FORTUNE TELLER - Kısıtlı Erişim
    if (adminUser.role === 'fortune_teller') {
      const allowedPaths = [
        '/admin/fortunes',
        '/admin/horoscopes',
        '/admin/login',
        '/admin/dashboard',
        '/admin/profile' // Profil düzenleme ihtiyacı olabilir
      ];

      const isAllowed = allowedPaths.some(p => path.startsWith(p));

      if (!isAllowed && !path.includes('.')) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = "/admin/fortunes";
        const redirectRes = NextResponse.redirect(redirectUrl);
        res.cookies.getAll().forEach(cookie => redirectRes.cookies.set(cookie));
        return redirectRes;
      }

      if (isLoginPage) {
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = "/admin/fortunes"; // Falcıları direkt iş listesine atalım
        const redirectRes = NextResponse.redirect(redirectUrl);
        res.cookies.getAll().forEach(cookie => redirectRes.cookies.set(cookie));
        return redirectRes;
      }

      return res;
    }

    // 3. Diğer Roller (Yetkisiz)
    try { await supabase.auth.signOut(); } catch (e) { }

    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/admin/login";
    redirectUrl.searchParams.set("error", "unauthorized_role");
    const redirectRes = NextResponse.redirect(redirectUrl);
    res.cookies.getAll().forEach(cookie => redirectRes.cookies.set(cookie));
    return redirectRes;
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
