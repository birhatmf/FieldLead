-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'SALESPERSON');

-- CreateEnum
CREATE TYPE "SearchStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'INTERESTED', 'QUOTE_SENT', 'CUSTOMER', 'NOT_INTERESTED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'SALESPERSON',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "searches" (
    "id" UUID NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "keywords" TEXT[],
    "status" "SearchStatus" NOT NULL DEFAULT 'PENDING',
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "places" (
    "id" UUID NOT NULL,
    "googlePlaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "formattedAddress" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "googleMapsUrl" TEXT,
    "rating" DOUBLE PRECISION,
    "userRatingCount" INTEGER,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "city" TEXT,
    "district" TEXT,
    "types" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_results" (
    "id" UUID NOT NULL,
    "searchId" UUID NOT NULL,
    "placeId" UUID NOT NULL,
    "keywords" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "placeId" UUID NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "assignedTo" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_usages" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "searchId" UUID,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "estimatedCost" DECIMAL(12,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "searches_city_district_idx" ON "searches"("city", "district");

-- CreateIndex
CREATE INDEX "searches_createdAt_idx" ON "searches"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "places_googlePlaceId_key" ON "places"("googlePlaceId");

-- CreateIndex
CREATE INDEX "places_city_district_idx" ON "places"("city", "district");

-- CreateIndex
CREATE INDEX "places_category_idx" ON "places"("category");

-- CreateIndex
CREATE INDEX "places_rating_idx" ON "places"("rating");

-- CreateIndex
CREATE INDEX "search_results_placeId_idx" ON "search_results"("placeId");

-- CreateIndex
CREATE UNIQUE INDEX "search_results_searchId_placeId_key" ON "search_results"("searchId", "placeId");

-- CreateIndex
CREATE UNIQUE INDEX "leads_placeId_key" ON "leads"("placeId");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "leads_assignedTo_idx" ON "leads"("assignedTo");

-- CreateIndex
CREATE INDEX "api_usages_provider_operation_idx" ON "api_usages"("provider", "operation");

-- CreateIndex
CREATE INDEX "api_usages_createdAt_idx" ON "api_usages"("createdAt");

-- AddForeignKey
ALTER TABLE "search_results" ADD CONSTRAINT "search_results_searchId_fkey" FOREIGN KEY ("searchId") REFERENCES "searches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_results" ADD CONSTRAINT "search_results_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_usages" ADD CONSTRAINT "api_usages_searchId_fkey" FOREIGN KEY ("searchId") REFERENCES "searches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
