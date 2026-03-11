/**
 * File Description:
 * This file implements packages/types/src/index.ts.
 *
 * Purpose:
 * Provide module-specific logic used by the project runtime.
 *
 * Key Responsibilities:
 * - Encapsulate focused module behavior.
 * - Expose reusable exports.
 * - Support maintainable project structure.
 */

export type UserRole = 'ADMIN' | 'USER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'COMPLETED_PENDING_APPROVAL' | 'CLOSED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskPrioritySuggestion = TaskPriority | 'UNKNOWN';
export type TaskCategory = 'Bug' | 'Feature Request' | 'Performance Issue' | 'Security Issue' | 'Infrastructure' | 'UI Issue' | 'General';
export type WorkflowStageKind = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  teamId?: string | null;
  teamName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDto {
  id: string;
  title: string;
  description: string;
  aiSummary?: string | null;
  category?: TaskCategory | null;
  aiRootCauseAnalysis?: string | null;
  resolutionNotes?: string | null;
  status: TaskStatus;
  teamId?: string | null;
  teamName?: string;
  assignedTeamId?: string | null;
  assignedTeamName?: string;
  workflowStageId?: string | null;
  workflowStageLabel?: string;
  workflowStageKind?: WorkflowStageKind;
  priority: TaskPriority;
  dueDate: string | null;
  assignedUserId: string;
  assignedUserName?: string;
  createdById?: string | null;
  createdByName?: string;
  closedAt?: string | null;
  isArchived?: boolean;
  archivedAt?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MyTaskUpdateDto {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string | null;
  teamId?: string;
  assignedUserId?: string;
}

export interface TaskCommentDto {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface TaskDeclineDto {
  id: string;
  taskId: string;
  reason: string;
  comment?: string;
  declinedById: string;
  declinedByName: string;
  createdAt: string;
}

export interface TaskDetailDto extends TaskDto {
  comments: TaskCommentDto[];
  declineHistory: TaskDeclineDto[];
}

export interface AISummaryRequestDto {
  title: string;
  description: string;
}

export interface AISummaryResponseDto {
  summary: string;
  confidence: number;
}

export interface AIPrioritySuggestionRequestDto {
  title: string;
  description: string;
}

export interface AIPrioritySuggestionResponseDto {
  priority: TaskPrioritySuggestion;
  confidence: number;
  warning?: string;
}

export interface AIParseTaskRequestDto {
  text: string;
}

export interface AIParseTaskResponseDto {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string | null;
  status: 'TODO' | 'IN_PROGRESS';
  assignedUserName?: string;
  suggestedTeam?: string | null;
  confidence: number;
}

export interface AIDuplicateCheckRequestDto {
  title: string;
  description: string;
  priority?: TaskPriority;
  category?: TaskCategory;
}

export interface DuplicateIssueDto {
  id: string;
  title: string;
  description?: string;
  category?: TaskCategory | null;
  status: TaskStatus;
  priority: TaskPriority;
  createdByName?: string;
  similarity: number;
}

export interface AIDuplicateCheckResponseDto {
  hasDuplicates: boolean;
  duplicates: DuplicateIssueDto[];
}

export interface AICategorizeIssueRequestDto {
  title: string;
  description: string;
}

export interface AICategorizeIssueResponseDto {
  category: TaskCategory;
}

export interface AIRootCauseRequestDto {
  title: string;
  description: string;
  category?: string | null;
  comments?: string[];
}

export interface AIRootCauseResponseDto {
  rootCauseAnalysis: string;
  causes: string[];
  rootCauses?: string[];
  confidence: number;
}

export interface AIResolutionRequestDto {
  title: string;
  description: string;
  category?: string | null;
  rootCauseAnalysis: string;
}

export interface AIResolutionResponseDto {
  resolution: string;
  suggestions: string[];
  permanentResolution?: string[];
  confidence: number;
}

export interface AIFeatureUsageMetricDto {
  key: string;
  value: number;
}

export interface AIInsightsDto {
  totalTasks: number;
  aiSummariesGenerated: number;
  categorizedIssues: number;
  rootCauseAnalyses: number;
  resolutionNotesSaved: number;
  aiCoverageRate: number;
  resolutionAdoptionRate: number;
  categoryBreakdown: Array<{ category: string; count: number }>;
  featureUsage: AIFeatureUsageMetricDto[];
}

export interface DropdownConfigDto {
  declineReasons: string[];
}

export interface WorkflowStageDto {
  id: string;
  label: string;
  order?: number;
  kind: WorkflowStageKind;
}

export interface WorkflowConfigDto {
  workflowStages: WorkflowStageDto[];
}

export interface TeamDto {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamWorkflowDto {
  id: string;
  workflowName: string;
  isDefault: boolean;
  teamId?: string | null;
  teamName?: string | null;
  stages: Array<{
    id: string;
    label: string;
    order: number;
    kind: WorkflowStageKind;
  }>;
}

export interface PaginatedResponseDto<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  csrfToken?: string;
  user: UserDto;
}

export type UIScreenName = 'create-task' | 'task-details' | 'my-created-grid';

export interface UIFieldConfigDto {
  fieldName: string;
  displayOrder: number;
  isVisible: boolean;
}

export interface UIScreenConfigDto {
  screenName: UIScreenName;
  fields: UIFieldConfigDto[];
}

export interface TaskFilterDto {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedUserId?: string;
  sortBy?: 'dueDate' | 'priority' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
