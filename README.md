# 🛡️ Fallio - Admin Paneli

Fallio mobil uygulamasının yönetim, içerik girişi ve kullanıcı takibi işlemlerinin yapıldığı web tabanlı yönetim panelidir.

Bu proje **Next.js 14 (App Router)** kullanılarak geliştirilmiştir ve **Vercel** üzerinde barındırılmaktadır.

## 🚀 Özellikler

- **Dashboard:** Günlük fal sayıları, aktif kullanıcılar ve gelir istatistikleri.
- **Fal Yönetimi:** Gelen fal isteklerini görüntüleme, yanıtlama veya yapay zekaya yönlendirme.
- **Kullanıcı Yönetimi:** Kullanıcı listesi, detayları, yasaklama ve silme işlemleri.
- **Yorumcu Yönetimi:** Yeni falcı profilleri (AI veya İnsan) oluşturma ve düzenleme.
- **İçerik Yönetimi:** Günlük burç yorumları ve blog içerikleri girişi.
- **Cron Jobs:** Otomatik fal işleme ve zamanlanmış görevler.

## 🛠 Teknoloji Yığını

- **Framework:** [Next.js 14](https://nextjs.org/)
- **Dil:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Backend & Auth:** [Supabase](https://supabase.com/) (Server Actions & Client Component)
- **Deployment:** [Vercel](https://vercel.com/)

## 📂 Proje Yapısı

```
falio-admin/
├── src/
│   ├── app/                 # Next.js App Router sayfaları
│   │   ├── admin/           # Yönetim paneli sayfaları (Dashboard, Users, Fortunes)
│   │   ├── api/             # API rotaları ve Webhooks
│   │   └── ...
│   ├── components/          # UI bileşenleri (Formlar, Tablolar, Kartlar)
│   ├── lib/                 # Yardımcı fonksiyonlar ve Supabase istemcisi
│   └── types/               # TypeScript tip tanımları
├── public/                  # Statik dosyalar
└── scripts/                 # Yönetimsel scriptler (Admin oluşturma, Seed data)
```

## 🏁 Kurulum ve Çalıştırma

### Ön Koşullar

- Node.js (v18 veya üzeri)
- npm veya yarn

### Adımlar

1.  **Projeyi Klonlayın:**
    ```bash
    git clone <repo-url>
    cd Fallio_Web/falio-admin
    ```

2.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    ```

3.  **Çevresel Değişkenleri Ayarlayın:**
    `.env.local` dosyası oluşturun ve gerekli anahtarları ekleyin:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=https://sizin-proje-id.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=sizin-anon-key
    SUPABASE_SERVICE_ROLE_KEY=sizin-service-role-key
    ```
    *> **Not:** `SUPABASE_SERVICE_ROLE_KEY` sadece sunucu tarafında (API routes, Server Actions) kullanılmalıdır.*

4.  **Geliştirme Sunucusunu Başlatın:**
    ```bash
    npm run dev
    ```
    Tarayıcınızda `http://localhost:3000` adresine gidin.

## 🔑 Admin Hesabı Oluşturma

İlk admin hesabını oluşturmak için proje içerisindeki scripti kullanabilirsiniz:

```bash
npx tsx scripts/create-admin.ts
```
Bu komut size e-posta ve şifre soracak, ardından veritabanında yetkili bir admin kullanıcısı oluşturacaktır.

## ☁️ Dağıtım (Deployment)

Proje Vercel için optimize edilmiştir.

1.  GitHub reponuzu Vercel'e bağlayın.
2.  Environment Variables kısmına `.env.local` içindeki değerleri ekleyin.
3.  Deploy tuşuna basın.

## 🔄 Cron Jobs (Zamanlanmış Görevler)

Uygulama, falların otomatik işlenmesi veya burçların güncellenmesi için Vercel Cron kullanır.
İlgili ayarlar `vercel.json` dosyasında ve `src/app/api/cron` dizininde bulunur.
