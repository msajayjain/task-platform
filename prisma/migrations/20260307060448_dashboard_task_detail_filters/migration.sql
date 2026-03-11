-- CreateTable
CREATE TABLE "TaskDecline" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "declinedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskDecline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskDecline_taskId_idx" ON "TaskDecline"("taskId");

-- CreateIndex
CREATE INDEX "TaskDecline_declinedById_idx" ON "TaskDecline"("declinedById");

-- CreateIndex
CREATE INDEX "TaskDecline_createdAt_idx" ON "TaskDecline"("createdAt");

-- AddForeignKey
ALTER TABLE "TaskDecline" ADD CONSTRAINT "TaskDecline_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDecline" ADD CONSTRAINT "TaskDecline_declinedById_fkey" FOREIGN KEY ("declinedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
