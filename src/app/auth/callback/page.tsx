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
        }
      }
    };

    handleAuth();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0D0A1A] text-white p-4 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
      <h1 className="text-xl font-bold mb-2">Giriş Yapılıyor...</h1>
      <p className="text-gray-400">Lütfen bekleyin, uygulamaya yönlendiriliyorsunuz.</p>
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
