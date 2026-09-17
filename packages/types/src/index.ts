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
  UNDER_REVIEW = 'UNDER_REVIEW',
  COMPLETED = 'COMPLETED',
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
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ACCESS_DENIED = 'ACCESS_DENIED',
  EXPORT = 'EXPORT',
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

export interface DocumentDto {
  id: string;
  organizationId: string;
  name: string;
  mimeType: string;
  size: number;
  storageKey: string;
  url: string;
  uploaderId?: string;
  createdAt?: string;
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

