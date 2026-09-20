# FieldLead

Saha satış ekiplerinin potansiyel işletmeleri Google Places üzerinden bulmasını, lead olarak kaydetmesini ve CSV/Excel olarak dışa aktarmasını sağlayan platform.

Detaylı plan için [`docs/prod.md`](./docs/prod.md) dosyasına bakınız.

## Teknoloji Stack

| Katman   | Teknoloji                                |
| -------- | ---------------------------------------- |
| Frontend | Next.js, TypeScript, Tailwind, shadcn/ui |
| Backend  | NestJS, TypeScript                       |
| Database | PostgreSQL 16, Prisma 7                  |
| External | Google Places API (New)                  |
| Export   | CSV, XLSX                                |
| Deploy   | Docker, Docker Compose, Nginx            |

## Repository Yapısı

```
fieldlead/
├── apps/
│   ├── api/               # NestJS backend
│   └── web/               # Next.js arayüz
├── packages/
│   └── database/          # Prisma schema, migration, üretilen client
├── design-system/
│   └── fieldlead/
│       └── MASTER.md      # Tasarım sistemi (renk, tipografi, kurallar)
├── docs/
│   └── prod.md            # Proje planı
├── docker-compose.yml
├── turbo.json
└── package.json
```

> `packages/types` ve `packages/config` ilerleyen fazlarda eklenecektir.

## Gereksinimler

- Node.js >= 20
- Docker Engine + **Docker Compose plugin** (`docker compose` komutu)

> Compose plugin kurulu değilse: https://docs.docker.com/compose/install/linux/

## Kurulum

```bash
# 1. Bağımlılıklar (monorepo kökünde)
npm install

# 2. Ortam değişkenleri
cp .env.example .env
# .env içindeki GOOGLE_MAPS_API_KEY değerini doldurun

# 3. PostgreSQL (host portu 5433)
npm run db:up

# 4. Prisma client üretimi + veritabanı paketini derle
npm run build -w @fieldlead/database

# 5. İlk migration
npm run db:migrate

# 6. Arayüz + API (turbo)
npm run dev
```

- Arayüz: `http://localhost:3001`
- API: `http://localhost:3000`

## Ülke / İl / İlçe Verisi

Kök dizindeki kaynak dosyalardan üretilir:

| Kaynak            | Kod | İçerik              |
| ----------------- | --- | ------------------- |
| `il_ilce.csv`     | TR  | 81 il, 973 ilçe     |
| `il_ilce_sy.json` | SY  | 14 il, 66 ilçe      |

Üretilen dosyalar `apps/web/src/data/<ulke-kodu>-locations.json` olarak yazılır.

```bash
npm run locations:generate -w @fieldlead/web
```

**Yeni ülke eklemek için** kaynak dosyayı (CSV: `il,ilce` başlıklı; JSON:
`{ "İl": ["İlçe", ...] }`) kök dizine koyup üç yeri güncelleyin:

1. `apps/web/scripts/generate-locations.mjs` → `SOURCES` listesi
2. `apps/web/src/lib/locations.ts` → `COUNTRIES` listesi
3. `apps/api/src/common/countries.ts` → `COUNTRIES` kaydı (ad + `regionCode`)

Arama formundaki **Ülke** seçimi, il ve ilçe listelerini belirler; ülke
değişince il/ilçe sıfırlanır. Ülke adı Google sorgusuna eklenir ve
`regionCode` olarak gönderilir.

## Ekranlar

| Yol            | Açıklama                                              |
| -------------- | ----------------------------------------------------- |
| `/dashboard`   | Toplam işletme/lead, lead dağılımı, son araştırmalar  |
| `/search`      | Yeni araştırma formu (il / ilçe / anahtar kelimeler)  |
| `/search/[id]` | Sonuç tablosu: filtre, sıralama, sayfalama, seçim     |
| `/leads`       | Lead listesi, durum güncelleme, notlar                |
| `/settings`    | Google Places API kullanımı ve tahmini maliyet        |

## API Uç Noktaları

| Metot    | Yol                        | Açıklama                          |
| -------- | -------------------------- | --------------------------------- |
| `GET`    | `/`                        | Servis bilgisi                    |
| `GET`    | `/health`                  | Sağlık durumu + veritabanı        |
| `POST`   | `/searches`                | Çoklu keyword ile arama başlatır (`country` destekler) |
| `GET`    | `/searches`                | Arama geçmişi                     |
| `GET`    | `/searches/:id`            | Arama + filtrelenmiş sonuçlar     |
| `DELETE` | `/searches/:id`            | Aramayı siler                     |
| `POST`   | `/places/search`           | Google Places üzerinde arama      |
| `GET`    | `/places/:id`              | Google işletme detayı             |
| `GET`    | `/leads`                   | Lead listesi                      |
| `POST`   | `/leads`                   | Place → Lead dönüşümü (toplu)     |
| `GET`    | `/leads/:id`               | Lead detayı                       |
| `PATCH`  | `/leads/:id`               | Durum / not güncelleme            |
| `DELETE` | `/leads/:id`               | Lead siler                        |
| `GET`    | `/leads/stats`             | Durum bazında lead sayıları       |
| `GET`    | `/stats/overview`          | Panel özeti ve API kullanımı      |
| `GET`    | `/exports/leads.csv`       | Lead listesi (CSV)                |
| `GET`    | `/exports/leads.xlsx`      | Lead listesi (Excel)              |
| `GET`    | `/exports/searches/:id/csv`  | Arama sonuçları (CSV)           |
| `GET`    | `/exports/searches/:id/xlsx` | Arama sonuçları (Excel)         |

Dışa aktarma uç noktaları, ekrandaki filtreleri sorgu parametresi olarak kabul
eder (`status`, `search`, `category`, `minRating`, `minReviewCount`, `hasPhone`,
`hasWebsite`, `hasEmail`).

## E-posta Toplama

**Google Places API e-posta alanı döndürmez.** Bu yüzden e-posta adresleri,
web sitesi olan işletmelerin kendi iletişim sayfalarından çıkarılır:

- Ana sayfa + `/iletisim`, `/contact`, `/hakkimizda` gibi yollar taranır
- `[at]` / `[dot]` gibi gizlenmiş ve HTML varlık (`&#64;`) yazımları çözülür
- Görsel/varlık kaynaklı sahte adresler (ör. `logo@2x.png`) ve bilinen gürültü
  alan adları elenir
- Site alan adıyla eşleşen ve `info@`, `iletisim@`, `satis@` gibi adresler
  tercih edilir
- Daha önce bulunan adresler veritabanından tekrar kullanılır (site yeniden
  çekilmez)

Arama formundaki **"Web sitelerinden e-posta topla"** seçeneği ile kapatılabilir.
Sunucu tarafı sınırlar `.env` üzerinden ayarlanır (`EMAIL_*` değişkenleri).

> Toplanan adresler yalnızca işletmelerin alenen yayımladığı iletişim
> bilgileridir. Ticari elektronik ileti gönderimi için ilgili mevzuat (İYS /
> ETK) kapsamında izin gereklilikleri ayrıca karşılanmalıdır.

## CSV Biçimi

CSV dosyaları Türkçe Excel ile uyumlu olacak şekilde üretilir:

- Ayırıcı **noktalı virgül** (`;`) — tr-TR yerel ayarında liste ayırıcı
- Başta **UTF-8 BOM** — Türkçe karakterlerin doğru görünmesi için
- Excel çıktılarında başlık satırı kalın, otomatik filtre açık, ilk satır sabit

## Tasarım Sistemi

Arayüz, `design-system/fieldlead/MASTER.md` dosyasındaki tokenları kullanır:

- **Primary** `#2563EB` (güven mavisi), **CTA** `#059669` (anlaşma yeşili)
- **Zemin** `#F8FAFC`, **Metin** `#0F172A`, **Kenarlık** `#E4ECFC`
- **Yazı tipi** Plus Jakarta Sans
- **Stil** Flat Design: golge yerine kenarlik ile ayrim
- Ikonlar Lucide (emoji kullanılmaz), odak halkaları görünür, hareket 150–200ms

## Portlar

| Servis            | Port |
| ----------------- | ---- |
| API (NestJS)      | 3000 |
| PostgreSQL (host) | 5433 |

> Host makinede 5432'de başka bir PostgreSQL çalıştığı için Docker container'ı **5433** portuna bağlanır.

## Komutlar

| Komut                          | Açıklama                          |
| ------------------------------ | --------------------------------- |
| `npm run dev`                  | Tüm uygulamaları geliştirme modunda başlatır |
| `npm run build`                | Tüm paketleri derler              |
| `npm run lint`                 | Tüm paketlerde lint çalıştırır    |
| `npm test`                     | Tüm paketlerde testleri çalıştırır |
| `npm run db:up`                | PostgreSQL container'ını başlatır |
| `npm run db:down`              | Container'ları durdurur           |
| `npm run db:migrate`           | Prisma migration oluşturur/uygular |
| `npm run db:generate`          | Prisma client üretir              |
| `npm run db:studio`            | Prisma Studio açar                |

## Prisma Hakkında

- Şema: `packages/database/prisma/schema.prisma`
- Üretilen client: `packages/database/src/generated/prisma` (git'e girmez)
- Prisma 7 **driver adapter** kullanır; bağlantı `@prisma/adapter-pg` üzerinden kurulur.
- `DATABASE_URL`, `prisma7.config.ts` tarafından monorepo kökündeki `.env` dosyasından okunur.

## MVP Kapsamı

- Bölge seçimi (il/ilçe)
- Keyword araması
- Google Places entegrasyonu
- İşletme listesi + pagination / filtreleme / sıralama
- Duplicate kontrolü
- Lead oluşturma
- CSV / Excel export

WhatsApp, e-mail, otomasyon ve AI ilk MVP'ye dahil değildir.
