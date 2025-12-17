import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function VerifiedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center">
          <CheckCircle className="h-24 w-24 text-green-500" />
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          E-posta Adresiniz Doğrulandı!
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Hesabınız başarıyla aktif edildi. Artık mobil uygulamaya dönüp giriş yapabilirsiniz.
        </p>
        <div className="mt-8">
          <p className="text-gray-500 text-xs mb-4">
            Bu pencereyi kapatabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
