-- AlterTable
ALTER TABLE "places" ADD COLUMN     "country" TEXT;

-- AlterTable
ALTER TABLE "searches" ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'TR';
