import { prisma } from "../src/server/db/client";
import { logger } from "../src/lib/logger";
import { slugify } from "../src/lib/utils";

type SeedAttraction = {
  externalRef: string;
  category: string;
  regionCode: string;
  province: { slug: string; nameTr: string; nameEn: string; regionCode: string };
  district?: string;
  latitude: number;
  longitude: number;
  elevationM?: number;
  unescoStatus?: "WORLD_HERITAGE" | "TENTATIVE";
  popularityScore: number;
  averageRating: number;
  reviewCount: number;
  isFreeEntry: boolean;
  accessibility?: Record<string, boolean>;
  translations: { tr: TranslationContent; en: TranslationContent };
  media: SeedMedia[];
  hours?: SeedHour[];
  pricing?: SeedPrice[];
  visitorStats?: { year: number; month: number; visitorCount: number }[];
};

type TranslationContent = { name: string; summary: string; description: string; history?: string; tips?: string };
type SeedMedia = { url: string; altTr: string; altEn: string; license: string; photographer?: string; attribution?: string; isHero?: boolean };
type SeedHour = { season?: "ALL_YEAR" | "SUMMER" | "WINTER"; dayOfWeek: number; openTime?: string; closeTime?: string; isClosed?: boolean; notes?: string };
type SeedPrice = { audience: string; priceTry: number; isFree?: boolean };

const REGIONS: { code: "MARMARA" | "AEGEAN" | "MEDITERRANEAN" | "BLACK_SEA" | "CENTRAL_ANATOLIA" | "EASTERN_ANATOLIA" | "SOUTHEASTERN_ANATOLIA"; nameTr: string; nameEn: string }[] = [
  { code: "MARMARA", nameTr: "Marmara", nameEn: "Marmara" },
  { code: "AEGEAN", nameTr: "Ege", nameEn: "Aegean" },
  { code: "MEDITERRANEAN", nameTr: "Akdeniz", nameEn: "Mediterranean" },
  { code: "BLACK_SEA", nameTr: "Karadeniz", nameEn: "Black Sea" },
  { code: "CENTRAL_ANATOLIA", nameTr: "İç Anadolu", nameEn: "Central Anatolia" },
  { code: "EASTERN_ANATOLIA", nameTr: "Doğu Anadolu", nameEn: "Eastern Anatolia" },
  { code: "SOUTHEASTERN_ANATOLIA", nameTr: "Güneydoğu Anadolu", nameEn: "Southeastern Anatolia" },
];

const CATEGORIES = [
  { code: "HISTORICAL", slugTr: "tarihi-yerler", slugEn: "historical-sites" },
  { code: "NATURAL", slugTr: "dogal-harikalar", slugEn: "natural-wonders" },
  { code: "RELIGIOUS", slugTr: "dini-yerler", slugEn: "religious-sites" },
  { code: "CULTURAL", slugTr: "kulturel-mekanlar", slugEn: "cultural-venues" },
  { code: "BEACH", slugTr: "plajlar", slugEn: "beaches" },
  { code: "MUSEUM", slugTr: "muzeler", slugEn: "museums" },
  { code: "ARCHAEOLOGICAL", slugTr: "arkeolojik-alanlar", slugEn: "archaeological-sites" },
  { code: "ADVENTURE", slugTr: "macera", slugEn: "adventure" },
  { code: "URBAN", slugTr: "sehir-merkezleri", slugEn: "urban-experiences" },
  { code: "FOOD_DRINK", slugTr: "yeme-icme", slugEn: "food-drink" },
] as const;

const ATTRACTIONS: SeedAttraction[] = [
  {
    externalRef: "ayasofya",
    category: "RELIGIOUS",
    regionCode: "MARMARA",
    province: { slug: "istanbul", nameTr: "İstanbul", nameEn: "Istanbul", regionCode: "MARMARA" },
    district: "Fatih",
    latitude: 41.0086,
    longitude: 28.98,
    unescoStatus: "WORLD_HERITAGE",
    popularityScore: 9.8,
    averageRating: 4.7,
    reviewCount: 0,
    isFreeEntry: false,
    accessibility: { wheelchair: true, audioGuide: true },
    translations: {
      tr: {
        name: "Ayasofya-i Kebir Cami-i Şerifi",
        summary: "İstanbul'un kalbinde 1500 yıllık ihtişamla ayakta duran Ayasofya, Bizans ve Osmanlı mimarisinin zirvesidir.",
        description:
          "537 yılında Bizans İmparatoru I. Justinianos tarafından kilise olarak inşa edilen Ayasofya, 916 yıl Doğu Roma İmparatorluğu'nun en büyük kilisesi olarak hizmet vermiş, 1453'te Fatih Sultan Mehmet'in İstanbul'u fethiyle camiye dönüştürülmüştür. 1934-2020 arasında müze olarak kullanılan yapı, 2020'den bu yana yeniden cami olarak ibadete açıktır. 56 metre yüksekliğindeki devasa kubbesi ve içerideki Bizans dönemi mozaikleri, mimari ve sanat tarihinin kilometre taşıdır.",
        history:
          "Yapının ilk hali 360 yılında inşa edilmiştir. 532'deki Nika İsyanı'nda yanan ikinci yapının yerine bugünkü Ayasofya 5 yıl 10 ayda tamamlanmıştır. 1453 fetihten sonra eklenen minareler, mihrap ve hat levhaları, yapının çok katmanlı kimliğini oluşturur.",
        tips:
          "Sabah erken saatlerde veya akşamüstü daha az kalabalıktır. Cuma namazı saatlerinde ziyaret kapalıdır. Hat levhalarının ve Hz. Meryem mozaiklerinin altın kakmaları için boyun eğmeyi unutmayın.",
      },
      en: {
        name: "Hagia Sophia Grand Mosque",
        summary: "Standing for 1,500 years at the heart of Istanbul, Hagia Sophia is the apex of Byzantine and Ottoman architecture.",
        description:
          "Built in 537 AD by Byzantine Emperor Justinian I as a cathedral, Hagia Sophia served as the largest church of the Eastern Roman Empire for 916 years before being converted into a mosque after Mehmed II's conquest of Istanbul in 1453. From 1934 to 2020 it operated as a museum; in 2020 it was re-designated a mosque and reopened for worship. The massive 56-metre dome and the Byzantine mosaics inside are landmarks in the history of architecture and art.",
        history:
          "The first church on the site dates from 360 AD. After the second was burned in the Nika riots of 532, the present Hagia Sophia was completed in five years and ten months. Minarets, mihrab and the giant calligraphic medallions added after 1453 give the building its layered identity.",
        tips:
          "Visit early morning or late afternoon for thinner crowds. The mosque is closed during Friday prayer hours. Don't miss the gold-leaf mosaics of the Virgin Mary near the apse — look up.",
      },
    },
    media: [
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Hagia_Sophia_Mars_2013.jpg/1280px-Hagia_Sophia_Mars_2013.jpg",
        altTr: "Ayasofya'nın güneybatıdan dış görünümü",
        altEn: "Exterior of Hagia Sophia from the southwest",
        license: "CC BY-SA 3.0",
        photographer: "Arild Vågen",
        attribution: "Wikimedia Commons / Arild Vågen — CC BY-SA 3.0",
        isHero: true,
      },
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Ayasofya-Innenansicht.jpg/1280px-Ayasofya-Innenansicht.jpg",
        altTr: "Ayasofya iç mekan kubbesi",
        altEn: "Interior dome of Hagia Sophia",
        license: "CC BY-SA 3.0",
        photographer: "Ralf Steinberger",
        attribution: "Wikimedia Commons / Ralf Steinberger — CC BY-SA 3.0",
      },
    ],
    hours: [
      { dayOfWeek: 0, openTime: "09:00", closeTime: "19:00" },
      { dayOfWeek: 1, openTime: "09:00", closeTime: "19:00" },
      { dayOfWeek: 2, openTime: "09:00", closeTime: "19:00" },
      { dayOfWeek: 3, openTime: "09:00", closeTime: "19:00" },
      { dayOfWeek: 4, openTime: "09:00", closeTime: "19:00" },
      { dayOfWeek: 5, openTime: "13:30", closeTime: "19:00", notes: "Cuma namazı sonrası açılır" },
      { dayOfWeek: 6, openTime: "09:00", closeTime: "19:00" },
    ],
    pricing: [
      { audience: "ADULT", priceTry: 0, isFree: true },
      { audience: "FOREIGN_ADULT", priceTry: 1500 },
    ],
    visitorStats: [
      { year: 2024, month: 1, visitorCount: 410_000 },
      { year: 2024, month: 2, visitorCount: 380_000 },
      { year: 2024, month: 3, visitorCount: 520_000 },
      { year: 2024, month: 4, visitorCount: 640_000 },
      { year: 2024, month: 5, visitorCount: 780_000 },
      { year: 2024, month: 6, visitorCount: 910_000 },
      { year: 2024, month: 7, visitorCount: 1_120_000 },
      { year: 2024, month: 8, visitorCount: 1_180_000 },
      { year: 2024, month: 9, visitorCount: 980_000 },
      { year: 2024, month: 10, visitorCount: 720_000 },
      { year: 2024, month: 11, visitorCount: 480_000 },
      { year: 2024, month: 12, visitorCount: 530_000 },
    ],
  },
  {
    externalRef: "kapadokya",
    category: "NATURAL",
    regionCode: "CENTRAL_ANATOLIA",
    province: { slug: "nevsehir", nameTr: "Nevşehir", nameEn: "Nevşehir", regionCode: "CENTRAL_ANATOLIA" },
    district: "Göreme",
    latitude: 38.6431,
    longitude: 34.829,
    elevationM: 1100,
    unescoStatus: "WORLD_HERITAGE",
    popularityScore: 9.7,
    averageRating: 4.8,
    reviewCount: 0,
    isFreeEntry: true,
    translations: {
      tr: {
        name: "Kapadokya — Göreme Açık Hava Müzesi",
        summary: "Peri bacaları, kayadan oyulmuş kiliseler ve sıcak hava balonlarıyla efsane olmuş bir manzara.",
        description:
          "Volkanik tüf kayaların milyonlarca yılda rüzgar ve su tarafından oyulmasıyla oluşan Kapadokya, dünyanın en sıradışı doğal manzaralarından biridir. Göreme Açık Hava Müzesi, kaya kiliselerinin ve fresklerinin yer aldığı UNESCO Dünya Mirası alanıdır. Şafakta yüzlerce sıcak hava balonu vadinin üzerinde süzülür ve bölgeye dünyaca ünlü siluetini kazandırır.",
        history:
          "M.Ö. 4. yüzyıldan itibaren Hıristiyanlar bu kayalara sığınıp manastırlar ve kiliseler oymuştur. 11.-12. yüzyıllar boyunca yerleşim altın çağını yaşamış, Bizans dönemi freskleriyle bezenmiştir.",
        tips:
          "Balon turları için Göreme veya Uçhisar'da konaklayın. En iyi izleme noktaları Sunset Point ve Aşk Vadisi'dir. Avantos kilim atölyeleri ziyaret edilmeye değerdir.",
      },
      en: {
        name: "Cappadocia — Göreme Open-Air Museum",
        summary: "Fairy chimneys, rock-cut chapels, and a sky full of hot-air balloons make this landscape legendary.",
        description:
          "Carved over millions of years by wind and water from volcanic tuff, Cappadocia is one of the world's most surreal natural landscapes. The Göreme Open-Air Museum, a UNESCO World Heritage site, preserves rock-cut churches with Byzantine frescoes. At dawn, hundreds of hot-air balloons drift above the valleys — the silhouette that made the region world-famous.",
        history:
          "From the 4th century BC, Christians sheltered in these rocks, carving monasteries and chapels. Settlement reached its peak during the 11th–12th centuries, leaving frescoes that still glow today.",
        tips:
          "Stay in Göreme or Uçhisar for early balloon flights. The best viewpoints are Sunset Point and Love Valley. Don't miss the Avanos pottery workshops.",
      },
    },
    media: [
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Goreme_panorama.jpg/1280px-Goreme_panorama.jpg",
        altTr: "Göreme'de balonlar ve peri bacaları panoraması",
        altEn: "Panorama of fairy chimneys and balloons over Göreme",
        license: "CC BY-SA 3.0",
        photographer: "Bjørn Christian Tørrissen",
        attribution: "Wikimedia Commons / Bjørn Christian Tørrissen — CC BY-SA 3.0",
        isHero: true,
      },
    ],
    hours: [
      { dayOfWeek: 0, openTime: "08:00", closeTime: "19:00", season: "SUMMER" },
      { dayOfWeek: 1, openTime: "08:00", closeTime: "19:00", season: "SUMMER" },
      { dayOfWeek: 2, openTime: "08:00", closeTime: "19:00", season: "SUMMER" },
      { dayOfWeek: 3, openTime: "08:00", closeTime: "19:00", season: "SUMMER" },
      { dayOfWeek: 4, openTime: "08:00", closeTime: "19:00", season: "SUMMER" },
      { dayOfWeek: 5, openTime: "08:00", closeTime: "19:00", season: "SUMMER" },
      { dayOfWeek: 6, openTime: "08:00", closeTime: "19:00", season: "SUMMER" },
    ],
    pricing: [
      { audience: "ADULT", priceTry: 350 },
      { audience: "STUDENT", priceTry: 100 },
      { audience: "FOREIGN_ADULT", priceTry: 1200 },
    ],
    visitorStats: [
      { year: 2024, month: 1, visitorCount: 80_000 },
      { year: 2024, month: 4, visitorCount: 320_000 },
      { year: 2024, month: 7, visitorCount: 540_000 },
      { year: 2024, month: 10, visitorCount: 380_000 },
    ],
  },
  {
    externalRef: "pamukkale",
    category: "NATURAL",
    regionCode: "AEGEAN",
    province: { slug: "denizli", nameTr: "Denizli", nameEn: "Denizli", regionCode: "AEGEAN" },
    district: "Pamukkale",
    latitude: 37.9136,
    longitude: 29.1206,
    elevationM: 350,
    unescoStatus: "WORLD_HERITAGE",
    popularityScore: 9.4,
    averageRating: 4.6,
    reviewCount: 0,
    isFreeEntry: false,
    translations: {
      tr: {
        name: "Pamukkale ve Hierapolis",
        summary: "Beyaz travertenler ve antik Hierapolis kentiyle birlikte UNESCO Dünya Mirası listesinde.",
        description:
          "Termal suların kireç çökeltileriyle oluşturduğu, kar beyazı travertenleriyle ünlü Pamukkale, antik Hierapolis kentinin yamaçlarında uzanır. M.Ö. 2. yüzyılda Bergamalılar tarafından kurulan Hierapolis, Roma ve Bizans dönemlerinde önemli bir sağlık merkezi olmuştur. Bugün Cleopatra Antik Havuzu'nda yüzebilir ve 200 metre yükseklikten Çürüksu Vadisi'ni izleyebilirsiniz.",
        history:
          "Hierapolis, MÖ 190'da Bergama Krallığı tarafından kurulmuş, 14. yüzyıldaki büyük depremle yıkılmıştır. Antik tiyatro 12.000 kişi kapasitelidir.",
        tips:
          "Travertenlere yalın ayak girilir; ayakkabılar girişte bırakılır. Cleopatra Havuzu için ek ücret vardır. Gün batımında traverten ışığı muhteşemdir.",
      },
      en: {
        name: "Pamukkale & Hierapolis",
        summary: "Snow-white travertines and the ancient city of Hierapolis form a single UNESCO World Heritage Site.",
        description:
          "Pamukkale's brilliant white travertines were formed by thermal springs depositing calcium carbonate over millennia. They cascade down the slope below the ancient city of Hierapolis, founded by the Pergamenes in the 2nd century BC and developed by the Romans and Byzantines as a healing centre. Today, visitors can swim among submerged Roman columns in Cleopatra's Antique Pool and gaze across the Curuksu Valley from a 200-metre cliff.",
        history:
          "Hierapolis was founded in 190 BC by the Kingdom of Pergamon and destroyed by an earthquake in the 14th century. Its theatre seats 12,000.",
        tips:
          "You must walk barefoot on the travertines — leave shoes at the entrance. Cleopatra's Pool has a separate fee. Sunset turns the white surface gold and pink.",
      },
    },
    media: [
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Pamukkale_31.jpg/1280px-Pamukkale_31.jpg",
        altTr: "Pamukkale travertenleri",
        altEn: "Travertine terraces of Pamukkale",
        license: "CC BY-SA 3.0",
        photographer: "Antoine Taveneaux",
        attribution: "Wikimedia Commons / Antoine Taveneaux — CC BY-SA 3.0",
        isHero: true,
      },
    ],
    pricing: [
      { audience: "ADULT", priceTry: 600 },
      { audience: "FOREIGN_ADULT", priceTry: 1200 },
    ],
    hours: [
      { dayOfWeek: 0, openTime: "06:30", closeTime: "21:00" },
      { dayOfWeek: 1, openTime: "06:30", closeTime: "21:00" },
      { dayOfWeek: 2, openTime: "06:30", closeTime: "21:00" },
      { dayOfWeek: 3, openTime: "06:30", closeTime: "21:00" },
      { dayOfWeek: 4, openTime: "06:30", closeTime: "21:00" },
      { dayOfWeek: 5, openTime: "06:30", closeTime: "21:00" },
      { dayOfWeek: 6, openTime: "06:30", closeTime: "21:00" },
    ],
  },
  {
    externalRef: "efes",
    category: "ARCHAEOLOGICAL",
    regionCode: "AEGEAN",
    province: { slug: "izmir", nameTr: "İzmir", nameEn: "İzmir", regionCode: "AEGEAN" },
    district: "Selçuk",
    latitude: 37.9395,
    longitude: 27.3417,
    unescoStatus: "WORLD_HERITAGE",
    popularityScore: 9.5,
    averageRating: 4.7,
    reviewCount: 0,
    isFreeEntry: false,
    translations: {
      tr: {
        name: "Efes Antik Kenti",
        summary: "Roma İmparatorluğu'nun en görkemli kentlerinden biri — Celsus Kütüphanesi ve Büyük Tiyatro hala ayakta.",
        description:
          "M.Ö. 10. yüzyılda kurulan Efes, Roma döneminde 250.000 nüfuslu, dünyanın dördüncü büyük kentidir. UNESCO Dünya Mirası listesindeki şehirde Celsus Kütüphanesi'nin etkileyici cephesi, 25.000 kişilik Büyük Tiyatro ve mermer döşeli Kuretler Caddesi günümüze ulaşmıştır. Yakındaki Meryem Ana Evi de Hıristiyan dünyası için önemli bir hac merkezidir.",
        tips: "Sabah erken saatler Roma sıcağından kaçınmak için idealdir. Yamaç Evler ek bilet gerektirir ama ziyarete değer.",
      },
      en: {
        name: "Ancient City of Ephesus",
        summary: "Roman Empire splendour — the Library of Celsus and Grand Theatre still stand.",
        description:
          "Founded in the 10th century BC, Ephesus reached 250,000 inhabitants in Roman times — the fourth largest city in the world. The UNESCO-listed site preserves the iconic façade of the Library of Celsus, the 25,000-seat Grand Theatre, and the marble-paved Curetes Street. Nearby, the House of the Virgin Mary is a major Christian pilgrimage site.",
        tips: "Arrive early to escape the Aegean heat. The Terrace Houses require an extra ticket but are worth it.",
      },
    },
    media: [
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Ephesus_Library.jpg/1280px-Ephesus_Library.jpg",
        altTr: "Efes Celsus Kütüphanesi cephesi",
        altEn: "Façade of the Library of Celsus, Ephesus",
        license: "CC BY-SA 3.0",
        photographer: "Adam Carr",
        attribution: "Wikimedia Commons / Adam Carr — CC BY-SA 3.0",
        isHero: true,
      },
    ],
    pricing: [
      { audience: "ADULT", priceTry: 700 },
      { audience: "STUDENT", priceTry: 200 },
      { audience: "FOREIGN_ADULT", priceTry: 1400 },
    ],
  },
  {
    externalRef: "topkapi-sarayi",
    category: "MUSEUM",
    regionCode: "MARMARA",
    province: { slug: "istanbul", nameTr: "İstanbul", nameEn: "Istanbul", regionCode: "MARMARA" },
    district: "Fatih",
    latitude: 41.0115,
    longitude: 28.9833,
    unescoStatus: "WORLD_HERITAGE",
    popularityScore: 9.3,
    averageRating: 4.5,
    reviewCount: 0,
    isFreeEntry: false,
    translations: {
      tr: {
        name: "Topkapı Sarayı Müzesi",
        summary: "400 yıl Osmanlı padişahlarına ev sahipliği yapan, Boğaz manzaralı muhteşem saray kompleksi.",
        description:
          "Fatih Sultan Mehmet tarafından 1460'larda yaptırılan Topkapı Sarayı, 400 yıl boyunca 25 padişaha ev sahipliği yapmıştır. Hazine Dairesi'nde 86 karatlık Kaşıkçı Elması ve Topkapı Hançeri sergilenir. Harem bölümü, kutsal emanetler ve sultan portreleri dünyanın dört bir yanından ziyaretçi çeker.",
        tips: "Hazine Dairesi ve Harem ayrı biletlerle ziyaret edilir. Sabah ilk saatler kuyruksuzdur.",
      },
      en: {
        name: "Topkapı Palace Museum",
        summary: "Home to Ottoman sultans for 400 years, perched above the Bosphorus with stunning views.",
        description:
          "Built in the 1460s by Mehmed the Conqueror, Topkapı Palace housed 25 Ottoman sultans across four centuries. The Treasury holds the 86-carat Spoonmaker's Diamond and the famed Topkapı Dagger. The Harem quarter, the Sacred Relics chamber, and the sultans' portrait collection draw visitors from around the world.",
        tips: "The Treasury and Harem require separate tickets. Arrive at opening to skip queues.",
      },
    },
    media: [
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Topkapi-Palace_2007.jpg/1280px-Topkapi-Palace_2007.jpg",
        altTr: "Topkapı Sarayı dış görünümü",
        altEn: "Exterior of Topkapı Palace",
        license: "CC BY-SA 3.0",
        attribution: "Wikimedia Commons — CC BY-SA 3.0",
        isHero: true,
      },
    ],
    pricing: [
      { audience: "ADULT", priceTry: 800 },
      { audience: "FOREIGN_ADULT", priceTry: 1500 },
    ],
  },
  {
    externalRef: "sumela-manastiri",
    category: "RELIGIOUS",
    regionCode: "BLACK_SEA",
    province: { slug: "trabzon", nameTr: "Trabzon", nameEn: "Trabzon", regionCode: "BLACK_SEA" },
    district: "Maçka",
    latitude: 40.6892,
    longitude: 39.6586,
    elevationM: 1200,
    popularityScore: 8.8,
    averageRating: 4.6,
    reviewCount: 0,
    isFreeEntry: false,
    translations: {
      tr: {
        name: "Sumela Manastırı",
        summary: "Karadağ'ın yamacında, 300 metre yükseklikte uçurum kenarına oyulmuş 1600 yıllık Bizans manastırı.",
        description:
          "M.S. 386 yılında kurulan Sumela Manastırı, Altındere Vadisi'nin dik kayalıklarına oyulmuş, sarp bir uçurumun kenarında asılı duran muhteşem bir Bizans yapısıdır. Kayaya oyulmuş kilise, içerideki Ana Kaya Kilisesi'nde 14.-19. yüzyıl freskleri ile süslüdür. 1923'e kadar Rum Ortodoks keşişlerin yaşadığı manastır, bugün ziyarete açıktır.",
        tips: "Yol patikalı; rahat ayakkabı şart. Kış aylarında kar nedeniyle kapalı olabilir.",
      },
      en: {
        name: "Sumela Monastery",
        summary: "A 1,600-year-old Byzantine monastery clinging to a sheer cliff 300 metres above the Altındere Valley.",
        description:
          "Founded in 386 AD, Sumela Monastery is carved into the steep cliffs of the Altındere Valley, dramatically suspended above the abyss. The rock church inside is decorated with frescoes from the 14th–19th centuries. Greek Orthodox monks lived here until 1923; today it is open to visitors and remains a powerful symbol of Black Sea Byzantine heritage.",
        tips: "The trail is rough — sturdy shoes are essential. The site can be closed in winter due to snow.",
      },
    },
    media: [
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Sumela_Monastery_2009_Cropped.jpg/1280px-Sumela_Monastery_2009_Cropped.jpg",
        altTr: "Sumela Manastırı kayalık üzerinde",
        altEn: "Sumela Monastery on the cliff",
        license: "CC BY-SA 3.0",
        photographer: "Bjørn Christian Tørrissen",
        attribution: "Wikimedia Commons / Bjørn Christian Tørrissen — CC BY-SA 3.0",
        isHero: true,
      },
    ],
    pricing: [
      { audience: "ADULT", priceTry: 200 },
      { audience: "FOREIGN_ADULT", priceTry: 600 },
    ],
  },
  {
    externalRef: "gobekli-tepe",
    category: "ARCHAEOLOGICAL",
    regionCode: "SOUTHEASTERN_ANATOLIA",
    province: { slug: "sanliurfa", nameTr: "Şanlıurfa", nameEn: "Şanlıurfa", regionCode: "SOUTHEASTERN_ANATOLIA" },
    district: "Haliliye",
    latitude: 37.2231,
    longitude: 38.9225,
    unescoStatus: "WORLD_HERITAGE",
    popularityScore: 9.0,
    averageRating: 4.6,
    reviewCount: 0,
    isFreeEntry: false,
    translations: {
      tr: {
        name: "Göbekli Tepe",
        summary: "12.000 yıllık taş daireleri ile bilinen dünyanın en eski tapınak yerleşkesi.",
        description:
          "M.Ö. 9600 yılına tarihlenen Göbekli Tepe, dünyanın bilinen en eski tapınağıdır — Stonehenge'den 7.000, piramitlerden 7.500 yıl önce inşa edilmiştir. Avcı-toplayıcı toplumların organize din ve mimari bilgisine ait paradigmamızı değiştirmiştir. T-şekilli devasa kireçtaşı sütunlar üzerinde tilki, yılan, akrep ve aslan kabartmaları yer alır. UNESCO Dünya Mirası listesindedir.",
        tips: "Yaz aylarında çok sıcak olabilir; sabah ziyaret tavsiye edilir. Şanlıurfa Müzesi mutlaka birlikte planlanmalı.",
      },
      en: {
        name: "Göbekli Tepe",
        summary: "Known as the world's oldest temple complex, with 12,000-year-old stone circles.",
        description:
          "Dating to roughly 9600 BC, Göbekli Tepe is the world's oldest known temple — predating Stonehenge by 7,000 years and the pyramids by 7,500. It overturned long-held assumptions about religion and architecture among hunter-gatherer societies. Massive T-shaped limestone pillars carry reliefs of foxes, snakes, scorpions and lions. It is a UNESCO World Heritage Site.",
        tips: "Summers are scorching — visit in the morning. Pair with the Şanlıurfa Museum to see Karahantepe finds.",
      },
    },
    media: [
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/G%C3%B6bekli_Tepe%2C_Urfa.jpg/1280px-G%C3%B6bekli_Tepe%2C_Urfa.jpg",
        altTr: "Göbekli Tepe T şeklinde sütunlar",
        altEn: "T-shaped pillars at Göbekli Tepe",
        license: "CC BY-SA 4.0",
        photographer: "Teomancimit",
        attribution: "Wikimedia Commons / Teomancimit — CC BY-SA 4.0",
        isHero: true,
      },
    ],
    pricing: [
      { audience: "ADULT", priceTry: 300 },
      { audience: "FOREIGN_ADULT", priceTry: 800 },
    ],
  },
  {
    externalRef: "nemrut-dagi",
    category: "ARCHAEOLOGICAL",
    regionCode: "SOUTHEASTERN_ANATOLIA",
    province: { slug: "adiyaman", nameTr: "Adıyaman", nameEn: "Adıyaman", regionCode: "SOUTHEASTERN_ANATOLIA" },
    district: "Kahta",
    latitude: 37.9803,
    longitude: 38.7411,
    elevationM: 2150,
    unescoStatus: "WORLD_HERITAGE",
    popularityScore: 8.6,
    averageRating: 4.7,
    reviewCount: 0,
    isFreeEntry: false,
    translations: {
      tr: {
        name: "Nemrut Dağı",
        summary: "2.150 metre yükseklikte, 2000 yıllık devasa baş heykelleri olan Kommagene kraliyet mezarı.",
        description:
          "M.Ö. 1. yüzyılda Kommagene Kralı I. Antiochos tarafından dağın zirvesine yaptırılan tümülüs ve onun çevresindeki devasa Tanrı heykelleri, dünya tarihinin en sıradışı arkeolojik anıtlarından biridir. 9 metre yüksekliğindeki başlar — Zeus, Apollo, Herakles ve I. Antiochos — yaklaşık 2.000 yıl önce buraya taşınmıştır. UNESCO Dünya Mirası listesindedir.",
        tips: "Gün doğumu ve gün batımı izleme noktaları farklıdır. Yola çıkmadan önce hava durumunu kontrol edin — sıklıkla rüzgarlı ve serindir.",
      },
      en: {
        name: "Mount Nemrut",
        summary: "A 2,000-year-old royal sanctuary at 2,150 m, with colossal stone heads of gods and kings.",
        description:
          "Built in the 1st century BC by King Antiochus I of Commagene, the summit tomb-sanctuary of Mount Nemrut is one of the world's most extraordinary archaeological monuments. The 9-metre-tall heads of Zeus, Apollo, Heracles, and Antiochus himself watch the sunrise from the eastern terrace and the sunset from the western terrace. It is a UNESCO World Heritage Site.",
        tips: "Sunrise and sunset have separate viewing terraces. Check the weather — it's frequently windy and cold even in summer.",
      },
    },
    media: [
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Mount_Nemrut.jpg/1280px-Mount_Nemrut.jpg",
        altTr: "Nemrut Dağı zirvesinde tanrı başları",
        altEn: "Stone heads of gods at the summit of Mount Nemrut",
        license: "CC BY-SA 3.0",
        photographer: "Klearchos Kapoutsis",
        attribution: "Wikimedia Commons / Klearchos Kapoutsis — CC BY-SA 3.0",
        isHero: true,
      },
    ],
    pricing: [
      { audience: "ADULT", priceTry: 200 },
      { audience: "FOREIGN_ADULT", priceTry: 500 },
    ],
  },
];

async function seedRegions() {
  for (const r of REGIONS) {
    await prisma.region.upsert({
      where: { code: r.code },
      update: { nameTr: r.nameTr, nameEn: r.nameEn },
      create: { code: r.code, nameTr: r.nameTr, nameEn: r.nameEn },
    });
  }
}

async function seedCategories() {
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { code: c.code },
      update: { slugTr: c.slugTr, slugEn: c.slugEn },
      create: { code: c.code, slugTr: c.slugTr, slugEn: c.slugEn },
    });
  }
}

async function seedProvinces() {
  const seen = new Set<string>();
  for (const a of ATTRACTIONS) {
    if (seen.has(a.province.slug)) continue;
    seen.add(a.province.slug);
    const region = await prisma.region.findUnique({ where: { code: a.province.regionCode as "MARMARA" } });
    if (!region) continue;
    await prisma.province.upsert({
      where: { slug: a.province.slug },
      update: { nameTr: a.province.nameTr, nameEn: a.province.nameEn, regionId: region.id },
      create: { slug: a.province.slug, nameTr: a.province.nameTr, nameEn: a.province.nameEn, regionId: region.id },
    });
  }
}

async function seedAttractions() {
  for (const a of ATTRACTIONS) {
    const category = await prisma.category.findUnique({ where: { code: a.category as "HISTORICAL" } });
    const region = await prisma.region.findUnique({ where: { code: a.regionCode as "MARMARA" } });
    const province = await prisma.province.findUnique({ where: { slug: a.province.slug } });
    if (!category || !region || !province) {
      throw new Error(`Missing relation for ${a.externalRef}`);
    }

    const slugTr = slugify(a.translations.tr.name);
    const slugEn = slugify(a.translations.en.name);

    const existing = await prisma.attraction.findUnique({ where: { externalRef: a.externalRef } });

    const data = {
      categoryId: category.id,
      regionId: region.id,
      provinceId: province.id,
      district: a.district ?? null,
      latitude: a.latitude,
      longitude: a.longitude,
      elevationM: a.elevationM ?? null,
      unescoStatus: a.unescoStatus ?? null,
      popularityScore: a.popularityScore,
      averageRating: a.averageRating,
      reviewCount: a.reviewCount,
      isFreeEntry: a.isFreeEntry,
      accessibility: a.accessibility ? JSON.stringify(a.accessibility) : null,
      status: "PUBLISHED" as const,
    };

    const attraction = existing
      ? await prisma.attraction.update({ where: { id: existing.id }, data })
      : await prisma.attraction.create({ data: { ...data, externalRef: a.externalRef } });

    // translations
    await prisma.attractionTranslation.upsert({
      where: { attractionId_locale: { attractionId: attraction.id, locale: "tr" } },
      update: { ...a.translations.tr, slug: slugTr },
      create: { attractionId: attraction.id, locale: "tr", ...a.translations.tr, slug: slugTr },
    });
    await prisma.attractionTranslation.upsert({
      where: { attractionId_locale: { attractionId: attraction.id, locale: "en" } },
      update: { ...a.translations.en, slug: slugEn },
      create: { attractionId: attraction.id, locale: "en", ...a.translations.en, slug: slugEn },
    });

    // media (delete + recreate for idempotency)
    await prisma.media.deleteMany({ where: { attractionId: attraction.id } });
    for (const [i, m] of a.media.entries()) {
      await prisma.media.create({
        data: {
          attractionId: attraction.id,
          type: "IMAGE",
          url: m.url,
          altTr: m.altTr,
          altEn: m.altEn,
          license: m.license,
          photographer: m.photographer ?? null,
          attribution: m.attribution ?? null,
          sortOrder: i,
          isHero: !!m.isHero,
        },
      });
    }

    // hours
    if (a.hours) {
      await prisma.operatingHours.deleteMany({ where: { attractionId: attraction.id } });
      for (const h of a.hours) {
        await prisma.operatingHours.create({
          data: {
            attractionId: attraction.id,
            season: h.season ?? "ALL_YEAR",
            dayOfWeek: h.dayOfWeek,
            openTime: h.openTime ?? null,
            closeTime: h.closeTime ?? null,
            isClosed: !!h.isClosed,
            notes: h.notes ?? null,
          },
        });
      }
    }

    // pricing
    if (a.pricing) {
      await prisma.ticketPricing.deleteMany({ where: { attractionId: attraction.id } });
      for (const p of a.pricing) {
        await prisma.ticketPricing.create({
          data: {
            attractionId: attraction.id,
            audience: p.audience as "ADULT",
            priceTry: p.priceTry,
            isFree: !!p.isFree,
          },
        });
      }
    }

    // visitor stats
    if (a.visitorStats) {
      await prisma.visitorStats.deleteMany({ where: { attractionId: attraction.id } });
      for (const s of a.visitorStats) {
        await prisma.visitorStats.create({
          data: {
            attractionId: attraction.id,
            year: s.year,
            month: s.month,
            visitorCount: s.visitorCount,
            source: "Kültür ve Turizm Bakanlığı",
          },
        });
      }
    }
  }
}

async function main() {
  logger.info({ event: "seed.start" }, "starting seed");
  await seedRegions();
  await seedCategories();
  await seedProvinces();
  await seedAttractions();
  const count = await prisma.attraction.count();
  logger.info({ event: "seed.ok", count }, "seed completed");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    logger.error({ err }, "seed failed");
    await prisma.$disconnect();
    process.exit(1);
  });
