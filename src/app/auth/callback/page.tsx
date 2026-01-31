'use client';

import { useEffect, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const error_description = searchParams.get('error_description');

      if (code) {
          // PKCE Flow: Code'u mobil uygulamaya ilet (Verifier mobilde)
          const params = new URLSearchParams();
          params.append('code', code);
          // Diğer parametreleri de ekle (state vs varsa)
          searchParams.forEach((value, key) => {
            if (key !== 'code') params.append(key, value);
          });

          const finalUrl = `fallio://auth/callback?${params.toString()}`;
          setRedirectUrl(finalUrl);
          
          // Otomatik yönlendirme
          window.location.href = finalUrl;
      } else if (error) {
          alert('Auth Error: ' + (error_description || error));
      }
    };
    handleAuth();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0D0A1A] text-white p-4 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
      <h1 className="text-xl font-bold mb-2">Giriş Yapılıyor...</h1>
      <p className="text-gray-400 mb-6">Lütfen bekleyin, uygulamaya yönlendiriliyorsunuz.</p>
      
      {redirectUrl && (
        <>
          <a 
            href={redirectUrl}
            className="px-6 py-3 bg-purple-600 rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Uygulamayı Aç
          </a>
          <p className="mt-4 text-xs text-gray-500">Otomatik yönlendirme çalışmazsa butona tıklayın.</p>
        </>
      )}
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
