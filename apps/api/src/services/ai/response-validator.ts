import {
  AIExtractedDataDto,
  AIActivityDto,
  AITechnologyDto,
  AISkillDto,
  AIEvidenceDto,
  AIOutcomeMatchDto,
} from '@internos/types';

export class ResponseValidationError extends Error {
  constructor(message: string, public readonly rawContent?: string) {
    super(message);
    this.name = 'ResponseValidationError';
  }
}

export class ResponseValidator {
  public static readonly NO_EVIDENCE_PHRASE = 'No evidence found in submitted work.';

  private static readonly FORBIDDEN_PATTERNS = [
    /student does not know/i,
    /student does not understand/i,
    /student lacks knowledge/i,
    /student is unable to/i,
    /student has no skill in/i,
    /student failed to understand/i,
  ];

  /**
   * Sanitizes text to remove any forbidden negative incompetence phrases.
   */
  public static sanitizeEvidenceLanguage(text: string): string {
    if (!text || typeof text !== 'string') return '';
    let sanitized = text;
    for (const pattern of this.FORBIDDEN_PATTERNS) {
      sanitized = sanitized.replace(pattern, this.NO_EVIDENCE_PHRASE);
    }
    return sanitized;
  }

  /**
   * Extracts clean JSON string from raw LLM output.
   */
  public static extractJsonString(rawContent: string): string {
    if (!rawContent || typeof rawContent !== 'string') {
      throw new ResponseValidationError('Raw model response is empty or invalid type');
    }

    let trimmed = rawContent.trim();

    // Handle markdown code block wrappers ```json ... ``` or ``` ... ```
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      trimmed = codeBlockMatch[1].trim();
    } else if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      // Direct JSON object
    } else {
      // Look for the first '{' and last '}'
      const firstBrace = trimmed.indexOf('{');
      const lastBrace = trimmed.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        trimmed = trimmed.substring(firstBrace, lastBrace + 1);
      }
    }

    return trimmed;
  }

  /**
   * Validates and normalizes parsed LLM output into strict AIExtractedDataDto.
   * Throws ResponseValidationError if JSON is malformed or structure is invalid.
   */
  public static validate(rawContent: string): { data: AIExtractedDataDto; confidence: number } {
    const jsonStr = this.extractJsonString(rawContent);

    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (err: any) {
      throw new ResponseValidationError(`Malformed JSON from model: ${err?.message || 'JSON Parse error'}`, rawContent);
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new ResponseValidationError('Model response must be a JSON object', rawContent);
    }

    // 1. Activities
    const activities: AIActivityDto[] = [];
    if (Array.isArray(parsed.activities)) {
      for (const item of parsed.activities) {
        if (item && typeof item === 'object') {
          const desc = String(item.description || '').trim();
          if (desc) {
            activities.push({
              description: this.sanitizeEvidenceLanguage(desc),
              evidenceRef: this.sanitizeEvidenceLanguage(String(item.evidenceRef || desc).trim()),
            });
          }
        }
      }
    }

    // 2. Technologies
    const technologies: AITechnologyDto[] = [];
    if (Array.isArray(parsed.technologies)) {
      for (const item of parsed.technologies) {
        if (item && typeof item === 'object') {
          const name = String(item.name || '').trim();
          if (name) {
            technologies.push({
              name,
              category: String(item.category || 'Tool').trim(),
              evidenceRef: this.sanitizeEvidenceLanguage(String(item.evidenceRef || name).trim()),
            });
          }
        }
      }
    }

    // 3. Skills
    const skills: AISkillDto[] = [];
    if (Array.isArray(parsed.skills)) {
      for (const item of parsed.skills) {
        if (item && typeof item === 'object') {
          const name = String(item.name || '').trim();
          if (name) {
            skills.push({
              name: this.sanitizeEvidenceLanguage(name),
              category: String(item.category || 'Technical').trim(),
              evidenceRef: this.sanitizeEvidenceLanguage(String(item.evidenceRef || name).trim()),
            });
          }
        }
      }
    }

    // 4. Evidence
    const evidence: AIEvidenceDto[] = [];
    if (Array.isArray(parsed.evidence)) {
      for (const item of parsed.evidence) {
        if (item && typeof item === 'object') {
          const quote = String(item.quote || '').trim();
          if (quote) {
            const rawConfidence = Number(item.confidence);
            const conf = isNaN(rawConfidence) ? 0.8 : Math.max(0, Math.min(1, rawConfidence));
            evidence.push({
              quote,
              context: this.sanitizeEvidenceLanguage(String(item.context || '').trim()),
              confidence: conf,
            });
          }
        }
      }
    }

    // 5. Outcomes
    const outcomes: AIOutcomeMatchDto[] = [];
    if (Array.isArray(parsed.outcomes)) {
      for (const item of parsed.outcomes) {
        if (item && typeof item === 'object') {
          const outcomeCode = String(item.outcomeCode || '').trim();
          const outcomeName = String(item.outcomeName || outcomeCode).trim();
          let matchStatus: 'MATCHED' | 'PARTIAL' | 'NO_EVIDENCE' = 'NO_EVIDENCE';

          const rawStatus = String(item.matchStatus || '').toUpperCase();
          if (rawStatus === 'MATCHED') matchStatus = 'MATCHED';
          else if (rawStatus === 'PARTIAL') matchStatus = 'PARTIAL';
          else matchStatus = 'NO_EVIDENCE';

          let rawConfidence = Number(item.confidence);
          if (isNaN(rawConfidence)) rawConfidence = matchStatus === 'NO_EVIDENCE' ? 0 : 0.75;
          const conf = Math.max(0, Math.min(1, rawConfidence));

          let evidenceQuote = String(item.evidenceQuote || '').trim();
          if (matchStatus === 'NO_EVIDENCE' || !evidenceQuote) {
            evidenceQuote = this.NO_EVIDENCE_PHRASE;
          } else {
            evidenceQuote = this.sanitizeEvidenceLanguage(evidenceQuote);
          }

          const analysis = this.sanitizeEvidenceLanguage(String(item.analysis || '').trim());

          outcomes.push({
            outcomeCode,
            outcomeName,
            matchStatus,
            confidence: conf,
            evidenceQuote,
            analysis,
          });
        }
      }
    }

    // Minimum sanity check: Must have at least activities or outcomes structure
    if (activities.length === 0 && outcomes.length === 0 && technologies.length === 0) {
      throw new ResponseValidationError('Model response contained empty or unparseable extraction arrays', rawContent);
    }

    // Calculate overall confidence score
    let totalScore = 0;
    let scoreCount = 0;

    for (const ev of evidence) {
      totalScore += ev.confidence;
      scoreCount++;
    }
    for (const out of outcomes) {
      if (out.matchStatus !== 'NO_EVIDENCE') {
        totalScore += out.confidence;
        scoreCount++;
      }
    }

    const overallConfidence = scoreCount > 0 ? Math.round((totalScore / scoreCount) * 100) / 100 : 0.85;

    const data: AIExtractedDataDto = {
      activities,
      technologies,
      skills,
      evidence,
      outcomes,
    };

    return { data, confidence: overallConfidence };
  }
}
