import { AIProvider, AIProviderOptions, AIProviderResponse } from './ai-provider.interface.js';
import { env } from '../../config/env.js';

export class TimeoutError extends Error {
  constructor(message = 'LLM provider request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class LLMProvider implements AIProvider {
  public readonly name: string;
  public readonly defaultModel: string;
  private readonly apiKey: string;
  private readonly isMockFallback: boolean;

  constructor(options?: { name?: string; model?: string; apiKey?: string }) {
    this.name = options?.name || env.LLM_PROVIDER || 'openai';
    this.defaultModel = options?.model || env.LLM_MODEL || 'gpt-4o';
    this.apiKey = options?.apiKey || env.LLM_API_KEY || '';

    // If key is missing or dummy placeholder, operate in evidence-grounded fallback mode
    const isPlaceholder = !this.apiKey ||
      this.apiKey.includes('placeholder') ||
      this.apiKey.includes('dummy') ||
      this.apiKey.trim() === '';

    this.isMockFallback = isPlaceholder || process.env.NODE_ENV === 'test' || process.env.USE_HEURISTIC_AI === 'true';
  }

  async generateCompletion(
    systemPrompt: string,
    userPrompt: string,
    options?: AIProviderOptions
  ): Promise<AIProviderResponse> {
    const startTime = Date.now();
    const timeoutMs = options?.timeoutMs ?? 15000;
    const model = options?.model || this.defaultModel;

    // In fallback mode (when no valid API key is present or in test mode)
    if (this.isMockFallback) {
      return this.generateHeuristicResponse(userPrompt, model, startTime);
    }

    // Live remote LLM call via OpenAI-compatible endpoint
    return this.callRemoteLLM(systemPrompt, userPrompt, model, timeoutMs, startTime);
  }

  private async callRemoteLLM(
    systemPrompt: string,
    userPrompt: string,
    model: string,
    timeoutMs: number,
    startTime: number
  ): Promise<AIProviderResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: process.env.LLM_TEMPERATURE ? Number(process.env.LLM_TEMPERATURE) : 0.2,
          max_tokens: process.env.LLM_MAX_TOKENS ? Number(process.env.LLM_MAX_TOKENS) : 1500,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`LLM Provider HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const data = (await response.json()) as any;
      const rawContent = data?.choices?.[0]?.message?.content || '';

      return {
        rawContent,
        model: data?.model || model,
        promptTokens: data?.usage?.prompt_tokens,
        completionTokens: data?.usage?.completion_tokens,
        durationMs: Date.now() - startTime,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === 'AbortError') {
        throw new TimeoutError(`LLM Provider request timed out after ${timeoutMs}ms`);
      }
      throw err;
    }
  }

  /**
   * Deterministic, evidence-grounded extractor when no external LLM credentials exist.
   * Scans the student's submission text for technical keywords, sentences, and outcome alignments.
   */
  private generateHeuristicResponse(
    userPrompt: string,
    model: string,
    startTime: number
  ): AIProviderResponse {
    // Extract deliverable content from between the triple quotes
    const contentMatch = userPrompt.match(/DELIVERABLE CONTENT \/ REPORT:\s*"""([\s\S]*?)"""/);
    const content = contentMatch ? contentMatch[1].trim() : userPrompt;

    const sentences = content
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15);

    // Common technology dictionary for detection
    const techPatterns = [
      { name: 'TypeScript', category: 'Language', pattern: /\btypescript\b/i },
      { name: 'JavaScript', category: 'Language', pattern: /\bjavascript|js\b/i },
      { name: 'Python', category: 'Language', pattern: /\bpython\b/i },
      { name: 'React', category: 'Framework', pattern: /\breact(?:\.js)?\b/i },
      { name: 'Node.js', category: 'Framework', pattern: /\bnode(?:\.js)?\b/i },
      { name: 'Express', category: 'Framework', pattern: /\bexpress(?:\.js)?\b/i },
      { name: 'PostgreSQL', category: 'Database', pattern: /\bpostgres(?:ql)?\b/i },
      { name: 'MongoDB', category: 'Database', pattern: /\bmongodb\b/i },
      { name: 'Prisma ORM', category: 'Database', pattern: /\bprisma\b/i },
      { name: 'Docker', category: 'Cloud/DevOps', pattern: /\bdocker(?:-compose)?\b/i },
      { name: 'Kubernetes', category: 'Cloud/DevOps', pattern: /\bkubernetes|k8s\b/i },
      { name: 'AWS', category: 'Cloud/DevOps', pattern: /\baws|amazon web services\b/i },
      { name: 'Git', category: 'Tool', pattern: /\bgit(?:hub|lab)?\b/i },
      { name: 'Tailwind CSS', category: 'Framework', pattern: /\btailwind(?:\s*css)?\b/i },
      { name: 'REST API', category: 'Architectural', pattern: /\brest(?:ful)?\s*api\b/i },
      { name: 'GraphQL', category: 'API', pattern: /\bgraphql\b/i },
      { name: 'Jest / Testing', category: 'Testing', pattern: /\bjest|mocha|unit test(?:ing)?\b/i },
    ];

    const detectedTech: Array<{ name: string; category: string; evidenceRef: string }> = [];
    for (const tech of techPatterns) {
      const matchingSentence = sentences.find((s) => tech.pattern.test(s));
      if (matchingSentence) {
        detectedTech.push({
          name: tech.name,
          category: tech.category,
          evidenceRef: matchingSentence,
        });
      }
    }

    // Default if no specific tech matched
    if (detectedTech.length === 0 && sentences.length > 0) {
      detectedTech.push({
        name: 'Technical Implementation',
        category: 'Tool',
        evidenceRef: sentences[0],
      });
    }

    // Extract activities
    const activities: Array<{ description: string; evidenceRef: string }> = [];
    const actionKeywords = /\b(implemented|developed|designed|built|configured|tested|integrated|created|refactored|analyzed)\b/i;
    for (const sentence of sentences) {
      if (actionKeywords.test(sentence) && activities.length < 5) {
        activities.push({
          description: sentence.replace(/[.?!]$/, ''),
          evidenceRef: sentence,
        });
      }
    }

    if (activities.length === 0 && sentences.length > 0) {
      activities.push({
        description: `Student completed milestone deliverable: ${sentences[0]}`,
        evidenceRef: sentences[0],
      });
    }

    // Skills
    const skills: Array<{ name: string; category: string; evidenceRef: string }> = [];
    if (detectedTech.some((t) => t.category === 'Language' || t.category === 'Framework')) {
      skills.push({
        name: 'Full-Stack Software Engineering',
        category: 'Technical',
        evidenceRef: detectedTech[0].evidenceRef,
      });
    }
    if (detectedTech.some((t) => t.category === 'Database')) {
      skills.push({
        name: 'Database Architecture & Data Persistence',
        category: 'Technical',
        evidenceRef: detectedTech.find((t) => t.category === 'Database')!.evidenceRef,
      });
    }
    if (detectedTech.some((t) => t.category === 'Cloud/DevOps')) {
      skills.push({
        name: 'DevOps & Container Orchestration',
        category: 'Architectural',
        evidenceRef: detectedTech.find((t) => t.category === 'Cloud/DevOps')!.evidenceRef,
      });
    }
    if (skills.length === 0 && sentences.length > 0) {
      skills.push({
        name: 'Technical Problem Solving',
        category: 'Analytical',
        evidenceRef: sentences[0],
      });
    }

    // Verbatim Evidence Quotes
    const evidence: Array<{ quote: string; context: string; confidence: number }> = [];
    for (let i = 0; i < Math.min(3, sentences.length); i++) {
      evidence.push({
        quote: sentences[i],
        context: 'Direct technical progress reported in milestone deliverable',
        confidence: 0.95,
      });
    }

    // Outcomes mapping from prompt
    const outcomes: Array<{
      outcomeCode: string;
      outcomeName: string;
      matchStatus: 'MATCHED' | 'PARTIAL' | 'NO_EVIDENCE';
      confidence: number;
      evidenceQuote: string;
      analysis: string;
    }> = [];

    // Extract PO codes from userPrompt
    const poMatches = userPrompt.match(/-\s*\[([A-Za-z0-9_-]+)\]\s*([^:\n]+)(?::\s*([^\n]+))?/g);

    if (poMatches && poMatches.length > 0) {
      for (const poLine of poMatches) {
        const parsedPo = poLine.match(/-\s*\[([A-Za-z0-9_-]+)\]\s*([^:\n(]+)/);
        if (parsedPo) {
          const code = parsedPo[1].trim();
          const name = parsedPo[2].trim();

          // Check if any sentence relates to this outcome
          const matchedSentence = sentences.find(
            (s) =>
              s.toLowerCase().includes(name.toLowerCase().slice(0, 8)) ||
              actionKeywords.test(s)
          );

          if (matchedSentence) {
            outcomes.push({
              outcomeCode: code,
              outcomeName: name,
              matchStatus: 'MATCHED',
              confidence: 0.88,
              evidenceQuote: matchedSentence,
              analysis: `Deliverable demonstrates practical application of ${name} via active implementation.`,
            });
          } else {
            outcomes.push({
              outcomeCode: code,
              outcomeName: name,
              matchStatus: 'NO_EVIDENCE',
              confidence: 0.0,
              evidenceQuote: 'No evidence found in submitted work.',
              analysis: `Deliverable content does not contain explicit technical evidence matching ${name}.`,
            });
          }
        }
      }
    } else {
      // Default standard outcomes
      outcomes.push({
        outcomeCode: 'PO-1',
        outcomeName: 'Engineering Knowledge & Problem Solving',
        matchStatus: sentences.length > 0 ? 'MATCHED' : 'NO_EVIDENCE',
        confidence: sentences.length > 0 ? 0.9 : 0.0,
        evidenceQuote: sentences[0] || 'No evidence found in submitted work.',
        analysis: 'Applied core technical principles to complete the milestone requirements.',
      });
      outcomes.push({
        outcomeCode: 'PO-2',
        outcomeName: 'Modern Tool Usage',
        matchStatus: detectedTech.length > 0 ? 'MATCHED' : 'NO_EVIDENCE',
        confidence: detectedTech.length > 0 ? 0.92 : 0.0,
        evidenceQuote: detectedTech[0]?.evidenceRef || 'No evidence found in submitted work.',
        analysis: `Leveraged modern tools including ${detectedTech.map((t) => t.name).join(', ')}.`,
      });
      outcomes.push({
        outcomeCode: 'PO-3',
        outcomeName: 'Ethical and Professional Standards',
        matchStatus: 'NO_EVIDENCE',
        confidence: 0.0,
        evidenceQuote: 'No evidence found in submitted work.',
        analysis: 'Milestone deliverable focus was purely technical implementation; no explicit ethics discussion documented.',
      });
    }

    const payload = {
      activities,
      technologies: detectedTech,
      skills,
      evidence,
      outcomes,
    };

    return {
      rawContent: JSON.stringify(payload, null, 2),
      model: `${model}-heuristic`,
      promptTokens: Math.round(userPrompt.length / 4),
      completionTokens: Math.round(JSON.stringify(payload).length / 4),
      durationMs: Date.now() - startTime,
    };
  }
}

export const defaultLLMProvider = new LLMProvider();
