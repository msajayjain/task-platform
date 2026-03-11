-- AlterTable
ALTER TABLE "User" ADD COLUMN     "teamId" TEXT,
ADD COLUMN     "teamName" TEXT;

-- CreateTable
CREATE TABLE "UIConfiguration" (
    "id" TEXT NOT NULL,
    "screenName" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UIConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UIConfiguration_screenName_idx" ON "UIConfiguration"("screenName");

-- CreateIndex
CREATE INDEX "UIConfiguration_screenName_displayOrder_idx" ON "UIConfiguration"("screenName", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "UIConfiguration_screenName_fieldName_key" ON "UIConfiguration"("screenName", "fieldName");

-- CreateIndex
CREATE INDEX "User_teamId_idx" ON "User"("teamId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
