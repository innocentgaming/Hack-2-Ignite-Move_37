export interface ExpectedOutcomeContext {
  code: string;
  name: string;
  description?: string;
  bloomLevel?: string;
}

export interface SubmissionPromptContext {
  title: string;
  content: string;
  version: number;
  stage?: string;
  files?: Array<{ originalName: string; mimeType: string }>;
  evidenceUrls?: string[];
  expectedOutcomes: ExpectedOutcomeContext[];
}

export class PromptBuilder {
  public static readonly PROMPT_VERSION = 'v1.0-evidence-first';

  /**
   * Builds the system prompt containing academic evidence principles and strict output constraints.
   */
  public static buildSystemPrompt(): string {
    return `You are the InternOS Evidence-Based Academic Intelligence Engine.
Your role is to analyze major student internship milestone submissions and extract verifiable, evidence-based technical insights.

CRITICAL OPERATIONAL RULES (MANDATORY):
1. EVIDENCE FIRST: Every extracted activity, technology, and skill MUST be anchored directly to verbatim evidence or clear descriptions from the student's submitted text.
2. STRICT EVIDENCE LANGUAGE:
   - When an expected outcome or skill is not demonstrated in the submitted work, YOU MUST state: "No evidence found in submitted work."
   - You MUST NEVER state: "Student does not know X", "Student lacks ability in X", or make subjective personal incompetence judgments. Absence of evidence is not evidence of absence.
3. ADVISORY NATURE: Your output is strictly advisory for academic supervisors and mentors. It does not replace human grading or alter health scores.
4. VALID JSON ONLY: You must respond ONLY with a single valid JSON object adhering strictly to the required schema. Do not prepend markdown explanation outside the JSON.`;
  }

  /**
   * Builds the user prompt with the student's submission text and the institution's expected outcomes.
   */
  public static buildUserPrompt(context: SubmissionPromptContext): string {
    const outcomesFormatted = context.expectedOutcomes.length > 0
      ? context.expectedOutcomes.map((o) => `- [${o.code}] ${o.name}: ${o.description || 'No description'} (Bloom Level: ${o.bloomLevel || 'Applying'})`).join('\n')
      : '- [PO-1] Engineering Knowledge & Real-World Application\n- [PO-2] Problem Analysis & Technical Implementation\n- [PO-3] Modern Tool Usage & Software Practices';

    const filesFormatted = (context.files && context.files.length > 0)
      ? context.files.map((f) => `- ${f.originalName} (${f.mimeType})`).join('\n')
      : 'None attached';

    return `Analyze the following student internship milestone deliverable and extract structured insights according to the JSON schema below.

---
SUBMISSION METADATA:
Title: ${context.title}
Version: ${context.version}
Stage: ${context.stage || 'PROGRESS_REPORT'}
Attached Files:
${filesFormatted}

DELIVERABLE CONTENT / REPORT:
"""
${context.content}
"""

INSTITUTIONAL EXPECTED OUTCOMES (POs/COs):
${outcomesFormatted}
---

REQUIRED JSON OUTPUT FORMAT:
Respond with ONLY this JSON object structure:
{
  "activities": [
    {
      "description": "Specific project task, development action, or milestone accomplished",
      "evidenceRef": "Verbatim quote or direct phrase from the submission supporting this activity"
    }
  ],
  "technologies": [
    {
      "name": "Technology, framework, programming language, database, or tool name",
      "category": "Language | Framework | Database | Cloud/DevOps | Testing | Tool",
      "evidenceRef": "Verbatim sentence or snippet where this technology was referenced"
    }
  ],
  "skills": [
    {
      "name": "Engineering or professional competency demonstrated",
      "category": "Technical | Architectural | Analytical | Communication | Collaboration",
      "evidenceRef": "Verbatim sentence from report demonstrating this skill"
    }
  ],
  "evidence": [
    {
      "quote": "Direct verbatim quote from the student's report text",
      "context": "Why this quote constitutes technical evidence",
      "confidence": 0.95
    }
  ],
  "outcomes": [
    {
      "outcomeCode": "PO code (e.g. PO-1)",
      "outcomeName": "Name of the Program Outcome",
      "matchStatus": "MATCHED | PARTIAL | NO_EVIDENCE",
      "confidence": 0.85,
      "evidenceQuote": "Direct quote demonstrating evidence, OR exactly 'No evidence found in submitted work.'",
      "analysis": "Objective evidence-based analysis linking student activities to this outcome"
    }
  ]
}

REMINDERS:
- If no evidence exists for an outcome, set matchStatus to "NO_EVIDENCE", evidenceQuote to "No evidence found in submitted work.", and confidence to 0.0.
- NEVER use the phrase "Student does not know" or make negative ability claims.
- Return ONLY the JSON object.`;
  }
}
