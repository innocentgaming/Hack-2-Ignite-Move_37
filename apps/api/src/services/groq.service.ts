/**
 * Groq AI Service Abstraction
 * Provides intelligent CSV column mapping and data normalization.
 * Safe design:
 * - Deterministic dictionary fallback when GROQ_API_KEY is not set or network fails
 * - Never bypasses backend deterministic validation
 * - Never sends sensitive secrets or passwords to AI
 */

interface ColumnMappingSuggestion {
  [sourceHeader: string]: string;
}

import { StudentProgressAssessmentResult } from '@internos/types';
import { env } from '../config/env.js';

export class GroqService {
  private getApiKey(): string | undefined {
    return process.env.GROQ_API_KEY || env.GROQ_API_KEY;
  }

  /**
   * Deterministic dictionary matcher for known mentor CSV column aliases
   */
  private deterministicHeaderMatch(header: string): string | null {
    const clean = header.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (/^(firstname|fname|first|givenname)$/.test(clean)) return 'first_name';
    if (/^(lastname|lname|last|surname|familyname)$/.test(clean)) return 'last_name';
    if (/^(email|mentoremail|workemail|emailaddress|mail)$/.test(clean)) return 'email';
    if (/^(phone|phonenumber|contact|mobile|cell|contactnumber)$/.test(clean)) return 'phone';
    if (/^(company|organization|companyname|firm|org|employer)$/.test(clean)) return 'company';
    if (/^(designation|title|jobtitle|position|role)$/.test(clean)) return 'designation';
    if (/^(department|dept|deptname|branch|stream)$/.test(clean)) return 'department';
    if (/^(specialization|expertise|skills|domain|area)$/.test(clean)) return 'specialization';
    if (/^(linkedin|linkedinurl|profile|linkedinprofile)$/.test(clean)) return 'linkedin_url';

    return null;
  }

  /**
   * Suggest normalized column mappings for an array of CSV header strings
   */
  async suggestColumnMapping(headers: string[]): Promise<ColumnMappingSuggestion> {
    const result: ColumnMappingSuggestion = {};

    // 1. First run deterministic matching
    const unmapped: string[] = [];
    for (const h of headers) {
      const match = this.deterministicHeaderMatch(h);
      if (match) {
        result[h] = match;
      } else {
        unmapped.push(h);
      }
    }

    const apiKey = this.getApiKey();

    // If all matched or no API key, return deterministic result
    if (unmapped.length === 0 || !apiKey) {
      return result;
    }

    // 2. If Groq API key is present and unmapped columns remain, query Groq for suggestions
    try {
      const targetFields = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'company',
        'designation',
        'department',
        'specialization',
        'linkedin_url',
      ];

      const prompt = `Map these CSV column headers to canonical mentor fields:
Target fields: ${targetFields.join(', ')}
Headers to map: ${unmapped.join(', ')}

Respond ONLY with a JSON object where keys are the input headers and values are the matched target field or null if unknown.`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'groq/compound-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          for (const [k, v] of Object.entries(parsed)) {
            if (typeof v === 'string' && targetFields.includes(v)) {
              result[k] = v;
            }
          }
        }
      }
    } catch {
      // Non-blocking: fallback to whatever deterministic match was found
    }

    return result;
  }

  /**
   * Assess student internship progress using Groq AI with deterministic fallback
   */
  async assessStudentProgress(ctx: StudentAssessmentContext): Promise<StudentProgressAssessmentResult> {
    const apiKey = this.getApiKey();

    if (apiKey) {
      try {
        const prompt = `You are a Senior University Academic & Industry Internship Evaluator.
Assess this student's real-time internship progress and performance:
Student: ${ctx.studentName} (${ctx.departmentName})
Host Company: ${ctx.companyName}
Role: ${ctx.roleTitle}
Progress: ${ctx.progressPercentage}%
Tasks: ${ctx.completedTasks} completed out of ${ctx.totalTasks} (${ctx.overdueTasks} overdue, ${ctx.pendingTasks} pending)
Deliverables/Submissions: ${ctx.acceptedSubmissions} accepted, ${ctx.revisionsRequested} revisions requested out of ${ctx.totalSubmissions}
Mentor Rating: ${ctx.mentorRating || 'N/A'}/5
Mentor Feedback: ${ctx.mentorFeedbackSummary || 'Consistent active engagement in project sprint deliverables.'}
Learning Outcomes Verified: ${ctx.outcomesVerifiedCount} of ${ctx.totalOutcomesCount}

Provide an insightful, constructive assessment evaluating velocity, risk factors, and actionable steps.
Respond ONLY with a valid JSON object matching this schema:
{
  "velocityScore": number (integer 0-100 reflecting overall pace and quality),
  "status": "EXCELLING" | "ON_TRACK" | "NEEDS_ATTENTION" | "CRITICAL_RISK",
  "summary": "2-3 sentence executive evaluation of the student's progress and trajectory",
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "riskFactors": ["potential risk or area to improve"],
  "recommendations": {
    "forStudent": ["actionable student task 1", "actionable student task 2"],
    "forMentor": ["guidance for industry mentor 1"],
    "forInstitution": ["action item for faculty/dean 1"]
  },
  "predictedOutcome": "prediction regarding successful completion and PPO / placement readiness",
  "academicCreditReadiness": "assessment of degree credits readiness (e.g. 90% - Grade O / A+ trajectory)"
}`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'groq/compound-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
            response_format: { type: 'json_object' },
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as any;
          const raw = data.choices?.[0]?.message?.content;
          if (raw) {
            const parsed = JSON.parse(raw);
            return {
              studentId: ctx.studentId,
              studentName: ctx.studentName,
              departmentName: ctx.departmentName,
              companyName: ctx.companyName,
              roleTitle: ctx.roleTitle,
              velocityScore: Math.min(100, Math.max(0, Number(parsed.velocityScore) || 75)),
              status: ['EXCELLING', 'ON_TRACK', 'NEEDS_ATTENTION', 'CRITICAL_RISK'].includes(parsed.status)
                ? parsed.status
                : 'ON_TRACK',
              summary: parsed.summary || `${ctx.studentName} is making steady progress at ${ctx.companyName}.`,
              strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Solid engineering commitment'],
              riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [],
              recommendations: {
                forStudent: parsed.recommendations?.forStudent || ['Continue delivering scheduled milestone tasks'],
                forMentor: parsed.recommendations?.forMentor || ['Provide periodic rubric feedback'],
                forInstitution: parsed.recommendations?.forInstitution || ['Monitor mid-term milestone sign-off'],
              },
              predictedOutcome: parsed.predictedOutcome || 'On track for successful degree credit clearance.',
              academicCreditReadiness: parsed.academicCreditReadiness || `${ctx.progressPercentage}% - In Progress`,
              assessedAt: new Date().toISOString(),
              source: 'GROQ_AI',
            };
          }
        }
      } catch {
        // Fall back to deterministic evaluator below
      }
    }

    // Deterministic Rule-Based Fallback
    const taskRatio = ctx.totalTasks > 0 ? ctx.completedTasks / ctx.totalTasks : 0.5;
    const submissionRatio = ctx.totalSubmissions > 0 ? ctx.acceptedSubmissions / ctx.totalSubmissions : 0.8;
    const ratingWeight = ctx.mentorRating ? ctx.mentorRating / 5 : 0.8;
    const calculatedVelocity = Math.round((taskRatio * 0.4 + submissionRatio * 0.3 + ratingWeight * 0.3) * 100);

    let status: 'EXCELLING' | 'ON_TRACK' | 'NEEDS_ATTENTION' | 'CRITICAL_RISK' = 'ON_TRACK';
    if (calculatedVelocity >= 85 && ctx.overdueTasks === 0) status = 'EXCELLING';
    else if (calculatedVelocity < 60 || ctx.overdueTasks > 1) status = 'NEEDS_ATTENTION';
    else if (calculatedVelocity < 40) status = 'CRITICAL_RISK';

    return {
      studentId: ctx.studentId,
      studentName: ctx.studentName,
      departmentName: ctx.departmentName,
      companyName: ctx.companyName,
      roleTitle: ctx.roleTitle,
      velocityScore: calculatedVelocity,
      status,
      summary: `${ctx.studentName} is currently ${status.replace('_', ' ').toLowerCase()} at ${ctx.companyName} with ${ctx.progressPercentage}% milestone completion and ${ctx.completedTasks} approved deliverables.`,
      strengths: [
        `Achieved ${ctx.progressPercentage}% overall internship milestone completion`,
        `Successfully delivered ${ctx.completedTasks} tasks with accepted industry evidence`,
        ctx.mentorRating && ctx.mentorRating >= 4 ? 'High mentor satisfaction rating' : 'Active participation in technical sprints',
      ],
      riskFactors: [
        ctx.overdueTasks > 0 ? `${ctx.overdueTasks} deliverable(s) are overdue` : 'Ensure next milestone deliverables are pre-reviewed',
        ctx.revisionsRequested > 0 ? `${ctx.revisionsRequested} deliverable(s) requested revisions from mentor` : 'Verify all academic outcomes before final evaluation',
      ],
      recommendations: {
        forStudent: [
          'Submit remaining task evidence before the milestone target deadline',
          'Coordinate with industry mentor on upcoming staging deliverables',
        ],
        forMentor: [
          'Review pending student PRs and validate learning outcome evidence',
          'Conduct periodic 1-on-1 sprint review',
        ],
        forInstitution: [
          'Verify credit rubric mapping for end-semester dossier sign-off',
          'Track department-level outcome attainment benchmarks',
        ],
      },
      predictedOutcome: calculatedVelocity >= 80 ? 'High probability of Pre-Placement Offer (PPO) and distinction grade' : 'On course for timely academic degree credit completion',
      academicCreditReadiness: `${calculatedVelocity}% - Academic credits ready for verification`,
      assessedAt: new Date().toISOString(),
      source: 'DETERMINISTIC_EVALUATOR',
    };
  }
}

export interface StudentAssessmentContext {
  studentId: string;
  studentName: string;
  departmentName: string;
  companyName: string;
  roleTitle: string;
  progressPercentage: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  revisionsRequested: number;
  mentorFeedbackSummary?: string;
  mentorRating?: number;
  outcomesVerifiedCount: number;
  totalOutcomesCount: number;
}

export const groqService = new GroqService();

