FieldLead — Saha Araştırma ve Lead Toplama Platformu

1. Proje Amacı

FieldLead, saha satış ekiplerinin ziyaret edecekleri bölgedeki potansiyel işletmeleri önceden araştırmasını, Google Places üzerinden işletmeleri bulmasını, sonuçları filtrelemesini, lead olarak kaydetmesini ve CSV/Excel olarak dışa aktarmasını sağlayan bir platformdur.

İlerleyen fazlarda:

CRM

saha ziyaretleri

WhatsApp Business entegrasyonu

e-posta otomasyonu

takip akışları

bölge planlama

AI destekli lead segmentasyonu

eklenecektir.

Temel kullanım senaryosu

İl: İzmir
İlçe: Bornova
Anahtar kelimeler:
- mobilya
- bahçe mobilyası
- ahşap mobilya

        ↓

Google Places

        ↓

İşletmeler

        ↓

Duplicate temizleme

        ↓

Lead Database

        ↓

Filtreleme

        ↓

CSV / Excel

2. Proje Fazları

Proje aşağıdaki sırayla geliştirilecektir:

FAZ 0  → Proje hazırlığı
FAZ 1  → Backend kurulumu
FAZ 2  → PostgreSQL + Prisma
FAZ 3  → Database modelleri
FAZ 4  → Google Places entegrasyonu
FAZ 5  → Arama sistemi
FAZ 6  → Frontend
FAZ 7  → Sonuç ve filtreleme
FAZ 8  → Lead yönetimi
FAZ 9  → CSV / Excel export
FAZ 10 → Authentication
FAZ 11 → Güvenlik ve API maliyet kontrolü
FAZ 12 → Docker + deployment
FAZ 13 → CRM
FAZ 14 → Saha ziyaretleri
FAZ 15 → WhatsApp Business
FAZ 16 → E-mail
FAZ 17 → Otomasyon
FAZ 18 → Harita ve bölge planlama
FAZ 19 → AI destekli analiz

MVP sınırı

İlk sürümde sadece:

Bölge seçimi

Keyword araması

Google Places entegrasyonu

Web üzerinde arama sonuçlarını görüntüleme

İşletme listesi

Pagination / filtreleme / sıralama

İşletme detayını görüntüleme

Duplicate kontrolü

Lead oluşturma

CSV export

Excel export

yapılacaktır.

WhatsApp ve e-mail ilk MVP'ye dahil edilmeyecektir.

3. Teknoloji Stack

Frontend

Next.js

TypeScript

Tailwind CSS

shadcn/ui

Backend

NestJS

TypeScript

Prisma

Database

PostgreSQL

External API

Google Places API (New)

Export

CSV

XLSX

Deployment

Docker

Docker Compose

Nginx

Linux VPS

Daha sonra

JWT

Refresh Token

RBAC

WhatsApp Business Platform / Cloud API

E-mail provider

Queue system

Redis

AI API

4. Repository Yapısı

Önerilen yapı:

fieldlead/
│
├── apps/
│   ├── web/
│   │   └── Next.js
│   │
│   └── api/
│       └── NestJS
│
├── packages/
│   ├── database/
│   ├── types/
│   └── config/
│
├── docker/
│
├── docs/
│
├── .env.example
├── docker-compose.yml
├── package.json
└── README.md

5. FAZ 0 — Proje Hazırlığı

Adım 0.1 — Repository

mkdir fieldlead
cd fieldlead
git init

GitHub repository oluştur:

fieldlead

İlk commit:

git add .
git commit -m "chore: initialize project"

Adım 0.2 — .gitignore

En az:

.env
.env.*
node_modules
dist
.next
coverage

eklenmelidir.

6. FAZ 1 — NestJS Backend

Adım 1.1

nest new apps/api

Çalıştır:

cd apps/api
npm run start:dev

Beklenen:

http://localhost:3000

Adım 1.2 — Backend Modülleri

İlk modüller:

places
searches
leads
exports

Daha sonra:

auth
users
visits
communications
automations

eklenecektir.

7. FAZ 2 — PostgreSQL

Docker Compose ile PostgreSQL oluştur.

Örnek:

services:
  postgres:
    image: postgres:16
    container_name: fieldlead-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: fieldlead
      POSTGRES_PASSWORD: fieldlead
      POSTGRES_DB: fieldlead
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:

Başlat:

docker compose up -d postgres

Kontrol:

docker ps

8. FAZ 3 — Prisma

Prisma kurulumu:

npm install prisma @prisma/client
npx prisma init

.env:

DATABASE_URL="postgresql://fieldlead:fieldlead@localhost:5432/fieldlead"

Prisma schema oluştur.

9. FAZ 4 — Database Modelleri

İlk MVP için temel modeller:

User
Search
Place
Lead
ApiUsage

9.1 Place

Önerilen alanlar:

id
googlePlaceId
name
category
formattedAddress
phone
website
googleMapsUrl
rating
userRatingCount
latitude
longitude
city
district
types
createdAt
updatedAt

Kritik kural

googlePlaceId UNIQUE

olmalıdır.

Böylece aynı işletme farklı keyword aramalarında tekrar eklenmez.

9.2 Search

id
city
district
keyword
status
resultCount
createdAt
completedAt

Örnek:

İzmir
Bornova
bahçe mobilyası
COMPLETED
153

9.3 Lead

id
placeId
status
assignedTo
notes
createdAt
updatedAt

Başlangıç status değerleri:

NEW
CONTACTED
INTERESTED
QUOTE_SENT
CUSTOMER
NOT_INTERESTED

9.4 ApiUsage

Google Places kullanımını takip etmek için:

id
provider
operation
searchId
requestCount
estimatedCost
createdAt

Bu yapı daha sonra:

Bu ay API kullanımı
Toplam çağrı
Tahmini maliyet

göstermek için kullanılacaktır.

10. FAZ 5 — Google Places API

Adım 10.1 — Google Cloud

Google Cloud üzerinde proje oluştur.

Places API (New) etkinleştir.

API Key oluştur.

.env:

GOOGLE_MAPS_API_KEY=...

Güvenlik

Google API key frontend'e gönderilmeyecektir.

Tüm Google Places çağrıları:

Frontend
   ↓
NestJS
   ↓
Google Places API

şeklinde yapılacaktır.

11. FAZ 6 — Places Service

NestJS:

apps/api/src/places/
├── places.module.ts
├── places.service.ts
├── places.controller.ts
└── dto/

Service sorumlulukları:

searchPlaces()
getPlaceDetails()
normalizePlace()

12. FAZ 7 — Bölge Araması

Kullanıcı:

İl      : İzmir
İlçe    : Bornova
Keyword : mobilya

seçtiğinde backend Google Places'a uygun sorguyu oluşturacaktır.

Akış:

Frontend
   ↓
POST /searches
   ↓
Search oluştur
   ↓
Places API
   ↓
Sonuçları normalize et
   ↓
googlePlaceId ile duplicate kontrolü
   ↓
Place kayıtlarını oluştur/güncelle
   ↓
Search tamamlandı

13. FAZ 8 — Çoklu Keyword

Kullanıcı birden fazla keyword seçebilecek:

mobilya
bahçe mobilyası
ahşap mobilya
outdoor mobilya

Backend her keyword için arama yapacaktır.

mobilya
    ↓
Places

bahçe mobilyası
    ↓
Places

ahşap mobilya
    ↓
Places

Sonuçlar:

Google Place ID
        ↓
UNIQUE
        ↓
Tekilleştirilmiş işletmeler

14. FAZ 9 — Frontend

İlk ana ekran:

┌─────────────────────────────────────────┐
│ FieldLead                               │
├─────────────────────────────────────────┤
│                                         │
│ İl                                      │
│ [ İzmir                         ▼ ]      │
│                                         │
│ İlçe                                    │
│ [ Bornova                       ▼ ]      │
│                                         │
│ Anahtar Kelimeler                       │
│ [ mobilya ] [ bahçe mobilyası ] [+]    │
│                                         │
│       [ ARAŞTIRMAYI BAŞLAT ]            │
│                                         │
└─────────────────────────────────────────┘

15. FAZ 10 — Sonuç Ekranı

Örneğin:

482 işletme bulundu

Tablo:

☐ | İşletme | Kategori | Telefon | İlçe | Puan | Web
------------------------------------------------------
☐ | ABC     | Mobilya  | 05xx    | Bornova | 4.5 | ✓
☐ | XYZ     | Mobilya  | 05xx    | Bornova | 4.2 | ✓

Üst aksiyonlar:

[ Tümünü Seç ]

[ CSV ]

[ Excel ]

[ Lead Olarak Kaydet ]

16. FAZ 11 — Filtreleme

Sonuçlar şu alanlara göre filtrelenebilir:

Kategori
Google puanı
Yorum sayısı
Telefon var/yok
Website var/yok

Örnek:

Puan >= 4.0
Telefon = Var
Website = Var

17. FAZ 12 — Lead Yönetimi

Bir Place kaydı lead'e dönüştürülebilir.

Place
  ↓
Lead

Örnek:

ABC Mobilya

Durum:
NEW

Not:
"Bahçe mobilyalarıyla ilgilenebilir."

Atanan:
Ahmet

18. FAZ 13 — CSV Export

Endpoint:

GET /exports/leads.csv

Örnek:

name,category,phone,website,address,rating
ABC Mobilya,Mobilya,05xx,...,Bornova,4.5
XYZ Mobilya,Mobilya,05xx,...,Bornova,4.2

19. FAZ 14 — Excel Export

Endpoint:

GET /exports/leads.xlsx

Dosya:

FieldLead_Izmir_Bornova.xlsx

Kolonlar:

İşletme
Kategori
Telefon
Website
Adres
İl
İlçe
Google Puanı
Yorum Sayısı
Google Maps
Latitude
Longitude

20. FAZ 15 — Arama Geçmişi

Dashboard'da:

Son Aramalar

İzmir / Bornova / mobilya
482 sonuç
19.09.2026

İzmir / Konak / restoran
713 sonuç
19.09.2026

Manisa / Yunusemre / mobilya
218 sonuç
18.09.2026

Kullanıcı eski aramayı tekrar açabilmelidir.

21. FAZ 16 — API Maliyet Kontrolü

Google Places çağrıları takip edilmelidir.

Admin panelinde:

Bu Ay

API çağrısı: 12.482
Tahmini maliyet: $XX

görülebilir.

Google'ın fiyatlandırması zamanla değişebileceği için fiyatlar kodun içine sabit yazılmamalıdır.

Bunun yerine:

provider
operation
requestCount
estimatedCost

saklanmalıdır.

22. FAZ 17 — Rate Limit

Kullanıcının yanlışlıkla çok büyük API maliyeti oluşturmasını önlemek için:

Maksimum keyword sayısı
Maksimum eşzamanlı arama
Kullanıcı başına günlük limit
Retry/backoff
Timeout

uygulanmalıdır.

Örnek başlangıç limitleri:

Max keyword: 20
Max concurrent search: 3

Bu değerler daha sonra değiştirilebilir.

23. FAZ 18 — Authentication

MVP çalıştıktan sonra:

Register
Login
Logout
Refresh Token
Forgot Password

eklenir.

Roller:

ADMIN
MANAGER
SALESPERSON

24. FAZ 19 — Güvenlik

Backend'de:

Helmet
CORS
Rate limiting
DTO validation
Input validation
Error handling
Request logging

kullanılmalıdır.

Secret değerler:

DATABASE_URL
GOOGLE_MAPS_API_KEY
JWT_SECRET
SMTP credentials
WHATSAPP credentials

.env içerisinde tutulmalı ve Git'e gönderilmemelidir.

Raw SQL kullanılıyorsa SQL injection açısından ayrıca kontrol edilmelidir.

25. FAZ 20 — API Endpointleri

Search

POST /searches
GET /searches
GET /searches/:id
DELETE /searches/:id

Places

POST /places/search
GET /places/:id

Leads

GET /leads
POST /leads
GET /leads/:id
PATCH /leads/:id
DELETE /leads/:id

Export

GET /exports/leads.csv
GET /exports/leads.xlsx

26. FAZ 21 — CRM Dashboard

Dashboard:

┌──────────────┬──────────────┬──────────────┐
│ 1.482        │ 327          │ 48           │
│ Lead         │ Contacted    │ Customer     │
└──────────────┴──────────────┴──────────────┘

Lead dağılımı:

NEW             824
CONTACTED       327
INTERESTED      183
QUOTE_SENT      100
CUSTOMER         48

27. FAZ 22 — Pazarlamacı Atama

Kullanıcılar:

Ahmet
Mehmet
Ayşe

Bir lead'e atanabilir:

ABC Mobilya

Atanan:
Ahmet

28. FAZ 23 — Saha Ziyaretleri

Yeni model:

Visit

Alanlar:

id
leadId
salespersonId
scheduledAt
completedAt
notes
result

Örnek:

ABC Mobilya
Bornova

Ziyaret:
23 Eylül 2026
14:30

[ Ziyareti Tamamla ]

29. FAZ 24 — WhatsApp

Bu özellik MVP'den sonra geliştirilecektir.

Resmi WhatsApp Business Platform / Cloud API kullanılmalıdır.

Modeller:

MessageTemplate
Message
MessageLog

Örnek template:

Merhaba {{businessName}},

{{companyName}} olarak işletmenizle ilgili
size ulaşmak istiyoruz.

İyi çalışmalar.

WhatsApp otomasyonu; kullanıcı izinleri, Meta'nın mesajlaşma kuralları ve ilgili ticari ileti mevzuatı dikkate alınarak tasarlanmalıdır.

Google Places'tan alınan işletme telefonlarının otomatik toplu mesaj gönderimi için sınırsız kullanım varsayılmamalıdır.

30. FAZ 25 — E-mail

E-mail sistemi:

Lead
 ↓
Email
 ↓
Delivered
 ↓
Opened
 ↓
Clicked
 ↓
Reply

Takip edilebilecek olaylar:

SENT
DELIVERED
OPENED
CLICKED
BOUNCED
FAILED
REPLIED

Ticari ileti ve izin gereklilikleri ayrıca ele alınmalıdır.

31. FAZ 26 — Otomasyon

İleri aşamada:

Automation

sistemi oluşturulur.

Örnek:

Lead oluşturuldu
       ↓
3 gün bekle
       ↓
Takip görevi oluştur
       ↓
Pazarlamacıya bildir

İzinli iletişim senaryolarında:

Lead
 ↓
Email
 ↓
3 gün
 ↓
Follow-up
 ↓
7 gün
 ↓
Final follow-up

32. FAZ 27 — Harita

İleride sonuçları harita üzerinde gösterebiliriz:

┌─────────────────────────────┬──────────────┐
│                             │              │
│          MAP                │    LEADS     │
│                             │              │
│       ●                     │ ABC Mob.     │
│   ●       ●                 │ XYZ Mob.     │
│         ●                   │ Garden       │
│                             │              │
└─────────────────────────────┴──────────────┘

İşletmeye tıklanınca:

İşletme adı
Telefon
Website
Puan
Adres
Lead durumu

gösterilebilir.

33. FAZ 28 — Bölge Planlama

İleride:

İzmir
 ├── Bornova
 │   ├── 482 lead
 │   └── 123 ziyaret
 │
 ├── Karşıyaka
 │   ├── 327 lead
 │   └── 87 ziyaret
 │
 └── Konak
     ├── 713 lead
     └── 191 ziyaret

gibi bölge bazlı raporlama yapılabilir.

34. FAZ 29 — AI

AI son aşamada eklenmelidir.

Örnek:

"Bornova'da bahçe mobilyası satabilecek
işletmeleri araştır."

Sistem:

Google Places
      ↓
İşletmeler
      ↓
Web sitesi / kategori bilgileri
      ↓
AI analiz
      ↓
Lead segmentasyonu

Örneğin:

High potential
Medium potential
Low potential

gibi araştırma sinyalleri üretilebilir.

AI sonucu kesin müşteri olasılığı veya doğrulanmış satış tahmini olarak sunulmamalıdır.

35. İlk MVP Ekranları

İlk sürümde:

/dashboard
/search
/search/[id]
/leads
/settings

olması yeterlidir.

Dashboard

Toplam işletme
Toplam lead
Son araştırmalar
API kullanımı

Search

İl
İlçe
Keyword
Ara

Search Results

İşletmeler
Filtre
Seç
Lead'e dönüştür
CSV
Excel

Leads

Lead listesi
Status
Atanan kişi
Notlar

36. MVP Geliştirme Sırası

Aşağıdaki sırayı takip et:

[ ] 1. GitHub repository oluştur
[ ] 2. Monorepo yapısını oluştur
[ ] 3. Next.js oluştur
[ ] 4. NestJS oluştur
[ ] 5. PostgreSQL Docker container oluştur
[ ] 6. Prisma kur
[ ] 7. Database schema oluştur
[ ] 8. Migration çalıştır
[ ] 9. Places module oluştur
[ ] 10. Google Cloud projesini oluştur
[ ] 11. Places API'yi etkinleştir
[ ] 12. API key oluştur
[ ] 13. Places Service yaz
[ ] 14. Places API aramasını test et
[ ] 15. Place modeline kayıt yap
[ ] 16. Duplicate kontrolü ekle
[ ] 17. Search modelini ekle
[ ] 18. Search endpointlerini oluştur
[ ] 19. Frontend search ekranını oluştur
[ ] 20. İl/ilçe seçimlerini oluştur
[ ] 21. Keyword input oluştur
[ ] 22. Arama akışını bağla
[ ] 23. Web sonuç ekranını oluştur
[ ] 24. Sonuç tablosunu oluştur
[ ] 25. Pagination ekle
[ ] 26. Filtreleme ve sıralama ekle
[ ] 27. İşletme detay görünümünü oluştur
[ ] 28. Google Maps bağlantısını ekle
[ ] 29. Lead modelini oluştur
[ ] 26. Lead oluşturma endpointini yaz
[ ] 27. Lead ekranını oluştur
[ ] 28. CSV export yaz
[ ] 29. Excel export yaz
[ ] 30. Search history ekle
[ ] 31. API usage tracking ekle
[ ] 32. Rate limit ekle
[ ] 33. Input validation ekle
[ ] 34. Error handling ekle
[ ] 35. API key güvenliğini kontrol et
[ ] 36. Docker Compose production yapısını hazırla
[ ] 37. VPS'e deploy et
[ ] 38. Domain bağla
[ ] 39. HTTPS aktif et
[ ] 40. MVP testlerini tamamla

37. MVP Tamamlanma Kriteri

MVP tamamlandı kabul edilmesi için şu senaryo baştan sona çalışmalıdır:

Kullanıcı
   ↓
İzmir seçer
   ↓
Bornova seçer
   ↓
"mobilya" yazar
   ↓
Ara
   ↓
Google Places
   ↓
İşletmeler gelir
   ↓
Duplicate temizlenir
   ↓
Database'e kaydedilir
   ↓
Web üzerinde sonuçlar gösterilir
   ↓
Pagination / filtre / sıralama
   ↓
İşletme detayı görüntülenir
   ↓
İşletmeler seçilir
   ↓
Lead oluşturulur
   ↓
CSV indirilebilir
   ↓
Excel indirilebilir

Bu akış çalışmadan WhatsApp, AI veya gelişmiş CRM geliştirmesine geçilmemelidir.

38. Production Sonrası Yol Haritası

MVP
 │
 ├── Authentication
 │
 ├── Team Management
 │
 ├── CRM
 │
 ├── Visit Management
 │
 ├── Map
 │
 ├── WhatsApp
 │
 ├── E-mail
 │
 ├── Automation
 │
 ├── Reporting
 │
 └── AI

Uzun vadede ürün:

Google Places
      +
Lead Database
      +
CRM
      +
Field Sales
      +
Communication
      +
Automation
      +
AI

