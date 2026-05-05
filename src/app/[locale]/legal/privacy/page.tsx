import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

export const metadata: Metadata = { title: "Privacy Policy" };

const tr = {
  title: "Gizlilik Politikası",
  intro:
    'Türkiye Gezi platformu ("Biz", "Platform") olarak, ziyaretçilerimizin ve kullanıcılarımızın kişisel verilerinin gizliliğine büyük önem veriyoruz. Bu Gizlilik Politikası, hangi verileri ne amaçla işlediğimizi, kimlerle paylaştığımızı ve sahip olduğunuz hakları açıklar.',
  controller: "Veri Sorumlusu",
  controllerBody:
    "T.C. mevzuatı uyarınca veri sorumlusu sıfatıyla Türkiye Gezi (Operatör Kuruluş) hareket eder. İletişim: dpo@turkiye-tourism.example",
  purposes: "İşleme Amaçları",
  purposesList: [
    "Hizmeti sunmak (hesap yönetimi, favoriler, rotalar)",
    "İstatistiksel analiz ve hizmet kalitesini artırma",
    "Yasal yükümlülüklere uyum",
    "Açık rızanız varsa, kişiselleştirilmiş öneriler ve pazarlama iletişimi",
  ],
  basis: "Hukuki Sebep",
  basisBody:
    "İşleme faaliyetlerimiz KVKK m.5(2) ve GDPR Madde 6'da düzenlenen sebeplere dayanır: (i) sözleşmenin kurulması veya ifası, (ii) hukuki yükümlülük, (iii) meşru menfaat, (iv) açık rıza.",
  retention: "Saklama Süreleri",
  retentionBody:
    "Hesap verileri, hesabınız aktif olduğu sürece saklanır. Hesap silme talebinde verileriniz 30 gün içinde anonimleştirilir, log kayıtları azami 12 ay sonra silinir. Yasal saklama yükümlülüğü olan veriler ilgili sürelerde tutulur.",
  rights: "Haklarınız",
  rightsList: [
    "Verilerinize erişim, düzeltme ve silme talep etme",
    "İşlemeyi sınırlama veya itiraz etme",
    "Veri taşınabilirliği (export endpoint'i ile JSON olarak)",
    "Açık rızayı geri çekme",
    "Veri Koruma Kurulu'na şikayet (KVKK Türkiye için kvkk.gov.tr)",
  ],
  dpo: "Veri Koruma Sorumlusu",
  dpoBody: "DPO ile iletişim: dpo@turkiye-tourism.example",
  changes: "Değişiklikler",
  changesBody:
    "Bu politikayı zaman zaman güncelleyebiliriz. Önemli değişikliklerde sizi e-posta ile veya uygulama içi bildirim ile bilgilendireceğiz ve gerektiğinde yeniden onayınızı isteyeceğiz.",
  updated: "Son güncelleme: 5 Mayıs 2026",
};

const en = {
  title: "Privacy Policy",
  intro:
    'Türkiye Travel ("we", "the Platform") takes the privacy of our visitors and users very seriously. This Privacy Policy describes which personal data we process, why, with whom we share it, and the rights you have.',
  controller: "Data controller",
  controllerBody:
    "The Data Controller, under Turkish (KVKK) and EU (GDPR) regulations, is Türkiye Travel (Operator Entity). Contact: dpo@turkiye-tourism.example",
  purposes: "Purposes of processing",
  purposesList: [
    "Providing the service (account management, favorites, itineraries)",
    "Analytics and service-quality improvements",
    "Compliance with legal obligations",
    "With your explicit consent, personalized recommendations and marketing",
  ],
  basis: "Legal basis",
  basisBody:
    "Our processing relies on the legal grounds set out in KVKK art. 5(2) and GDPR art. 6: (i) performance of a contract, (ii) legal obligation, (iii) legitimate interests, (iv) explicit consent.",
  retention: "Retention",
  retentionBody:
    "Account data is retained while the account is active. On a deletion request your data is anonymised within 30 days; access logs are retained at most 12 months. Data we are legally required to keep is retained for the corresponding statutory period.",
  rights: "Your rights",
  rightsList: [
    "Access, rectification, and erasure of your data",
    "Restriction of, or objection to, processing",
    "Data portability (via the export endpoint, returns JSON)",
    "Withdrawal of consent at any time",
    "Lodging a complaint with the supervisory authority (KVKK in Türkiye, your local DPA in the EU)",
  ],
  dpo: "Data Protection Officer",
  dpoBody: "Contact our DPO at dpo@turkiye-tourism.example.",
  changes: "Changes",
  changesBody:
    "We may update this policy from time to time. We will notify you of material changes via email or in-app notification and ask for re-consent where required.",
  updated: "Last updated: May 5, 2026",
};

export default async function PrivacyPage() {
  const locale = await getLocale();
  const t = locale === "tr" ? tr : en;
  return (
    <article className="container prose prose-neutral max-w-3xl py-12 dark:prose-invert">
      <h1>{t.title}</h1>
      <p className="lead">{t.intro}</p>
      <h2>{t.controller}</h2>
      <p>{t.controllerBody}</p>
      <h2>{t.purposes}</h2>
      <ul>
        {t.purposesList.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <h2>{t.basis}</h2>
      <p>{t.basisBody}</p>
      <h2>{t.retention}</h2>
      <p>{t.retentionBody}</p>
      <h2>{t.rights}</h2>
      <ul>
        {t.rightsList.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <h2>{t.dpo}</h2>
      <p>{t.dpoBody}</p>
      <h2>{t.changes}</h2>
      <p>{t.changesBody}</p>
      <p className="text-sm text-muted-foreground">{t.updated}</p>
    </article>
  );
}
