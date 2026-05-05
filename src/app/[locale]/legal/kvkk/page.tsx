import type { Metadata } from "next";

export const metadata: Metadata = { title: "KVKK Aydınlatma Metni" };

export default function KvkkPage() {
  return (
    <article className="container prose prose-neutral max-w-3xl py-12 dark:prose-invert">
      <h1>KVKK Aydınlatma Metni</h1>
      <p>
        6698 sayılı Kişisel Verilerin Korunması Kanunu (\"KVKK\") kapsamında, Türkiye Gezi platformu
        (\"Veri Sorumlusu\") olarak kişisel verilerinizin işlenmesine ilişkin aşağıdaki bilgileri
        sunarız.
      </p>
      <h2>1. İşlenen Kişisel Veriler</h2>
      <ul>
        <li>Kimlik: ad, soyad, görünen ad</li>
        <li>İletişim: e-posta adresi</li>
        <li>Müşteri işlem: hesap aktiviteleri, favoriler, rotalar, değerlendirmeler</li>
        <li>İşlem güvenliği: IP adresi, cihaz bilgileri, tarayıcı bilgileri</li>
        <li>Görsel kayıtlar: profil fotoğrafı, değerlendirme fotoğrafları (yüklerseniz)</li>
      </ul>
      <h2>2. İşleme Amaçları</h2>
      <ul>
        <li>Hizmet sunumu ve sözleşmesel yükümlülüklerin yerine getirilmesi</li>
        <li>Kullanıcı deneyiminin iyileştirilmesi</li>
        <li>Hukuki yükümlülüklerin yerine getirilmesi</li>
        <li>Açık rızanız varsa, pazarlama ve kişiselleştirme</li>
      </ul>
      <h2>3. Hukuki Sebepler</h2>
      <p>
        KVKK m. 5/2(c) sözleşmenin kurulması veya ifası, m. 5/2(ç) hukuki yükümlülük, m. 5/2(f)
        meşru menfaat ve m. 5/1 açık rıza.
      </p>
      <h2>4. Aktarım</h2>
      <p>
        Verileriniz, sözleşme ifası ve hizmet sunumu amacıyla yurt içinde ve KVKK'nın 9. maddesinde
        belirtilen şartlar çerçevesinde yurt dışında bulunan altyapı sağlayıcıları (ör. bulut
        sunucusu hizmet sağlayıcıları) ile paylaşılabilir.
      </p>
      <h2>5. Haklarınız</h2>
      <p>KVKK m. 11 uyarınca aşağıdaki haklara sahipsiniz:</p>
      <ul>
        <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
        <li>İşleniyorsa bilgi talep etme</li>
        <li>Düzeltme, silme veya yok edilme talep etme</li>
        <li>Yurt içi/yurt dışı aktarımı bildirme talep etme</li>
        <li>İtiraz etme ve zarar halinde tazminat talep etme</li>
      </ul>
      <h2>6. Başvuru</h2>
      <p>
        Haklarınızı kullanmak için{" "}
        <a href="mailto:dpo@turkiye-tourism.example">dpo@turkiye-tourism.example</a> adresine
        yazabilir veya hesabınızdan "Verilerimi indir" / "Hesabımı sil" işlemlerini
        kullanabilirsiniz.
      </p>
      <p className="text-sm text-muted-foreground">Yürürlük tarihi: 5 Mayıs 2026</p>
    </article>
  );
}
