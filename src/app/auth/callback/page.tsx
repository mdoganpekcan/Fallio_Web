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
          searchParams.forEach((value, key) => {
            if (key !== 'code') params.append(key, value);
          });

          const finalUrl = `fallio://auth/callback?${params.toString()}`;
          setRedirectUrl(finalUrl);
          
          // Android Chrome otomatik yönlendirmeyi engelleyebilir. 
          // Bu yüzden kullanıcıdan tık beklemek en garantisidir.
          // Yine de deneriz:
          // window.location.href = finalUrl; 
      } else if (error) {
          setRedirectUrl(null);
          // Hata mesajını ekranda göster
      }
    };
    handleAuth();
  }, [searchParams, router]);

  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
     setDebugInfo(window.location.href);
  }, []);

  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0D0A1A] text-white p-4 text-center break-all">
      <div className="mb-6">
        <div className="text-4xl">🌟</div>
      </div>
      
      <h1 className="text-xl font-bold mb-2">Giriş Onayı</h1>
      
      {redirectUrl ? (
        <div className="space-y-4">
           <p className="text-green-400">Giriş kodu alındı! Devam etmek için butona basın.</p>
           
           <a 
            href={redirectUrl}
            className="block w-full px-8 py-4 bg-purple-600 rounded-xl font-bold text-lg hover:bg-purple-700 transition shadow-lg shadow-purple-900/50"
          >
            UYGULAMADA AÇ
          </a>
        </div>
      ) : error ? (
        <div className="text-red-500 bg-red-900/20 p-4 rounded-lg">
           <p className="font-bold">Hata Oluştu:</p>
           <p>{error_description || error}</p>
        </div>
      ) : (
         <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
            <p className="text-gray-400">Giriş bilgileri bekleniyor...</p>
            <div className="text-xs text-gray-600 bg-black/50 p-2 rounded">
                <p>DEBUG INFO:</p>
                <p>{debugInfo}</p>
                <p>Code: {searchParams.get('code') ? 'YES' : 'NO'}</p>
            </div>
         </div>
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
