import {
  AIAnalysisRecordDto,
  AIAnalysisStatus,
  AIExtractedDataDto,
  AIInternshipInsightsDto,
  SubmissionStatus,
  ExpectedOutcomeDto,
} from '@internos/types';
import { NotFoundError, TenantViolationError } from '@internos/shared';
import { AIProvider } from './ai-provider.interface.js';
import { defaultLLMProvider } from './llm-provider.js';
import { PromptBuilder, ExpectedOutcomeContext } from './prompt-builder.js';
import { ResponseValidator } from './response-validator.js';
import { internshipStore } from '../internship.service.js';
import { workflowStore } from '../workflow.service.js';
import { submissionStore, InMemorySubmissionVersion } from '../submission.service.js';
import { workspaceStore } from '../workspace.service.js';

export class AIStore {
  public analyses: Map<string, AIAnalysisRecordDto> = new Map(); // analysisId -> record
  public analysesBySubmission: Map<string, AIAnalysisRecordDto[]> = new Map(); // submissionId -> records
}

export const aiStore = new AIStore();

export class AIAnalysisService {
  private provider: AIProvider;

  constructor(provider: AIProvider = defaultLLMProvider) {
    this.provider = provider;
  }

  public setProvider(provider: AIProvider): void {
    this.provider = provider;
  }

  public getProvider(): AIProvider {
    return this.provider;
  }

  /**
   * MVP Input Filter: Determines whether a submission qualifies for AI analysis.
   * Only major progress submissions and monthly reports are analyzed.
   * Daily diaries and micro-logs are SKIPPED.
   */
  public isEligibleForAnalysis(submission: {
    title: string;
    stage?: string;
    taskId?: string;
    content?: string;
  }): { eligible: boolean; reason: string } {
    const title = (submission.title || '').toLowerCase();
    const stage = (submission.stage || '').toLowerCase();

    // Check workflow task frequency/type if taskId is present
    let isDailyTask = false;
    if (submission.taskId) {
      const task = workflowStore.tasks.get(submission.taskId);
      if (task) {
        const taskTitle = task.title.toLowerCase();
        if (taskTitle.includes('daily') || taskTitle.includes('diary') || taskTitle.includes('standup')) {
          isDailyTask = true;
        }
      }
    }

    // Exclude daily diary logs
    if (
      isDailyTask ||
      title.includes('daily') ||
      title.includes('diary') ||
      title.includes('standup') ||
      title.includes('micro-log')
    ) {
      return {
        eligible: false,
        reason: 'Daily diary entries and micro-logs are excluded from AI analysis by institutional policy.',
      };
    }

    // Positive check for major progress / monthly deliverables
    const isMajorProgress =
      title.includes('progress') ||
      title.includes('report') ||
      title.includes('monthly') ||
      title.includes('mid-term') ||
      title.includes('midterm') ||
      title.includes('final') ||
      title.includes('milestone') ||
      title.includes('technical') ||
      stage.includes('mid') ||
      stage.includes('final') ||
      stage.includes('milestone');

    if (isMajorProgress) {
      return { eligible: true, reason: 'Major progress deliverable / monthly report' };
    }

    // By default, if deliverable has substantive content (> 50 chars), treat as progress report
    if (submission.content && submission.content.length > 50) {
      return { eligible: true, reason: 'Substantive milestone deliverable content' };
    }

    return { eligible: false, reason: 'Deliverable does not meet major progress report criteria' };
  }

  /**
   * Main pipeline execution for a submission version.
   * Completely resilient: NEVER throws an error that interrupts the submission flow.
   */
  async analyzeSubmission(
    organizationId: string,
    submissionVersion: InMemorySubmissionVersion,
    options?: { customProvider?: AIProvider; force?: boolean }
  ): Promise<AIAnalysisRecordDto> {
    const analysisId = `ai-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const activeProvider = options?.customProvider || this.provider;

    // 1. Eligibility Check
    const eligibility = this.isEligibleForAnalysis({
      title: submissionVersion.title,
      content: submissionVersion.content,
      taskId: submissionVersion.taskId,
    });

    if (!eligibility.eligible && !options?.force) {
      const skippedRecord: AIAnalysisRecordDto = {
        id: analysisId,
        submissionId: submissionVersion.submissionId,
        submissionVersion: submissionVersion.version,
        internshipId: submissionVersion.internshipId,
        organizationId,
        analysisVersion: '1.0.0',
        promptVersion: PromptBuilder.PROMPT_VERSION,
        model: activeProvider.defaultModel,
        timestamp: now,
        status: 'SKIPPED',
        extractedInfo: {
          activities: [],
          technologies: [],
          skills: [],
          evidence: [],
          outcomes: [],
        },
        confidence: 0,
        evidenceReferences: [],
        isAdvisory: true,
        errorMessage: eligibility.reason,
      };

      this.saveAnalysis(skippedRecord);
      submissionVersion.aiAnalysisStatus = 'SKIPPED';
      return skippedRecord;
    }

    // 2. Context Gathering (Internship Expected Outcomes & POs)
    const expectedOutcomes: ExpectedOutcomeContext[] = [];
    const internship = internshipStore.details.get(submissionVersion.internshipId);
    if (internship && Array.isArray((internship as any).expectedOutcomes)) {
      for (const o of (internship as any).expectedOutcomes) {
        expectedOutcomes.push({
          code: o.code || `PO-${expectedOutcomes.length + 1}`,
          name: o.title || o.name || o.code || 'Outcome',
          description: o.description,
          bloomLevel: o.bloomLevel || 'Applying',
        });
      }
    }

    // Fallback default outcomes if none defined
    if (expectedOutcomes.length === 0) {
      expectedOutcomes.push(
        { code: 'PO-1', name: 'Engineering Knowledge Application', bloomLevel: 'Applying' },
        { code: 'PO-2', name: 'Modern Technical Tool Usage', bloomLevel: 'Analyzing' },
        { code: 'PO-3', name: 'Professional Documentation & Communication', bloomLevel: 'Evaluating' }
      );
    }

    // 3. Prompt Construction
    const systemPrompt = PromptBuilder.buildSystemPrompt();
    const userPrompt = PromptBuilder.buildUserPrompt({
      title: submissionVersion.title,
      content: submissionVersion.content,
      version: submissionVersion.version,
      files: submissionVersion.files?.map((f) => ({ originalName: f.originalName, mimeType: f.mimeType })),
      evidenceUrls: submissionVersion.evidenceUrls,
      expectedOutcomes,
    });

    // 4. Provider Execution & Validation
    const startTime = Date.now();
    try {
      const completion = await activeProvider.generateCompletion(systemPrompt, userPrompt, {
        timeoutMs: 12000,
      });

      // 5. Response Validation
      const { data, confidence } = ResponseValidator.validate(completion.rawContent);

      const evidenceRefs = data.evidence.map((e: { quote: string }) => e.quote);

      const completedRecord: AIAnalysisRecordDto = {
        id: analysisId,
        submissionId: submissionVersion.submissionId,
        submissionVersion: submissionVersion.version,
        internshipId: submissionVersion.internshipId,
        organizationId,
        analysisVersion: '1.0.0',
        promptVersion: PromptBuilder.PROMPT_VERSION,
        model: completion.model || activeProvider.defaultModel,
        timestamp: now,
        status: 'COMPLETED',
        extractedInfo: data,
        confidence,
        evidenceReferences: evidenceRefs,
        isAdvisory: true,
        durationMs: Date.now() - startTime,
      };

      this.saveAnalysis(completedRecord);
      submissionVersion.aiAnalysisStatus = 'COMPLETED';
      return completedRecord;
    } catch (err: any) {
      // 6. AI Resilience: Capture failure without disrupting submission
      const failedRecord: AIAnalysisRecordDto = {
        id: analysisId,
        submissionId: submissionVersion.submissionId,
        submissionVersion: submissionVersion.version,
        internshipId: submissionVersion.internshipId,
        organizationId,
        analysisVersion: '1.0.0',
        promptVersion: PromptBuilder.PROMPT_VERSION,
        model: activeProvider.defaultModel,
        timestamp: now,
        status: 'FAILED',
        extractedInfo: {
          activities: [],
          technologies: [],
          skills: [],
          evidence: [],
          outcomes: [],
        },
        confidence: 0,
        evidenceReferences: [],
        isAdvisory: true,
        errorMessage: err?.message || 'Unknown AI provider error during extraction',
        durationMs: Date.now() - startTime,
      };

      this.saveAnalysis(failedRecord);
      submissionVersion.aiAnalysisStatus = 'FAILED';
      return failedRecord;
    }
  }

  /**
   * Retry an AI analysis on demand for a submission.
   */
  async retryAnalysis(
    organizationId: string,
    submissionId: string,
    options?: { customProvider?: AIProvider }
  ): Promise<AIAnalysisRecordDto> {
    const sub = workspaceStore.submissions.get(submissionId);
    if (sub && sub.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant AI analysis prohibited');
    }

    const versions = submissionStore.versions.get(submissionId);
    if (!versions || versions.length === 0) {
      throw new NotFoundError('SubmissionVersion', submissionId);
    }

    // Pick latest version
    const latestVersion = versions[versions.length - 1];
    if (latestVersion.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant AI analysis prohibited');
    }

    return this.analyzeSubmission(organizationId, latestVersion, {
      customProvider: options?.customProvider,
      force: true,
    });
  }

  /**
   * Get the latest AI analysis for a submission.
   */
  getSubmissionAnalysis(organizationId: string, submissionId: string): AIAnalysisRecordDto | null {
    const list = aiStore.analysesBySubmission.get(submissionId) || [];
    if (list.length > 0 && list.some((a) => a.organizationId !== organizationId)) {
      throw new TenantViolationError('Cross-tenant AI analysis access prohibited');
    }
    const sub = workspaceStore.submissions.get(submissionId);
    if (sub && sub.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant AI analysis access prohibited');
    }
    const match = list.filter((a) => a.organizationId === organizationId);
    if (match.length === 0) return null;
    return match[match.length - 1];
  }

  /**
   * Aggregates AI insights for an internship across all analyzed submissions.
   * Strictly ADVISORY: Does NOT compute or mutate health status.
   */
  getInternshipAIInsights(organizationId: string, internshipId: string): AIInternshipInsightsDto {
    const internship = internshipStore.details.get(internshipId);
    if (!internship) {
      throw new NotFoundError('Internship', internshipId);
    }
    if (internship.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant AI insights prohibited');
    }

    // Collect all submission IDs for this internship
    const submissionIds: string[] = [];
    for (const sub of workspaceStore.submissions.values()) {
      if (sub.organizationId === organizationId && sub.internshipId === internshipId) {
        submissionIds.push(sub.id);
      }
    }

    const completedAnalyses: AIAnalysisRecordDto[] = [];
    for (const subId of submissionIds) {
      const records = aiStore.analysesBySubmission.get(subId) || [];
      const completed = records.filter((r) => r.organizationId === organizationId && r.status === 'COMPLETED');
      if (completed.length > 0) {
        completedAnalyses.push(completed[completed.length - 1]);
      }
    }

    // Aggregate technologies and skills
    const techSet = new Set<string>();
    const skillSet = new Set<string>();
    const outcomeMap = new Map<string, {
      outcomeCode: string;
      outcomeName: string;
      matchCount: number;
      partialCount: number;
      highestConfidence: number;
      evidenceQuotes: string[];
    }>();

    let totalConfidence = 0;

    for (const analysis of completedAnalyses) {
      totalConfidence += analysis.confidence;
      for (const t of analysis.extractedInfo.technologies) {
        techSet.add(t.name);
      }
      for (const s of analysis.extractedInfo.skills) {
        skillSet.add(s.name);
      }
      for (const o of analysis.extractedInfo.outcomes) {
        const existing: {
          outcomeCode: string;
          outcomeName: string;
          matchCount: number;
          partialCount: number;
          highestConfidence: number;
          evidenceQuotes: string[];
        } = outcomeMap.get(o.outcomeCode) || {
          outcomeCode: o.outcomeCode,
          outcomeName: o.outcomeName,
          matchCount: 0,
          partialCount: 0,
          highestConfidence: 0,
          evidenceQuotes: [] as string[],
        };

        if (o.matchStatus === 'MATCHED') existing.matchCount++;
        else if (o.matchStatus === 'PARTIAL') existing.partialCount++;

        if (o.confidence > existing.highestConfidence) {
          existing.highestConfidence = o.confidence;
        }

        if (o.evidenceQuote && o.evidenceQuote !== ResponseValidator.NO_EVIDENCE_PHRASE) {
          if (!existing.evidenceQuotes.includes(o.evidenceQuote)) {
            existing.evidenceQuotes.push(o.evidenceQuote);
          }
        }

        outcomeMap.set(o.outcomeCode, existing);
      }
    }

    const overallConfidence = completedAnalyses.length > 0
      ? Math.round((totalConfidence / completedAnalyses.length) * 100) / 100
      : 0;

    return {
      internshipId,
      organizationId,
      totalSubmissions: submissionIds.length,
      analyzedSubmissions: completedAnalyses.length,
      overallConfidence,
      technologiesMastered: Array.from(techSet),
      skillsDemonstrated: Array.from(skillSet),
      outcomeAttainments: Array.from(outcomeMap.values()),
      analyses: completedAnalyses,
      isAdvisory: true,
    };
  }

  private saveAnalysis(record: AIAnalysisRecordDto): void {
    aiStore.analyses.set(record.id, record);
    const existing = aiStore.analysesBySubmission.get(record.submissionId) || [];
    existing.push(record);
    aiStore.analysesBySubmission.set(record.submissionId, existing);
  }
}

export const aiAnalysisService = new AIAnalysisService();
