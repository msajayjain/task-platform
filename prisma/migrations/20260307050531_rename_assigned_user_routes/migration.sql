-- CreateIndex
CREATE INDEX "Task_createdById_assigneeId_status_isDeleted_idx" ON "Task"("createdById", "assigneeId", "status", "isDeleted");
