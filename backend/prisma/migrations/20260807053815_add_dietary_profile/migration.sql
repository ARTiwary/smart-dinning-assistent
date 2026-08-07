-- CreateTable
CREATE TABLE "DietaryProfile" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "conditions" TEXT[],
    "dietType" TEXT,
    "allergies" TEXT[],
    "preferences" TEXT[],
    "avoidIngredients" TEXT[],
    "calories" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DietaryProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DietaryProfile_phone_key" ON "DietaryProfile"("phone");
