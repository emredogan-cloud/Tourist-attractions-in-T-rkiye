import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

export const metadata: Metadata = { title: "Terms of Service" };

export default async function TermsPage() {
  const locale = await getLocale();
  const isTr = locale === "tr";
  return (
    <article className="container prose prose-neutral max-w-3xl py-12 dark:prose-invert">
      <h1>{isTr ? "Kullanım Şartları" : "Terms of Service"}</h1>
      <p>
        {isTr
          ? "Türkiye Gezi platformuna hoş geldiniz. Lütfen aşağıdaki şartları dikkatlice okuyun. Hizmetlerimizi kullanarak bu şartları kabul etmiş sayılırsınız."
          : "Welcome to Türkiye Travel. Please read these terms carefully. By using our services you accept these terms."}
      </p>
      <h2>{isTr ? "1. Hizmetin Kapsamı" : "1. Scope of the service"}</h2>
      <p>
        {isTr
          ? "Türkiye Gezi, Türkiye'deki turistik yerler hakkında bilgilendirici içerik, harita, değerlendirme ve rota planlama araçları sunan bir platformdur. İçerikler bilgilendirme amaçlı olup, ziyaret koşulları (açılış saati, fiyat) zaman içinde değişebilir."
          : "Türkiye Travel is a platform providing informational content, maps, reviews, and trip-planning tools for tourist attractions in Türkiye. Content is informational; visiting conditions (opening hours, pricing) can change."}
      </p>
      <h2>{isTr ? "2. Kullanıcı Hesabı" : "2. User account"}</h2>
      <p>
        {isTr
          ? "Bazı özellikler için hesap oluşturmanız gerekir. Hesap bilgilerinizin gizliliğinden ve hesabınızdaki tüm faaliyetlerden siz sorumlusunuz."
          : "Some features require an account. You are responsible for the confidentiality of your credentials and for all activity on your account."}
      </p>
      <h2>{isTr ? "3. Kullanıcı İçerikleri" : "3. User-generated content"}</h2>
      <p>
        {isTr
          ? "Yorumlar, fotoğraflar ve diğer içerikler için bize münhasır olmayan, dünya çapında, telifsiz bir kullanım lisansı vermiş olursunuz. İçeriklerinizin üçüncü kişi haklarını ihlal etmemesi gerekir."
          : "By posting reviews, photos, or other content you grant us a non-exclusive, worldwide, royalty-free license to use that content on the platform. Your content must not infringe third-party rights."}
      </p>
      <h2>{isTr ? "4. Yasak Davranışlar" : "4. Prohibited conduct"}</h2>
      <ul>
        <li>
          {isTr
            ? "Yanıltıcı, hakaret içeren veya yasa dışı içerik yayınlamak"
            : "Posting misleading, defamatory, or unlawful content"}
        </li>
        <li>
          {isTr
            ? "Spam, otomatik botlar veya istem dışı veri toplama"
            : "Spam, automated bots, or unsolicited data harvesting"}
        </li>
        <li>
          {isTr
            ? "Platform güvenliğine yönelik saldırılar"
            : "Attacks against the platform's security"}
        </li>
      </ul>
      <h2>{isTr ? "5. Sorumluluğun Sınırlandırılması" : "5. Limitation of liability"}</h2>
      <p>
        {isTr
          ? "Yasaların izin verdiği azami ölçüde, dolaylı zararlardan sorumlu değiliz. Ücretli abonelik için ödediğiniz tutar, sorumluluğumuzun azami sınırıdır."
          : "To the maximum extent permitted by law, we are not liable for indirect damages. Our maximum liability for paid subscriptions is limited to the fees you paid."}
      </p>
      <h2>{isTr ? "6. Yürürlük ve Değişiklikler" : "6. Effective date and changes"}</h2>
      <p>
        {isTr
          ? "Bu şartlar 5 Mayıs 2026 tarihinde yürürlüğe girer. Önemli değişiklikleri size duyuracağız."
          : "These terms are effective as of May 5, 2026. We will notify you of material changes."}
      </p>
    </article>
  );
}
