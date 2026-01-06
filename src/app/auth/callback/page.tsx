'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuth = async () => {
      const code = searchParams.get('code');
      const next = searchParams.get('next') ?? '/';

      if (code) {
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (!error) {
          // Başarılı giriş sonrası mobil uygulamaya yönlendir
          window.location.href = 'fallio://auth/callback';
          setTimeout(() => {
             // Fallback redirects
             window.location.href = 'exp://127.0.0.1:19000/--/auth/callback';
          }, 3000);
        } else {
             alert('Auth Error: ' + error.message);
        }
      }
    };

    handleAuth();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0D0A1A] text-white p-4 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
      <h1 className="text-xl font-bold mb-2">Giriş Yapılıyor...</h1>
      <p className="text-gray-400 mb-6">Lütfen bekleyin, uygulamaya yönlendiriliyorsunuz.</p>
      
      <a 
        href="fallio://auth/callback"
        className="px-6 py-3 bg-purple-600 rounded-lg font-semibold hover:bg-purple-700 transition"
      >
        Uygulamayı Aç
      </a>
      <p className="mt-4 text-xs text-gray-500">Otomatik yönlendirme çalışmazsa butona tıklayın.</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#0D0A1A] text-white">Yükleniyor...</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
