/**
 * InternOS Shared Types & Enums
 * Source of truth for domain models, role boundaries, and API contracts.
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  HOD = 'HOD',
  FACULTY = 'FACULTY',
  STUDENT = 'STUDENT',
  MENTOR = 'MENTOR',
  // Backwards compatibility legacy aliases
  SUPER_ADMIN = 'SUPER_ADMIN',
  INSTITUTION_ADMIN = 'INSTITUTION_ADMIN',
  FACULTY_SUPERVISOR = 'FACULTY_SUPERVISOR',
  INDUSTRY_MENTOR = 'INDUSTRY_MENTOR',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  SUSPENDED = 'SUSPENDED',
}

export enum InternshipStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  READY_FOR_COMPLETION = 'READY_FOR_COMPLETION',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  CANCELLED = 'CANCELLED',
  TERMINATED = 'TERMINATED',
}

export enum WorkflowStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum SubmissionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ACCEPTED = 'ACCEPTED',
  REVISION_NEEDED = 'REVISION_NEEDED',
}

export enum NotificationType {
  SYSTEM = 'SYSTEM',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  SUBMISSION_RECEIVED = 'SUBMISSION_RECEIVED',
  REVIEW_SUBMITTED = 'REVIEW_SUBMITTED',
  EVALUATION_POSTED = 'EVALUATION_POSTED',
  DEADLINE_WARNING = 'DEADLINE_WARNING',
  // Phase 10 In-App Notification Events
  INTERNSHIP_SUBMITTED = 'INTERNSHIP_SUBMITTED',
  INTERNSHIP_APPROVED = 'INTERNSHIP_APPROVED',
  INTERNSHIP_REJECTED = 'INTERNSHIP_REJECTED',
  MENTOR_ASSIGNED = 'MENTOR_ASSIGNED',
  TASK_DUE = 'TASK_DUE',
  TASK_OVERDUE = 'TASK_OVERDUE',
  REVISION_REQUESTED = 'REVISION_REQUESTED',
  REVIEW_COMPLETED = 'REVIEW_COMPLETED',
  EVALUATION_COMPLETED = 'EVALUATION_COMPLETED',
  COMPLETION_CONFIRMED = 'COMPLETION_CONFIRMED',
  TERMINATION_REQUESTED = 'TERMINATION_REQUESTED',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ACCESS_DENIED = 'ACCESS_DENIED',
  EXPORT = 'EXPORT',
  // Phase 2 actions
  USER_CREATE = 'USER_CREATE',
  USER_ROLE_CHANGE = 'USER_ROLE_CHANGE',
  USER_ACTIVATED = 'USER_ACTIVATED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  USER_INVITATION_SENT = 'USER_INVITATION_SENT',
  DEPARTMENT_CREATE = 'DEPARTMENT_CREATE',
  DEPARTMENT_UPDATE = 'DEPARTMENT_UPDATE',
  DEPARTMENT_ASSIGN_HOD = 'DEPARTMENT_ASSIGN_HOD',
  DEPARTMENT_ASSIGNMENT = 'DEPARTMENT_ASSIGNMENT',
  STUDENTS_CSV_IMPORT = 'STUDENTS_CSV_IMPORT',
  INSTITUTION_PROFILE_UPDATE = 'INSTITUTION_PROFILE_UPDATE',
  // Phase 3 actions
  WORKFLOW_TEMPLATE_CREATE = 'WORKFLOW_TEMPLATE_CREATE',
  WORKFLOW_TEMPLATE_UPDATE = 'WORKFLOW_TEMPLATE_UPDATE',
  WORKFLOW_ASSIGNED = 'WORKFLOW_ASSIGNED',
  TASK_SUBMITTED = 'TASK_SUBMITTED',
  TASK_EXTENDED = 'TASK_EXTENDED',
  // Phase 4 actions
  INTERNSHIP_CREATE = 'INTERNSHIP_CREATE',
  INTERNSHIP_UPDATE = 'INTERNSHIP_UPDATE',
  INTERNSHIP_SUBMIT = 'INTERNSHIP_SUBMIT',
  INTERNSHIP_APPROVE = 'INTERNSHIP_APPROVE',
  INTERNSHIP_REJECT = 'INTERNSHIP_REJECT',
  INTERNSHIP_STATE_TRANSITION = 'INTERNSHIP_STATE_TRANSITION',
  INTERNSHIP_ASSIGN_FACULTY = 'INTERNSHIP_ASSIGN_FACULTY',
  INTERNSHIP_ASSIGN_MENTOR = 'INTERNSHIP_ASSIGN_MENTOR',
  OUTCOME_VERSION_CREATE = 'OUTCOME_VERSION_CREATE',
  COMPANY_CREATE = 'COMPANY_CREATE',
  // Phase 5 actions
  SUBMISSION_CREATE = 'SUBMISSION_CREATE',
  SUBMISSION_REVIEW = 'SUBMISSION_REVIEW',
  MENTOR_CONCERN_RAISE = 'MENTOR_CONCERN_RAISE',
  EVALUATION_CREATE = 'EVALUATION_CREATE',
  TERMINATION_REQUEST = 'TERMINATION_REQUEST',
  // Phase 6 actions
  SUBMISSION_REVISION = 'SUBMISSION_REVISION',
  SUBMISSION_FILE_UPLOAD = 'SUBMISSION_FILE_UPLOAD',
  // Phase 8 actions
  FINAL_EVALUATION_CREATE = 'FINAL_EVALUATION_CREATE',
  FINAL_EVALUATION_UPDATE = 'FINAL_EVALUATION_UPDATE',
  COMPLETION_CONFIRM = 'COMPLETION_CONFIRM',
  INTERNSHIP_COMPLETE = 'INTERNSHIP_COMPLETE',
  TERMINATION_DECIDE = 'TERMINATION_DECIDE',
  INTERNSHIP_TERMINATE = 'INTERNSHIP_TERMINATE',
  INTERNSHIP_CANCEL = 'INTERNSHIP_CANCEL',
  // Phase 10 standard actions
  ROLE_CHANGE = 'ROLE_CHANGE',
  WORKFLOW_CHANGE = 'WORKFLOW_CHANGE',
  INTERNSHIP_APPROVAL = 'INTERNSHIP_APPROVAL',
  MENTOR_ASSIGNMENT = 'MENTOR_ASSIGNMENT',
  OUTCOME_MODIFICATION = 'OUTCOME_MODIFICATION',
  EVALUATION = 'EVALUATION',
  TERMINATION = 'TERMINATION',
  COMPLETION = 'COMPLETION',
}

// ==========================================
// Authentication & Security Context
// ==========================================

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  organizationId: string;
  organizationCode?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  organizationId: string;
  organizationName?: string;
  organizationCode?: string;
  departmentId?: string | null;
}

export interface TenantContext {
  organizationId: string;
  organizationCode: string;
  organizationName: string;
}

// ==========================================
// Standard API Envelope
// ==========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
  path?: string;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  requestId?: string;
  timestamp?: string;
}

// ==========================================
// DTOs
// ==========================================

export interface LoginRequestDto {
  email: string;
  password: string;
  organizationCode?: string;
}

export interface LoginResponseData {
  token: string;
  user: AuthenticatedUser;
  organization: {
    id: string;
    name: string;
    code: string;
  };
}

export interface InviteUserDto {
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  departmentId?: string;
}

export interface InviteResponseData {
  userId: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  activationToken: string;
  activationUrl: string;
  organizationId: string;
}

export interface ActivateAccountDto {
  token: string;
  password: string;
}

export interface LogoutResponseData {
  message: string;
  timestamp: string;
}

export interface CreateInternshipDto {
  title: string;
  companyName?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  studentId?: string;
}

export interface InternshipDto {
  id: string;
  organizationId: string;
  title: string;
  type: string;
  status: InternshipStatus;
  startDate?: string;
  endDate?: string;
  studentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentEntityRelation {
  entityType: 'INTERNSHIP' | 'SUBMISSION' | 'EVALUATION' | 'INSTITUTION' | string;
  entityId: string;
}

export interface DocumentDto {
  id: string;
  organizationId: string;
  ownerId?: string;
  uploaderId?: string;
  name: string;
  filename?: string;
  mimeType: string;
  size: number;
  storageKey: string;
  url: string;
  isPrivate?: boolean;
  entityRelation?: DocumentEntityRelation;
  uploadedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// Phase 2: Department Administration DTOs
// ==========================================

export interface DepartmentDto {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  hodId?: string | null;
  hodName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentDto {
  code: string;
  name: string;
  description?: string;
  hodId?: string;
}

export interface UpdateDepartmentDto {
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  hodId?: string | null;
}

export interface DepartmentStatsDto {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  totalStudents: number;
  totalFaculty: number;
  activeInternships: number;
  hodName?: string | null;
}

// ==========================================
// Phase 2: User Administration DTOs
// ==========================================

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  departmentId?: string;
  studentId?: string; // Roll number if student
  designation?: string;
  password?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  departmentId?: string | null;
  status?: UserStatus;
}

export interface UserFilterQuery {
  role?: UserRole;
  departmentId?: string;
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UserListItemDto {
  id: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  departmentId?: string | null;
  departmentName?: string | null;
  studentRollNumber?: string | null;
  createdAt: string;
}

// ==========================================
// Phase 2: CSV Student Import Pipeline DTOs
// ==========================================

export interface CSVStudentRow {
  studentId: string; // Roll Number
  name: string;
  email: string;
  department: string; // Department Code or Name
}

export interface CSVValidationError {
  rowNumber: number;
  field: string;
  value: string;
  message: string;
}

export interface CSVImportPreviewResponse {
  previewToken: string;
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  validRows: (CSVStudentRow & { parsedFirstName: string; parsedLastName: string; departmentId: string })[];
  invalidRows: { rowNumber: number; raw: Record<string, string>; errors: string[] }[];
  duplicates: { rowNumber: number; studentId: string; email: string; reason: string }[];
  errorReport: string[];
}

export interface CSVImportConfirmRequest {
  previewToken: string;
  defaultPassword?: string;
}

export interface CSVImportResult {
  importedCount: number;
  failedCount: number;
  organizationId: string;
  importedUserIds: string[];
  message: string;
}

// ==========================================
// Phase 2: Dashboard Metrics DTOs
// ==========================================

export interface AdminDashboardMetrics {
  totalStudents: number;
  totalFaculty: number;
  totalMentors: number;
  totalHods: number;
  totalDepartments: number;
  activeInternships: number;
  pendingApprovals: number;
  departmentBreakdown: {
    departmentId: string;
    departmentName: string;
    departmentCode: string;
    studentCount: number;
    facultyCount: number;
    internshipCount: number;
  }[];
}

export interface HODDashboardMetrics {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  totalStudents: number;
  totalFaculty: number;
  activeInternships: number;
  pendingApprovals: number;
  unassignedInternsCount: number;
}

export interface FacultyDashboardMetrics {
  facultyId: string;
  supervisedStudentsCount: number;
  activeInternshipsCount: number;
  pendingReviewsCount: number;
  completedEvaluationsCount: number;
}

export interface MentorDashboardMetrics {
  mentorId: string;
  companyName: string;
  mentoredInternsCount: number;
  pendingReviewsCount: number;
  completedEvaluationsCount: number;
}

// ==========================================
// Phase 2: Institution Profile & Settings DTOs
// ==========================================

export interface InstitutionProfileDto {
  id: string;
  code: string;
  name: string;
  domain?: string;
  settings?: InstitutionSettingsDto;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateInstitutionDto {
  name?: string;
  domain?: string;
  settings?: Partial<InstitutionSettingsDto>;
}

export interface InstitutionSettingsDto {
  academicYear?: string;
  semester?: string;
  defaultInternshipDurationWeeks?: number;
  requireMentorEvaluation?: boolean;
  allowStudentSelfRegistration?: boolean;
  contactEmail?: string;
}

// ==========================================
// Phase 2: Audit Log DTOs
// ==========================================

export interface AuditLogDto {
  id: string;
  organizationId: string;
  userId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  actorName?: string | null;
  action: AuditAction | string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
  timestamp?: string;
}

export interface AuditLogQuery {
  action?: AuditAction | string;
  entity?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface SystemHealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptimeSeconds: number;
  version: string;
  timestamp: string;
  environment: string;
  services: {
    database: 'connected' | 'disconnected' | 'mocked';
    storage: 'operational' | 'error';
    memoryUsageMB: number;
  };
}

// ==========================================
// AI Service Abstraction Layer (Phase 0 Spec)
// NOTE: Architecture defines interface contracts only.
// NO AI functionality or external LLM execution in Phase 0.
// ==========================================

export interface AISubmissionAnalysisRequest {
  submissionId: string;
  submissionContent: string;
  documentUrls?: string[];
  rubricCriteria?: {
    criteriaId: string;
    description: string;
    maxScore: number;
  }[];
}

export interface AISubmissionAnalysisResponse {
  submissionId: string;
  scoreEstimate?: number;
  suggestedFeedback: string;
  rubricAlignment: {
    criteriaId: string;
    suggestedScore: number;
    rationale: string;
  }[];
  confidenceScore: number;
  generatedAt: string;
}

export interface AIOutcomeMappingRequest {
  internshipDescription: string;
  departmentCode: string;
  availableOutcomeCodes: string[];
}

export interface AIOutcomeMappingResponse {
  mappedOutcomes: {
    outcomeCode: string;
    relevanceScore: number;
    reasoning: string;
  }[];
}

export interface AIRubricRecommendationRequest {
  outcomeCode: string;
  bloomsLevel: string;
  courseContext: string;
}

export interface AIRubricRecommendationResponse {
  levels: {
    level: string;
    score: number;
    description: string;
  }[];
}

export interface IAIService {
  analyzeSubmission(request: AISubmissionAnalysisRequest): Promise<AISubmissionAnalysisResponse>;
  mapInternshipOutcomes(request: AIOutcomeMappingRequest): Promise<AIOutcomeMappingResponse>;
  recommendRubric(request: AIRubricRecommendationRequest): Promise<AIRubricRecommendationResponse>;
}

// ==========================================
// Phase 3: Configurable Workflow Engine DTOs
// ==========================================

export enum WorkflowStepType {
  SUBMISSION = 'SUBMISSION',
  REVIEW = 'REVIEW',
  EVALUATION = 'EVALUATION',
  APPROVAL = 'APPROVAL',
}

export enum WorkflowStepFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM',
  ONE_TIME = 'ONE_TIME',
}

export enum LatePolicyType {
  ALLOW_WITH_PENALTY = 'ALLOW_WITH_PENALTY',
  ALLOW_NO_PENALTY = 'ALLOW_NO_PENALTY',
  STRICT_LOCK = 'STRICT_LOCK',
}

export enum WorkflowTemplateStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export interface WorkflowStepConfig {
  id: string;
  order: number;
  type: WorkflowStepType;
  frequency: WorkflowStepFrequency;
  actor: UserRole;
  required: boolean;
  deadlineDays: number; // Offset from internship start date in days
  title: string;
  description?: string;
  evaluationCriteria?: string;
  maxMarks?: number;
  latePolicy: LatePolicyType;
}

export interface WorkflowAssignmentRules {
  departmentIds?: string[];
  internshipTypes?: string[];
  isDefault?: boolean;
}

export interface WorkflowTemplateDto {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  internshipType: string;
  status: WorkflowTemplateStatus;
  version: number;
  assignmentRules: WorkflowAssignmentRules;
  steps: WorkflowStepConfig[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowTemplateDto {
  name: string;
  description?: string;
  internshipType?: string;
  assignmentRules?: WorkflowAssignmentRules;
  steps: WorkflowStepConfig[];
}

export interface UpdateWorkflowTemplateDto {
  name?: string;
  description?: string;
  internshipType?: string;
  status?: WorkflowTemplateStatus;
  assignmentRules?: WorkflowAssignmentRules;
  steps?: WorkflowStepConfig[];
}

export interface TaskExtensionDto {
  id: string;
  originalDeadline: string;
  newDeadline: string;
  reason: string;
  authorizedUserId: string;
  authorizedUserEmail?: string;
  authorizedUserName?: string;
  authorizedAt: string;
}

export interface WorkflowTaskDto {
  id: string;
  instanceId: string;
  organizationId: string;
  stepId: string;
  title: string;
  stage: string;
  type: WorkflowStepType;
  status: TaskStatus;
  assigneeRole: UserRole;
  required: boolean;
  originalDueDate: string;
  currentDueDate: string;
  isLate: boolean;
  completedAt?: string | null;
  description?: string;
  evaluationCriteria?: string;
  maxMarks?: number;
  latePolicy: LatePolicyType;
  extensions: TaskExtensionDto[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowInstanceDto {
  id: string;
  organizationId: string;
  internshipId: string;
  templateId: string;
  templateName: string;
  templateVersion: number;
  status: WorkflowStatus;
  progress: number;
  stepsSnapshot: WorkflowStepConfig[];
  tasks: WorkflowTaskDto[];
  createdAt: string;
  updatedAt: string;
}

export interface GrantExtensionDto {
  newDeadline: string;
  reason: string;
}

// ==========================================
// Phase 4: Internship Registration & Lifecycle DTOs
// ==========================================

export enum OutcomeStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  MET = 'MET',
  UNMET = 'UNMET',
}

export interface ExpectedOutcomeDto {
  id: string;
  title: string;
  description?: string;
  expectedEvidence: string;
  status: OutcomeStatus;
}

export interface OutcomeVersionDto {
  id: string;
  internshipId: string;
  versionNumber: number;
  outcomes: ExpectedOutcomeDto[];
  updatedBy: string;
  createdAt: string;
}

export interface CompanyDto {
  id: string;
  organizationId: string;
  name: string;
  industry: string;
  website?: string;
  address?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyDto {
  name: string;
  industry: string;
  website?: string;
  address?: string;
}

export interface MentorInfoDto {
  name: string;
  email: string;
  designation: string;
  phone?: string;
}

export interface InternshipRegistrationDto {
  title: string;
  role?: string;
  internshipType: string;
  startDate: string;
  endDate: string;
  description?: string;
  companyId?: string;
  newCompany?: CreateCompanyDto;
  mentor?: MentorInfoDto;
  expectedOutcomes: Array<{
    title: string;
    description?: string;
    expectedEvidence: string;
  }>;
}

export interface UpdateInternshipRegistrationDto {
  title?: string;
  role?: string;
  internshipType?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  companyId?: string;
  mentor?: MentorInfoDto;
  expectedOutcomes?: ExpectedOutcomeDto[];
}

export interface StateTransitionDto {
  targetStatus: InternshipStatus;
  reason?: string;
}

export interface ApprovalDecisionDto {
  approved: boolean;
  reason?: string;
}

export interface AssignFacultyDto {
  facultyId: string;
  facultyName?: string;
}

export interface AssignMentorDto {
  mentorId?: string;
  mentorName: string;
  mentorEmail: string;
  designation: string;
  phone?: string;
}

export interface InternshipDetailsDto {
  id: string;
  organizationId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  studentRollNumber?: string;
  departmentId?: string;
  departmentName?: string;
  companyId: string;
  company: CompanyDto;
  title: string;
  role?: string;
  type: string;
  status: InternshipStatus;
  startDate: string;
  endDate: string;
  description?: string;
  rejectionReason?: string;
  facultyId?: string | null;
  facultyName?: string | null;
  mentorId?: string | null;
  mentor?: MentorInfoDto | null;
  expectedOutcomes: ExpectedOutcomeDto[];
  outcomeVersion: number;
  workflowInstanceId?: string | null;
  stateHistory: Array<{
    fromStatus: InternshipStatus;
    toStatus: InternshipStatus;
    changedBy: string;
    changedAt: string;
    reason?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Phase 5 & 6: Submission System, Versioning & Reviews DTOs
// ==========================================

export interface SubmissionFileDto {
  id: string;
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  storageKey: string;
  url?: string;
  uploadedAt: string;
}

export interface ReviewCriteriaScore {
  criteriaId?: string;
  name: string;
  score: number;
  maxScore: number;
  comments?: string;
}

export interface SubmissionVersionDto {
  id: string;
  version: number;
  submissionId: string;
  studentId: string;
  internshipId: string;
  taskId: string;
  title: string;
  content: string;
  documentUrl?: string;
  evidenceUrls?: string[];
  files: SubmissionFileDto[];
  submittedAt: string;
  dueAt?: string;
  isLate: boolean;
  revisionReason?: string;
  status: SubmissionStatus;
  review?: ReviewDto;
  aiAnalysis?: AISubmissionAnalysisResponse | null;
  aiAnalysisStatus?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
}

export interface SubmissionTimelineEventDto {
  id: string;
  timestamp: string;
  type: 'SUBMITTED' | 'REVISED' | 'REVIEWED' | 'REVISION_REQUESTED' | 'APPROVED';
  version: number;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  title: string;
  description: string;
  data?: Record<string, any>;
}

export interface SubmissionDto {
  id: string;
  organizationId: string;
  internshipId: string;
  taskId: string;
  taskTitle?: string;
  taskType?: WorkflowStepType;
  studentId: string;
  studentName?: string;
  currentVersion: number;
  title: string;
  content: string;
  documentUrl?: string;
  evidenceUrls?: string[];
  files: SubmissionFileDto[];
  status: SubmissionStatus;
  submittedAt: string;
  dueAt?: string;
  isLate: boolean;
  revisionReason?: string;
  updatedAt: string;
  reviews: ReviewDto[];
  versions: SubmissionVersionDto[];
}

export interface CreateSubmissionDto {
  internshipId: string;
  taskId: string;
  title: string;
  content: string;
  documentUrl?: string;
  evidenceUrls?: string[];
  files?: SubmissionFileDto[];
  fileIds?: string[];
  isRevision?: boolean;
  revisionReason?: string;
}

export interface ReviewDto {
  id: string;
  organizationId: string;
  submissionId: string;
  version?: number;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: UserRole;
  feedback: string;
  score?: number;
  criteria?: ReviewCriteriaScore[];
  status: 'ACCEPTED' | 'CHANGES_REQUESTED';
  revisionReason?: string;
  createdAt: string;
}

export interface CreateReviewDto {
  submissionId: string;
  version?: number;
  feedback: string;
  score?: number;
  criteria?: ReviewCriteriaScore[];
  requestRevision?: boolean;
  revisionReason?: string;
}

export interface EvaluationDto {
  id: string;
  organizationId: string;
  internshipId: string;
  evaluatorId: string;
  evaluatorName: string;
  evaluatorRole: UserRole;
  rubricScores: Record<string, number>;
  finalGrade: string;
  comments?: string;
  createdAt: string;
}

export interface CreateEvaluationDto {
  internshipId: string;
  rubricScores: Record<string, number>;
  finalGrade: string;
  comments?: string;
}

export interface MentorConcernDto {
  id: string;
  organizationId: string;
  internshipId: string;
  mentorId: string;
  mentorName: string;
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'RESOLVED' | 'ACTIONED';
  requestedAt: string;
}

export interface CreateMentorConcernDto {
  internshipId: string;
  reason: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface AttentionCaseDto {
  id: string;
  internshipId: string;
  studentId: string;
  studentName: string;
  companyName: string;
  reason: string;
  severity: 'warning' | 'critical';
  timestamp: string;
}

export interface StudentWorkspaceDto {
  internship: InternshipDetailsDto | null;
  workflowProgress: number;
  currentTasks: WorkflowTaskDto[];
  upcomingDeadlines: WorkflowTaskDto[];
  overdueTasks: WorkflowTaskDto[];
  recentFeedback: ReviewDto[];
  outcomeProgress: {
    total: number;
    planned: number;
    inProgress: number;
    met: number;
  };
  submissions: SubmissionDto[];
}

export interface FacultyWorkspaceDto {
  assignedInternships: InternshipDetailsDto[];
  activeInternshipsCount: number;
  overdueTasks: WorkflowTaskDto[];
  pendingReviews: SubmissionDto[];
  attentionCases: AttentionCaseDto[];
  recentActivity: Array<{
    id: string;
    action: string;
    description: string;
    timestamp: string;
  }>;
}

export interface HODWorkspaceDto {
  departmentInternships: InternshipDetailsDto[];
  facultyAssignments: Array<{
    facultyId: string;
    facultyName: string;
    assignedCount: number;
    activeCount: number;
  }>;
  departmentMonitoring: {
    totalStudents: number;
    totalInternships: number;
    active: number;
    pendingApproval: number;
    completed: number;
    overdueCount: number;
  };
  attentionCases: AttentionCaseDto[];
}

export interface MentorWorkspaceDto {
  assignedStudents: Array<{
    studentId: string;
    studentName: string;
    studentEmail: string;
    internshipId: string;
    title: string;
    status: InternshipStatus;
  }>;
  assignedInternships: InternshipDetailsDto[];
  pendingReviews: SubmissionDto[];
  recentSubmissions: SubmissionDto[];
  activeConcerns: MentorConcernDto[];
}

// ==========================================
// Phase 7: Deterministic Monitoring & Health Engine
// ==========================================

export type InternshipHealthStatus = 'ON_TRACK' | 'ATTENTION' | 'CRITICAL';

export interface HealthMetricsDto {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  pendingReviews: number;
  daysSinceLastActivity: number;
  outcomeCoveragePercentage: number;
  openConcernsCount: number;
}

export interface InternshipHealthResultDto {
  status: InternshipHealthStatus;
  reasons: string[];
  calculatedAt: string;
  metrics: HealthMetricsDto;
}

export interface HealthThresholdConfigDto {
  maxOverdueDaysAttention: number; // default: 1 day
  maxOverdueDaysCritical: number; // default: 7 days
  maxPendingReviewDaysAttention: number; // default: 3 days
  maxPendingReviewDaysCritical: number; // default: 7 days
  maxInactiveDaysAttention: number; // default: 14 days
  maxInactiveDaysCritical: number; // default: 30 days
  multipleOverdueThreshold: number; // default: 2 overdue tasks
}

export interface MonitoringOverviewDto {
  totalInternships: number;
  active: number;
  completed: number;
  onTrack: number;
  attention: number;
  critical: number;
  overdue: number;
  pendingReviews: number;
}

export interface MonitoredInternshipDto {
  internship: InternshipDetailsDto;
  studentName: string;
  studentEmail: string;
  departmentId?: string;
  departmentName?: string;
  companyName: string;
  facultyName?: string;
  mentorName?: string;
  health: InternshipHealthResultDto;
}

export interface AttentionQueueItemDto {
  id: string;
  internshipId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  departmentName?: string;
  companyName: string;
  facultyName?: string;
  mentorName?: string;
  status: InternshipHealthStatus; // ATTENTION or CRITICAL
  reasons: string[];
  metrics: HealthMetricsDto;
  calculatedAt: string;
}

export interface LifecycleTimelineEventDto {
  id: string;
  type:
    | 'REGISTRATION'
    | 'APPROVAL'
    | 'ASSIGNMENT'
    | 'WORKFLOW_TASK'
    | 'SUBMISSION'
    | 'REVIEW'
    | 'REVISION'
    | 'OUTCOME_CHANGE'
    | 'CONCERN'
    | 'EVALUATION'
    | 'STATE_TRANSITION';
  title: string;
  description: string;
  actorName: string;
  actorRole?: string;
  timestamp: string;
  severity?: 'info' | 'warning' | 'critical' | 'success';
  metadata?: Record<string, any>;
}

// ==========================================
// Phase 8: Final Evaluation and Completion Engine
// ==========================================

export interface EvaluationCriteriaScore {
  id: string;
  name: string;
  maxMarks: number;
  awardedMarks: number;
  comment?: string;
}

export interface FinalEvaluationDto {
  id: string;
  organizationId: string;
  internshipId: string;
  evaluatorId: string;
  evaluatorName: string;
  evaluatorRole: UserRole;
  criteria: EvaluationCriteriaScore[];
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  finalGrade: string;
  comments: string;
  finalRemarks: string;
  submittedAt: string;
  updatedAt: string;
}

export interface CreateFinalEvaluationDto {
  internshipId: string;
  criteria: EvaluationCriteriaScore[];
  comments?: string;
  finalRemarks?: string;
}

export interface UpdateFinalEvaluationDto {
  criteria?: EvaluationCriteriaScore[];
  comments?: string;
  finalRemarks?: string;
}

export interface CompletionChecklistDto {
  eligible: boolean;
  missingConditions: string[];
  checks: {
    requiredSubmissionsCompleted: boolean;
    requiredReviewsCompleted: boolean;
    finalEvaluationCompleted: boolean;
    facultyConfirmationCompleted: boolean;
  };
  details: {
    requiredTasksTotal: number;
    requiredTasksSubmitted: number;
    pendingReviewsTotal: number;
    hasFinalEvaluation: boolean;
    hasFacultyConfirmation: boolean;
  };
}

export interface FacultyConfirmationDto {
  id: string;
  organizationId: string;
  internshipId: string;
  facultyId: string;
  facultyName: string;
  facultyNotes: string;
  academicRecommendation: 'APPROVED_FOR_CREDITS' | 'SATISFACTORY' | 'COMMENDED';
  creditsAwarded?: number;
  confirmedAt: string;
}

export interface CreateFacultyConfirmationDto {
  internshipId: string;
  facultyNotes: string;
  academicRecommendation?: 'APPROVED_FOR_CREDITS' | 'SATISFACTORY' | 'COMMENDED';
  creditsAwarded?: number;
}

export interface CompletedInternshipDossierDto {
  internship: InternshipDetailsDto;
  company: {
    name: string;
    industry: string;
    website?: string;
    address?: string;
  };
  student: {
    id: string;
    name: string;
    email: string;
    departmentName?: string;
  };
  role: string;
  dates: {
    startDate: string;
    endDate: string;
    completedAt: string;
  };
  finalEvaluation: FinalEvaluationDto;
  facultyConfirmation: FacultyConfirmationDto;
  outcomes: ExpectedOutcomeDto[];
  evidenceFiles: SubmissionFileDto[];
  milestoneFeedback: ReviewDto[];
  timeline: LifecycleTimelineEventDto[];
}

export interface TerminationDecisionDto {
  internshipId: string;
  approved: boolean;
  reason: string;
}

export interface CancelInternshipDto {
  internshipId: string;
  reason: string;
}

// ==========================================
// Phase 9: Evidence-Based AI Intelligence DTOs
// ==========================================

export type AIAnalysisStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

export interface AIActivityDto {
  description: string;
  evidenceRef: string;
}

export interface AITechnologyDto {
  name: string;
  category: string;
  evidenceRef: string;
}

export interface AISkillDto {
  name: string;
  category: string;
  evidenceRef: string;
}

export interface AIEvidenceDto {
  quote: string;
  context: string;
  confidence: number;
}

export interface AIOutcomeMatchDto {
  outcomeCode: string;
  outcomeName: string;
  matchStatus: 'MATCHED' | 'PARTIAL' | 'NO_EVIDENCE';
  confidence: number;
  evidenceQuote: string;
  analysis: string;
}

export interface AIExtractedDataDto {
  activities: AIActivityDto[];
  technologies: AITechnologyDto[];
  skills: AISkillDto[];
  evidence: AIEvidenceDto[];
  outcomes: AIOutcomeMatchDto[];
}

export interface AIAnalysisRecordDto {
  id: string;
  submissionId: string;
  submissionVersion: number;
  internshipId: string;
  organizationId: string;
  analysisVersion: string;
  promptVersion: string;
  model: string;
  timestamp: string;
  status: AIAnalysisStatus;
  extractedInfo: AIExtractedDataDto;
  confidence: number;
  evidenceReferences: string[];
  isAdvisory: true;
  errorMessage?: string;
  durationMs?: number;
}

export interface AIInternshipInsightsDto {
  internshipId: string;
  organizationId: string;
  totalSubmissions: number;
  analyzedSubmissions: number;
  overallConfidence: number;
  technologiesMastered: string[];
  skillsDemonstrated: string[];
  outcomeAttainments: {
    outcomeCode: string;
    outcomeName: string;
    matchCount: number;
    partialCount: number;
    highestConfidence: number;
    evidenceQuotes: string[];
  }[];
  analyses: AIAnalysisRecordDto[];
  isAdvisory: true;
}

// ==========================================
// Phase 10: In-App Notifications & Document DTOs
// ==========================================

export interface NotificationDto {
  id: string;
  organizationId: string;
  recipientId: string;
  userId?: string;
  type: NotificationType | string;
  title: string;
  message: string;
  relatedEntity?: {
    entityType: string;
    entityId: string;
  };
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface CreateNotificationDto {
  recipientId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  relatedEntity?: {
    entityType: string;
    entityId: string;
  };
  entityType?: string;
  entityId?: string;
}

export interface NotificationQuery {
  isRead?: boolean;
  type?: string;
  page?: number;
  limit?: number;
}

export interface UnreadCountDto {
  unreadCount: number;
}

export interface UploadDocumentDto {
  filename: string;
  mimeType: string;
  size: number;
  isPrivate?: boolean;
  entityType?: string;
  entityId?: string;
  internshipId?: string;
  submissionId?: string;
}

export interface DocumentQuery {
  entityType?: string;
  entityId?: string;
  internshipId?: string;
  submissionId?: string;
  ownerId?: string;
  page?: number;
  limit?: number;
}

// ==========================================
// Phase 11: Institutional & Department Analytics DTOs
// ==========================================

export interface AnalyticsOverviewDto {
  totalInternships: number;
  activeInternships: number;
  completedInternships: number;
  overdueSubmissions: number;
  completionRate: number;
  reviewCompletionRate: number;
  reviewsCompleted: number;
  reviewsPending: number;
  outcomeEvidenceCoverageRate: number;
  averageEvaluationScore: number;
}

export interface DepartmentCompletionDto {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  totalInternships: number;
  activeInternships: number;
  completedInternships: number;
  completionRate: number;
  studentCount: number;
}

export interface CompanyDistributionDto {
  companyId: string;
  companyName: string;
  industry: string;
  internshipCount: number;
  percentage: number;
}

export interface MentorWorkloadDto {
  mentorId: string;
  mentorName: string;
  mentorEmail: string;
  companyName: string;
  assignedInternships: number;
  activeInternships: number;
  completedInternships: number;
  pendingReviews: number;
}

export interface SubmissionComplianceDto {
  totalSubmissions: number;
  onTimeSubmissions: number;
  lateSubmissions: number;
  overdueSubmissions: number;
  onTimeRate: number;
}

export interface EvaluationGradeBandDto {
  grade: string;
  count: number;
  percentage: number;
}

export interface EvaluationScoreBandDto {
  band: string;
  count: number;
  percentage: number;
}

export interface EvaluationDistributionDto {
  totalEvaluations: number;
  averageScore: number;
  gradeBreakdown: EvaluationGradeBandDto[];
  scoreBands: EvaluationScoreBandDto[];
}

export interface OutcomeCoverageItemDto {
  outcomeId: string;
  code: string;
  name: string;
  evidenceCount: number;
  hasEvidence: boolean;
}

export interface OutcomeEvidenceCoverageDto {
  totalOutcomes: number;
  coveredOutcomes: number;
  coveragePercentage: number;
  outcomes: OutcomeCoverageItemDto[];
}

export interface InternshipStatusDistributionDto {
  status: string;
  count: number;
  percentage: number;
}

export interface AnalyticsFilterQuery {
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  format?: 'json' | 'csv' | string;
}

export interface InstitutionalAnalyticsDto {
  organizationId: string;
  generatedAt: string;
  filtersApplied: {
    departmentId?: string;
    startDate?: string;
    endDate?: string;
  };
  overview: AnalyticsOverviewDto;
  statusDistribution: InternshipStatusDistributionDto[];
  departmentCompletion: DepartmentCompletionDto[];
  companyDistribution: CompanyDistributionDto[];
  mentorWorkload: MentorWorkloadDto[];
  submissionCompliance: SubmissionComplianceDto;
  evaluationDistribution: EvaluationDistributionDto;
  outcomeEvidenceCoverage: OutcomeEvidenceCoverageDto;
}

// ==========================================
// Phase 1 Redesign: Milestones, Tasks & Workspaces
// ==========================================

export enum EvidenceType {
  GITHUB_REPO = 'GITHUB_REPO',
  GITHUB_PR = 'GITHUB_PR',
  DEPLOYMENT_URL = 'DEPLOYMENT_URL',
  DOCUMENT = 'DOCUMENT',
  SCREENSHOT = 'SCREENSHOT',
  VIDEO = 'VIDEO',
  REPORT = 'REPORT',
  OTHER = 'OTHER',
}

export interface MilestoneDto {
  id: string;
  organizationId: string;
  internshipId: string;
  title: string;
  description: string;
  order: number;
  startDate?: string;
  dueDate: string;
  progress: number;
  completedTasks: number;
  totalTasks: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  studentId?: string;
  studentName?: string;
  internshipTitle?: string;
  companyName?: string;
  tasks?: TaskItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMilestoneDto {
  internshipId: string;
  title: string;
  description: string;
  startDate?: string;
  dueDate: string;
  order?: number;
}

export interface UpdateMilestoneDto {
  title?: string;
  description?: string;
  startDate?: string;
  dueDate?: string;
  progress?: number;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface TaskItemDto {
  id: string;
  organizationId: string;
  internshipId: string;
  internshipTitle?: string;
  studentId?: string;
  studentName?: string;
  companyName?: string;
  milestoneId?: string;
  milestoneTitle?: string;
  title: string;
  description: string;
  instructions?: string;
  stage?: string;
  status: TaskStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string;
  learningOutcomeId?: string;
  learningOutcomeCode?: string;
  learningOutcomeName?: string;
  expectedEvidence: string;
  requiredEvidence?: string;
  submissionCount?: number;
  submissionStatus?: string;
  latestSubmission?: {
    id: string;
    title: string;
    status: SubmissionStatus;
    submittedAt: string;
    mentorFeedback?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  internshipId: string;
  milestoneId?: string;
  title: string;
  description: string;
  instructions?: string;
  dueDate: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  learningOutcomeId?: string;
  expectedEvidence?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  instructions?: string;
  dueDate?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: TaskStatus;
  milestoneId?: string;
  learningOutcomeId?: string;
  expectedEvidence?: string;
}

export interface StudentEvidenceItem {
  type: EvidenceType;
  url?: string;
  name?: string;
  notes?: string;
}

export interface StudentOutcomeViewDto {
  outcomeId: string;
  id?: string;
  code: string;
  name: string;
  title?: string;
  description?: string;
  studentId?: string;
  studentName?: string;
  internshipId?: string;
  internshipTitle?: string;
  companyName?: string;
  expectedEvidence: string[];
  studentEvidence: Array<{
    submissionId: string;
    taskTitle: string;
    evidenceType: string;
    evidenceUrl?: string;
    fileName?: string;
    submittedAt: string;
    status: SubmissionStatus;
  }>;
  evidence?: Array<{
    id?: string;
    title?: string;
    url?: string;
    submittedAt?: string;
  }>;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'EVIDENCE_SUBMITTED' | 'VERIFIED' | 'REVISION_NEEDED';
  mentorAssessment?: string;
  feedback?: string;
}

export interface StudentDashboardDto {
  studentName: string;
  internship: {
    id: string;
    title: string;
    companyName: string;
    companyWebsite?: string;
    startDate: string;
    endDate: string;
    status: InternshipStatus;
    workMode: string;
    departmentName?: string;
    mentorName?: string;
    mentorEmail?: string;
    overallProgress: number;
  } | null;
  activeMilestone: {
    id: string;
    title: string;
    dueDate: string;
    progress: number;
    completedTasks: number;
    totalTasks: number;
  } | null;
  upcomingTasks: TaskItemDto[];
  recentSubmissions: Array<{
    id: string;
    taskId: string;
    taskTitle: string;
    submissionTitle: string;
    submittedAt: string;
    status: SubmissionStatus;
    mentorFeedback?: string;
  }>;
  outcomesSummary: {
    total: number;
    progressing: number;
    verified: number;
    requiresEvidence: number;
  };
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    type: 'TASK' | 'MILESTONE';
    dueDate: string;
    daysRemaining: number;
  }>;
}

export interface MentorDashboardDto {
  mentorName: string;
  companyName: string;
  stats: {
    assignedInterns: number;
    activeInternships: number;
    pendingReviews: number;
    tasksAwaitingReview: number;
    outcomesRequiringEvidence: number;
  };
  recentSubmissions: Array<{
    id: string;
    internshipId: string;
    studentName: string;
    studentEmail: string;
    taskTitle: string;
    submissionTitle: string;
    submittedAt: string;
    status: SubmissionStatus;
  }>;
  interns: Array<{
    studentId: string;
    internshipId: string;
    studentName: string;
    department: string;
    internshipTitle: string;
    companyName?: string;
    startDate?: string;
    endDate?: string;
    progress: number;
    currentMilestoneTitle?: string;
    pendingSubmissionsCount: number;
    status: InternshipStatus;
  }>;
}

export interface MentorInternDetailDto {
  student: {
    id: string;
    name: string;
    email: string;
    department: string;
    college: string;
    rollNumber: string;
    batchYear: number;
  };
  internship: {
    id: string;
    title: string;
    companyName: string;
    startDate: string;
    endDate: string;
    status: InternshipStatus;
    workMode: string;
    progress: number;
  };
  milestones: MilestoneDto[];
  tasks: TaskItemDto[];
  submissions: SubmissionDto[];
  outcomes: StudentOutcomeViewDto[];
  feedbacks: Array<{
    id: string;
    submissionId?: string;
    taskTitle?: string;
    feedback: string;
    rating?: number;
    strengths?: string;
    improvements?: string;
    nextAction?: string;
    createdAt: string;
  }>;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    uploadedAt: string;
  }>;
}

export interface MentorReviewSubmissionDto {
  status: 'ACCEPTED' | 'NEEDS_REVISION';
  feedback: string;
  score?: number;
  rating?: number;
  strengths?: string;
  improvements?: string;
  nextAction?: string;
  revisionReason?: string;
}



