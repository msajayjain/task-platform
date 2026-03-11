-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TaskStatus" ADD VALUE 'COMPLETED_PENDING_APPROVAL';
ALTER TYPE "TaskStatus" ADD VALUE 'CLOSED';

-- DropIndex
DROP INDEX "Task_createdById_status_isDeleted_idx";

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Task_isArchived_idx" ON "Task"("isArchived");

-- CreateIndex
CREATE INDEX "Task_closedAt_idx" ON "Task"("closedAt");

-- CreateIndex
CREATE INDEX "Task_createdById_assigneeId_status_isDeleted_isArchived_idx" ON "Task"("createdById", "assigneeId", "status", "isDeleted", "isArchived");

-- CreateIndex
CREATE INDEX "Task_createdById_status_isDeleted_isArchived_idx" ON "Task"("createdById", "status", "isDeleted", "isArchived");

-- CreateIndex
CREATE INDEX "Task_assigneeId_status_isDeleted_isArchived_idx" ON "Task"("assigneeId", "status", "isDeleted", "isArchived");
