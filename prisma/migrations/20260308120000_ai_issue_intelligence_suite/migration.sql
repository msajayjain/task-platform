-- Add CRITICAL priority enum value
ALTER TYPE "TaskPriority" ADD VALUE IF NOT EXISTS 'CRITICAL';

-- Add AI issue intelligence columns
ALTER TABLE "Task"
  ADD COLUMN IF NOT EXISTS "aiSummary" TEXT,
  ADD COLUMN IF NOT EXISTS "category" TEXT,
  ADD COLUMN IF NOT EXISTS "aiRootCauseAnalysis" TEXT,
  ADD COLUMN IF NOT EXISTS "resolutionNotes" TEXT;

-- Index for issue category filtering/reporting
CREATE INDEX IF NOT EXISTS "Task_category_idx" ON "Task"("category");
