export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto p-8 font-sans text-gray-800">
      <h1 className="text-3xl font-bold mb-6">Gizlilik Politikası (Privacy Policy)</h1>
      <p className="mb-4">Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>
      
      <p className="mb-4">
        Bu Gizlilik Politikası, <strong>MoiV Interactive</strong> tarafından geliştirilen <strong>Fallio</strong> mobil uygulamasını ("Uygulama") kullanırken bilgilerinizin nasıl toplandığını, kullanıldığını ve yönetildiğini açıklar.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-3">1. Toplanan Bilgiler</h2>
      <ul className="list-disc ml-6 mb-4">
        <li><strong>Hesap Bilgileri:</strong> Kayıt olurken sağladığınız e-posta adresi, isim, doğum tarihi ve cinsiyet bilgileri.</li>
        <li><strong>Kullanıcı İçeriği:</strong> Fal yorumlanması için yüklediğiniz fotoğraflar ve notlar.</li>
        <li><strong>Cihaz Bilgileri:</strong> Bildirim göndermek için kullanılan cihaz kimlikleri (Device ID).</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-3">2. Bilgilerin Kullanımı</h2>
      <p className="mb-4">
        Topladığımız bilgileri şu amaçlarla kullanırız:
        <ul className="list-disc ml-6 mt-2">
          <li>Fal yorumlama hizmetini sağlamak (AI entegrasyonu dahil).</li>
          <li>Kullanıcı hesabınızı yönetmek.</li>
          <li>Size önemli güncellemeler ve bildirimler göndermek.</li>
        </ul>
      </p>
      
      <h2 className="text-xl font-semibold mt-6 mb-3">3. Veri Güvenliği</h2>
      <p className="mb-4">
        Kişisel verileriniz güvenli sunucularda (Supabase) saklanmakta olup, yetkisiz erişime karşı endüstri standardı şifreleme yöntemleri ile korunmaktadır.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-3">4. Üçüncü Taraf Hizmetler</h2>
      <p className="mb-4">
        Uygulamamız aşağıdaki üçüncü taraf hizmetleri kullanabilir:
        <ul className="list-disc ml-6 mt-2">
          <li><strong>RevenueCat:</strong> Uygulama içi satın almaların yönetimi.</li>
          <li><strong>Google/Apple Auth:</strong> Kimlik doğrulama hizmetleri.</li>
          <li><strong>OpenAI/Gemini/Anthropic:</strong> Fal yorumlama için yapay zeka servisleri.</li>
        </ul>
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-3">5. Hesap Silme ve Haklarınız</h2>
      <p className="mb-4">
        Kullanıcılar, diledikleri zaman hesaplarını ve ilişkili tüm verilerini kalıcı olarak silme hakkına sahiptir. Hesap silme işlemi geri alınamaz.
      </p>
      
      <h3 className="text-lg font-medium mt-4 mb-2">Hesabınızı Nasıl Silebilirsiniz?</h3>
      <p className="mb-4">
        Hesabınızı silmek için uygulama içerisinden şu adımları takip edebilirsiniz:
        <ol className="list-decimal ml-6 mt-2 mb-4">
          <li>Fallio uygulamasını açın ve giriş yapın.</li>
          <li>Alt menüden <strong>Profil</strong> sekmesine gidin.</li>
          <li>Sağ üst köşedeki <strong>Ayarlar</strong> (Dişli İkonu) butonuna tıklayın.</li>
          <li>Ayarlar menüsünün en altında bulunan <strong>"Hesabımı Sil"</strong> seçeneğine dokunun.</li>
          <li>Çıkan onay penceresinde silme işlemini onaylayın.</li>
        </ol>
        Hesap silme talebiniz anında işleme alınır; tüm kişisel verileriniz, fal geçmişiniz ve kredileriniz veritabanımızdan kalıcı olarak silinir.
      </p>
      
      <p className="mb-4">
        Alternatif olarak, <strong><a href="mailto:support@fallio.com" className="text-blue-600 underline">support@fallio.com</a></strong> adresine hesabınızın bağlı olduğu e-posta adresi üzerinden bir talep göndererek de silme işlemini başlatabilirsiniz.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-3">6. İletişim</h2>
      <p className="mb-4">
        Bu politika hakkında sorularınız varsa, lütfen bizimle iletişime geçin: <a href="mailto:support@fallio.com" className="text-blue-600 underline">support@fallio.com</a>
      </p>
    </div>
  );
}
