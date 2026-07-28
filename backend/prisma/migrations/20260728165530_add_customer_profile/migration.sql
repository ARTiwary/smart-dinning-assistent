/*
  Warnings:

  - You are about to drop the column `complementaryIds` on the `MenuItem` table. All the data in the column will be lost.

*/
-- AlterTable
CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE "MenuItem" DROP COLUMN "complementaryIds",
ADD COLUMN     "embedding" vector(384);

-- CreateTable
CREATE TABLE "CustomerProfile" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastVisit" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_phone_key" ON "CustomerProfile"("phone");
