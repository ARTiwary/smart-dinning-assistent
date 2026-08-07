-- CreateTable
CREATE TABLE "MenuTranslation" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "MenuTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MenuTranslation_menuItemId_language_key" ON "MenuTranslation"("menuItemId", "language");

-- AddForeignKey
ALTER TABLE "MenuTranslation" ADD CONSTRAINT "MenuTranslation_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
