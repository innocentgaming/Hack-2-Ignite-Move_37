/**
 * InternOS Shared Types & Enums
 * Source of truth for domain models, role boundaries, and API contracts.
 */

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  INSTITUTION_ADMIN = 'INSTITUTION_ADMIN',
  FACULTY_SUPERVISOR = 'FACULTY_SUPERVISOR',
  INDUSTRY_MENTOR = 'INDUSTRY_MENTOR',
  STUDENT = 'STUDENT',
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
