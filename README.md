# FieldLead

Saha satış ekiplerinin potansiyel işletmeleri Google Places üzerinden bulmasını, lead olarak kaydetmesini ve CSV/Excel olarak dışa aktarmasını sağlayan platform.

## Başlangıç

Detaylı dokümantasyon için @docs/prod.md dosyasına bakınız.

## Kurulum

```bash
# Monorepo kök dizininde
npm install

# PostgreSQL
docker compose up -d postgres

# Prisma migration
npx prisma migrate dev --name init

# Backend
cd apps/api && npm run start:dev

# Frontend
cd apps/web && npm run dev
```

## Ortaüyku (MVP)

- Bölge seçimi (il/ilçe)
- Keyword araması
- Google Places entegrasyonu
- İşletme listesi + pagination/filtreleme
- Lead oluşturma
- CSV / Excel export
