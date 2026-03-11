-- CreateIndex
CREATE INDEX "Task_createdById_status_isDeleted_idx" ON "Task"("createdById", "status", "isDeleted");
