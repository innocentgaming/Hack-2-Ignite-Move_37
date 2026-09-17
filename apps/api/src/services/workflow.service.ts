import {
  WorkflowTemplateDto,
  CreateWorkflowTemplateDto,
  UpdateWorkflowTemplateDto,
  WorkflowTemplateStatus,
  WorkflowInstanceDto,
  WorkflowTaskDto,
  WorkflowStepType,
  WorkflowStepFrequency,
  LatePolicyType,
  UserRole,
  TaskStatus,
  WorkflowStatus,
  GrantExtensionDto,
  TaskExtensionDto,
  WorkflowStepConfig,
} from '@internos/types';
import { NotFoundError, ValidationError, TenantViolationError, ConflictError } from '@internos/shared';
import { tenantStore } from './tenant.service.js';
import { authStore } from './auth.service.js';
import { auditService } from './audit.service.js';

export interface InMemoryWorkflowTemplate {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  internshipType: string;
  status: WorkflowTemplateStatus;
  version: number;
  assignmentRules: {
    departmentIds?: string[];
    internshipTypes?: string[];
    isDefault?: boolean;
  };
  steps: WorkflowStepConfig[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InMemoryWorkflowInstance {
  id: string;
  organizationId: string;
  internshipId: string;
  templateId: string;
  templateName: string;
  templateVersion: number;
  status: WorkflowStatus;
  progress: number;
  stepsSnapshot: WorkflowStepConfig[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InMemoryWorkflowTask {
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
  originalDueDate: Date;
  currentDueDate: Date;
  isLate: boolean;
  completedAt?: Date | null;
  evaluationCriteria?: string;
  maxMarks?: number;
  latePolicy: LatePolicyType;
  extensions: TaskExtensionDto[];
  createdAt: Date;
  updatedAt: Date;
}

class WorkflowStore {
  public templates: Map<string, InMemoryWorkflowTemplate> = new Map();
  public instances: Map<string, InMemoryWorkflowInstance> = new Map();
  public tasks: Map<string, InMemoryWorkflowTask> = new Map();

  constructor() {
    this.seedDefaults();
  }

  public seedDefaults() {
    const seedDate = new Date('2026-09-01T00:00:00Z');

    // Standard Software Development Workflow Template for ORG_A
    // Pipeline: Daily Diary -> Monthly Report -> Monthly Review -> Mentor Review -> Final Evaluation
    const defaultSteps: WorkflowStepConfig[] = [
      {
        id: 'step-daily-diary',
        order: 1,
        type: WorkflowStepType.SUBMISSION,
        frequency: WorkflowStepFrequency.DAILY,
        actor: UserRole.STUDENT,
        required: true,
        deadlineDays: 1,
        title: 'Daily Work Diary',
        description: 'Record daily software development activities, blockers, and achievements',
        evaluationCriteria: 'Consistency, task relevance, and problem documentation',
        maxMarks: 10,
        latePolicy: LatePolicyType.ALLOW_NO_PENALTY,
      },
      {
        id: 'step-monthly-report',
        order: 2,
        type: WorkflowStepType.SUBMISSION,
        frequency: WorkflowStepFrequency.MONTHLY,
        actor: UserRole.STUDENT,
        required: true,
        deadlineDays: 30,
        title: 'Monthly Progress Report',
        description: 'Comprehensive milestone synthesis report with repository links and deliverables',
        evaluationCriteria: 'Technical depth, milestone completion, and documentation quality',
        maxMarks: 50,
        latePolicy: LatePolicyType.ALLOW_WITH_PENALTY,
      },
      {
        id: 'step-monthly-review',
        order: 3,
        type: WorkflowStepType.REVIEW,
        frequency: WorkflowStepFrequency.MONTHLY,
        actor: UserRole.FACULTY,
        required: true,
        deadlineDays: 35,
        title: 'Monthly Faculty Review',
        description: 'Faculty supervisor assessment and milestone signoff',
        evaluationCriteria: 'Academic alignment and milestone progress evaluation',
        maxMarks: 50,
        latePolicy: LatePolicyType.STRICT_LOCK,
      },
      {
        id: 'step-mentor-review',
        order: 4,
        type: WorkflowStepType.REVIEW,
        frequency: WorkflowStepFrequency.MONTHLY,
        actor: UserRole.MENTOR,
        required: true,
        deadlineDays: 35,
        title: 'Industry Mentor Review',
        description: 'Workplace mentor practical skill and deliverable endorsement',
        evaluationCriteria: 'Professional workplace ethics and production delivery quality',
        maxMarks: 50,
        latePolicy: LatePolicyType.STRICT_LOCK,
      },
      {
        id: 'step-final-eval',
        order: 5,
        type: WorkflowStepType.EVALUATION,
        frequency: WorkflowStepFrequency.ONE_TIME,
        actor: UserRole.FACULTY,
        required: true,
        deadlineDays: 90,
        title: 'Final Outcome-Based Evaluation',
        description: 'Comprehensive rubric-aligned final grading and institutional internship defense',
        evaluationCriteria: 'Summative rubric scores and technical outcome mastery',
        maxMarks: 100,
        latePolicy: LatePolicyType.STRICT_LOCK,
      },
    ];

    // Seed Template for Org A
    this.templates.set('tpl-org-a-default', {
      id: 'tpl-org-a-default',
      organizationId: 'org-a-id',
      name: 'Software Engineering Core Internship Workflow',
      description: 'Standard institutional blueprint: Daily Diary -> Monthly Report -> Monthly Review -> Mentor Review -> Final Evaluation',
      internshipType: 'FULL_TIME',
      status: WorkflowTemplateStatus.ACTIVE,
      version: 1,
      assignmentRules: {
        departmentIds: ['dept-a-cs'],
        internshipTypes: ['FULL_TIME'],
        isDefault: true,
      },
      steps: defaultSteps,
      createdAt: seedDate,
      updatedAt: seedDate,
    });

    // Seed Template for Org B
    this.templates.set('tpl-org-b-default', {
      id: 'tpl-org-b-default',
      organizationId: 'org-b-id',
      name: 'Mechanical & Robotics Practicum Workflow',
      description: 'Industrial training sequence for mechanical and mechatronics tracks',
      internshipType: 'FULL_TIME',
      status: WorkflowTemplateStatus.ACTIVE,
      version: 1,
      assignmentRules: {
        departmentIds: ['dept-b-me'],
        internshipTypes: ['FULL_TIME'],
        isDefault: true,
      },
      steps: defaultSteps,
      createdAt: seedDate,
      updatedAt: seedDate,
    });
  }
}

export const workflowStore = new WorkflowStore();

export class WorkflowService {
  /**
   * List all templates for caller's organization
   */
  async getTemplates(organizationId: string): Promise<WorkflowTemplateDto[]> {
    return Array.from(workflowStore.templates.values())
      .filter((t) => t.organizationId === organizationId)
      .map(this.mapTemplateToDto);
  }

  /**
   * Get template by ID with tenant boundary enforcement
   */
  async getTemplateById(organizationId: string, templateId: string): Promise<WorkflowTemplateDto> {
    const t = workflowStore.templates.get(templateId);
    if (!t) {
      throw new NotFoundError('WorkflowTemplate', templateId);
    }
    if (t.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant workflow template access prohibited');
    }
    return this.mapTemplateToDto(t);
  }

  /**
   * Create Workflow Template (Admin)
   */
  async createTemplate(
    organizationId: string,
    dto: CreateWorkflowTemplateDto,
    creatorId?: string
  ): Promise<WorkflowTemplateDto> {
    if (!dto.name || !dto.name.trim()) {
      throw new ValidationError('Workflow template name is required');
    }
    if (!dto.steps || dto.steps.length === 0) {
      throw new ValidationError('At least one workflow step is required in template');
    }

    const id = `tpl-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();

    const normalizedSteps = dto.steps.map((s, idx) => ({
      ...s,
      id: s.id || `step-${idx + 1}-${Date.now().toString(36)}`,
      order: idx + 1,
    }));

    const newTemplate: InMemoryWorkflowTemplate = {
      id,
      organizationId,
      name: dto.name.trim(),
      description: dto.description,
      internshipType: dto.internshipType || 'FULL_TIME',
      status: WorkflowTemplateStatus.ACTIVE,
      version: 1,
      assignmentRules: dto.assignmentRules || { isDefault: false },
      steps: normalizedSteps,
      createdAt: now,
      updatedAt: now,
    };

    workflowStore.templates.set(id, newTemplate);

    await auditService.log({
      organizationId,
      userId: creatorId,
      action: 'WORKFLOW_TEMPLATE_CREATE',
      entity: 'WorkflowTemplate',
      entityId: id,
      details: { name: newTemplate.name, version: 1, stepCount: newTemplate.steps.length },
    });

    return this.mapTemplateToDto(newTemplate);
  }

  /**
   * Update Workflow Template with Automatic Version Incrementing
   * Modifying steps or core parameters bumps the template version.
   * Existing internship workflow instances retain their historical version and snapshot.
   */
  async updateTemplate(
    organizationId: string,
    templateId: string,
    dto: UpdateWorkflowTemplateDto,
    updaterId?: string
  ): Promise<WorkflowTemplateDto> {
    const t = workflowStore.templates.get(templateId);
    if (!t) {
      throw new NotFoundError('WorkflowTemplate', templateId);
    }
    if (t.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant workflow template modification prohibited');
    }

    const previousVersion = t.version;
    let versionIncremented = false;

    if (dto.name !== undefined) t.name = dto.name.trim();
    if (dto.description !== undefined) t.description = dto.description;
    if (dto.internshipType !== undefined) t.internshipType = dto.internshipType;
    if (dto.status !== undefined) t.status = dto.status;
    if (dto.assignmentRules !== undefined) t.assignmentRules = dto.assignmentRules;

    if (dto.steps !== undefined) {
      if (dto.steps.length === 0) {
        throw new ValidationError('A workflow template must have at least one step');
      }
      t.steps = dto.steps.map((s, idx) => ({
        ...s,
        id: s.id || `step-${idx + 1}-${Date.now().toString(36)}`,
        order: idx + 1,
      }));
      // Increment version whenever steps change
      t.version += 1;
      versionIncremented = true;
    }

    t.updatedAt = new Date();

    await auditService.log({
      organizationId,
      userId: updaterId,
      action: 'WORKFLOW_TEMPLATE_UPDATE',
      entity: 'WorkflowTemplate',
      entityId: templateId,
      details: {
        previousVersion,
        newVersion: t.version,
        versionIncremented,
        name: t.name,
      },
    });

    return this.mapTemplateToDto(t);
  }

  /**
   * Deterministic Automatic Assignment Engine (Zero AI)
   * Evaluates internship attributes:
   * 1. Department ID match
   * 2. Internship Type match
   * 3. Default fallback
   * Snapshots chosen template version into WorkflowInstance and generates discrete tasks.
   */
  async assignWorkflowToInternship(
    organizationId: string,
    internshipId: string,
    assignedByUserId?: string
  ): Promise<WorkflowInstanceDto> {
    const internship = tenantStore.internships.get(internshipId);
    if (!internship) {
      throw new NotFoundError('Internship', internshipId);
    }
    if (internship.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant workflow assignment prohibited');
    }

    // Check if instance already exists
    const existingInstance = Array.from(workflowStore.instances.values()).find(
      (inst) => inst.internshipId === internshipId && inst.organizationId === organizationId
    );
    if (existingInstance) {
      return this.getInstanceById(organizationId, existingInstance.id);
    }

    // Find student department
    const studentUser = authStore.users.get(internship.studentId);
    const studentDeptId = studentUser?.departmentId;

    // Get all active templates for organization
    const activeTemplates = Array.from(workflowStore.templates.values()).filter(
      (t) => t.organizationId === organizationId && t.status === WorkflowTemplateStatus.ACTIVE
    );

    if (activeTemplates.length === 0) {
      throw new ConflictError('No active workflow template available for this institution');
    }

    // Deterministic Priority:
    // 1. Matches both Department and Internship Type
    // 2. Matches Department
    // 3. Matches Internship Type
    // 4. Marked as Default
    // 5. First active template
    let matchedTemplate = activeTemplates.find(
      (t) =>
        t.assignmentRules.departmentIds?.includes(studentDeptId || '') &&
        (t.internshipType === internship.type || t.assignmentRules.internshipTypes?.includes(internship.type))
    );

    if (!matchedTemplate && studentDeptId) {
      matchedTemplate = activeTemplates.find((t) => t.assignmentRules.departmentIds?.includes(studentDeptId));
    }

    if (!matchedTemplate) {
      matchedTemplate = activeTemplates.find(
        (t) => t.internshipType === internship.type || t.assignmentRules.internshipTypes?.includes(internship.type)
      );
    }

    if (!matchedTemplate) {
      matchedTemplate = activeTemplates.find((t) => t.assignmentRules.isDefault);
    }

    if (!matchedTemplate) {
      matchedTemplate = activeTemplates[0];
    }

    // Create Immutable Workflow Snapshot
    const instanceId = `wf-inst-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();

    const newInstance: InMemoryWorkflowInstance = {
      id: instanceId,
      organizationId,
      internshipId,
      templateId: matchedTemplate.id,
      templateName: matchedTemplate.name,
      templateVersion: matchedTemplate.version, // Frozen historical version
      status: WorkflowStatus.IN_PROGRESS,
      progress: 0,
      stepsSnapshot: JSON.parse(JSON.stringify(matchedTemplate.steps)), // Deep copy snapshot
      createdAt: now,
      updatedAt: now,
    };

    workflowStore.instances.set(instanceId, newInstance);

    // Generate Discrete Tasks from Snapshot Steps
    const startDate = new Date(internship.startDate);
    const generatedTasks: InMemoryWorkflowTask[] = [];

    for (const step of newInstance.stepsSnapshot) {
      const taskId = `task-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const deadlineDays = typeof step.deadlineDays === 'number' && !isNaN(step.deadlineDays)
        ? step.deadlineDays
        : ((step as any).relativeDueWeek ? (step as any).relativeDueWeek * 7 : 14);
      const dueDate = new Date(startDate.getTime() + deadlineDays * 24 * 3600 * 1000);

      const newTask: InMemoryWorkflowTask = {
        id: taskId,
        instanceId,
        organizationId,
        stepId: step.id,
        title: step.title,
        stage: `Step ${step.order}: ${step.title}`,
        type: step.type || (step as any).stepType || WorkflowStepType.SUBMISSION,
        status: TaskStatus.PENDING,
        assigneeRole: step.actor || (step as any).assigneeRole || UserRole.STUDENT,
        required: step.required !== undefined ? step.required : true,
        originalDueDate: dueDate,
        currentDueDate: dueDate,
        isLate: false,
        completedAt: null,
        evaluationCriteria: step.evaluationCriteria,
        maxMarks: step.maxMarks,
        latePolicy: step.latePolicy || LatePolicyType.ALLOW_NO_PENALTY,
        extensions: [],
        createdAt: now,
        updatedAt: now,
      };

      workflowStore.tasks.set(taskId, newTask);
      generatedTasks.push(newTask);
    }

    await auditService.log({
      organizationId,
      userId: assignedByUserId,
      action: 'WORKFLOW_ASSIGNED',
      entity: 'WorkflowInstance',
      entityId: instanceId,
      details: {
        internshipId,
        templateId: matchedTemplate.id,
        templateVersion: matchedTemplate.version,
        taskCount: generatedTasks.length,
      },
    });

    return this.mapInstanceToDto(newInstance, generatedTasks);
  }

  /**
   * Get Workflow Instance by Internship ID
   */
  async getInstanceByInternshipId(organizationId: string, internshipId: string): Promise<WorkflowInstanceDto> {
    const inst = Array.from(workflowStore.instances.values()).find(
      (i) => i.internshipId === internshipId && i.organizationId === organizationId
    );
    if (!inst) {
      // Auto-assign if not existing
      return this.assignWorkflowToInternship(organizationId, internshipId);
    }
    const tasks = Array.from(workflowStore.tasks.values()).filter((t) => t.instanceId === inst.id);
    return this.mapInstanceToDto(inst, tasks);
  }

  /**
   * Get Workflow Instance by Instance ID
   */
  async getInstanceById(organizationId: string, instanceId: string): Promise<WorkflowInstanceDto> {
    const inst = workflowStore.instances.get(instanceId);
    if (!inst) {
      throw new NotFoundError('WorkflowInstance', instanceId);
    }
    if (inst.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant workflow instance access prohibited');
    }
    const tasks = Array.from(workflowStore.tasks.values()).filter((t) => t.instanceId === inst.id);
    return this.mapInstanceToDto(inst, tasks);
  }

  /**
   * Get Tasks for user/role in organization
   */
  async getTasks(organizationId: string, role?: UserRole): Promise<WorkflowTaskDto[]> {
    let list = Array.from(workflowStore.tasks.values()).filter((t) => t.organizationId === organizationId);
    if (role) {
      list = list.filter((t) => t.assigneeRole === role);
    }
    return list.map(this.mapTaskToDto);
  }

  /**
   * Submit Work for Task (Records lateness without modifying original due date)
   */
  async submitTask(
    organizationId: string,
    taskId: string,
    userId?: string
  ): Promise<WorkflowTaskDto> {
    const task = workflowStore.tasks.get(taskId);
    if (!task) {
      throw new NotFoundError('WorkflowTask', taskId);
    }
    if (task.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant task submission prohibited');
    }

    const now = new Date();
    // Check if submission is late against currentDueDate (original or extended)
    const isLate = now.getTime() > task.currentDueDate.getTime();

    task.status = TaskStatus.SUBMITTED;
    task.completedAt = now;
    task.isLate = isLate;
    task.updatedAt = now;

    // Update instance progress
    const allInstanceTasks = Array.from(workflowStore.tasks.values()).filter((t) => t.instanceId === task.instanceId);
    const completedCount = allInstanceTasks.filter(
      (t) => t.status === TaskStatus.SUBMITTED || t.status === TaskStatus.APPROVED
    ).length;
    const progress = Math.round((completedCount / allInstanceTasks.length) * 100);

    const instance = workflowStore.instances.get(task.instanceId);
    if (instance) {
      instance.progress = progress;
      if (progress === 100) instance.status = WorkflowStatus.COMPLETED;
    }

    await auditService.log({
      organizationId,
      userId,
      action: 'TASK_SUBMITTED',
      entity: 'WorkflowTask',
      entityId: taskId,
      details: {
        isLate,
        originalDueDate: task.originalDueDate.toISOString(),
        currentDueDate: task.currentDueDate.toISOString(),
        submittedAt: now.toISOString(),
      },
    });

    return this.mapTaskToDto(task);
  }

  /**
   * Grant Deadline Extension (Authorized: ADMIN, HOD, FACULTY)
   * Original due date is strictly preserved; new deadline and audit reason appended.
   */
  async grantExtension(
    organizationId: string,
    taskId: string,
    dto: GrantExtensionDto,
    authorizedUserId: string
  ): Promise<WorkflowTaskDto> {
    const task = workflowStore.tasks.get(taskId);
    if (!task) {
      throw new NotFoundError('WorkflowTask', taskId);
    }
    if (task.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant task extension prohibited');
    }

    const newDate = new Date(dto.newDeadline);
    if (isNaN(newDate.getTime())) {
      throw new ValidationError('Invalid new deadline date format');
    }
    if (newDate.getTime() <= task.currentDueDate.getTime()) {
      throw new ValidationError('New deadline must be later than the existing deadline');
    }

    const authUser = authStore.users.get(authorizedUserId);
    const extensionEntry: TaskExtensionDto = {
      id: `ext-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      originalDeadline: task.currentDueDate.toISOString(),
      newDeadline: newDate.toISOString(),
      reason: dto.reason || 'Authorized administrative extension granted',
      authorizedUserId,
      authorizedUserEmail: authUser?.email,
      authorizedUserName: authUser ? `${authUser.firstName} ${authUser.lastName}`.trim() : undefined,
      authorizedAt: new Date().toISOString(),
    };

    task.extensions.push(extensionEntry);
    task.currentDueDate = newDate;
    task.updatedAt = new Date();

    await auditService.log({
      organizationId,
      userId: authorizedUserId,
      action: 'TASK_EXTENDED',
      entity: 'WorkflowTask',
      entityId: taskId,
      details: {
        taskId,
        originalDueDate: task.originalDueDate.toISOString(),
        newDeadline: newDate.toISOString(),
        reason: dto.reason,
        extensionCount: task.extensions.length,
      },
    });

    return this.mapTaskToDto(task);
  }

  // ==========================================
  // Private Helper Mappers
  // ==========================================

  private mapTemplateToDto(t: InMemoryWorkflowTemplate): WorkflowTemplateDto {
    return {
      id: t.id,
      organizationId: t.organizationId,
      name: t.name,
      description: t.description,
      internshipType: t.internshipType,
      status: t.status,
      version: t.version,
      assignmentRules: t.assignmentRules,
      steps: t.steps,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }

  private mapTaskToDto(task: InMemoryWorkflowTask): WorkflowTaskDto {
    return {
      id: task.id,
      instanceId: task.instanceId,
      organizationId: task.organizationId,
      stepId: task.stepId,
      title: task.title,
      stage: task.stage,
      type: task.type,
      status: task.status,
      assigneeRole: task.assigneeRole,
      required: task.required,
      originalDueDate: task.originalDueDate.toISOString(),
      currentDueDate: task.currentDueDate.toISOString(),
      isLate: task.isLate,
      completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      evaluationCriteria: task.evaluationCriteria,
      maxMarks: task.maxMarks,
      latePolicy: task.latePolicy,
      extensions: task.extensions,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }

  private mapInstanceToDto(inst: InMemoryWorkflowInstance, tasks: InMemoryWorkflowTask[]): WorkflowInstanceDto {
    return {
      id: inst.id,
      organizationId: inst.organizationId,
      internshipId: inst.internshipId,
      templateId: inst.templateId,
      templateName: inst.templateName,
      templateVersion: inst.templateVersion,
      status: inst.status,
      progress: inst.progress,
      stepsSnapshot: inst.stepsSnapshot,
      tasks: tasks.map(this.mapTaskToDto),
      createdAt: inst.createdAt.toISOString(),
      updatedAt: inst.updatedAt.toISOString(),
    };
  }
}

export const workflowService = new WorkflowService();
