/**
 * AI Service Abstraction Layer (Phase 0)
 *
 * SPECIFICATION REQUIREMENT:
 * "Create an abstraction/interface only.
 *  DO NOT implement AI functionality in Phase 0."
 *
 * Provides a provider-agnostic interface allowing future phases to plug in
 * LLM adapters (OpenAI, Gemini, Anthropic, or local open-weights models)
 * without rewriting business logic.
 */

import {
  IAIService,
  AISubmissionAnalysisRequest,
  AISubmissionAnalysisResponse,
  AIOutcomeMappingRequest,
  AIOutcomeMappingResponse,
  AIRubricRecommendationRequest,
  AIRubricRecommendationResponse,
} from '@internos/types';
import { NotImplementedError } from '@internos/shared';

export class Phase0DisabledAIService implements IAIService {
  async analyzeSubmission(_request: AISubmissionAnalysisRequest): Promise<AISubmissionAnalysisResponse> {
    throw new NotImplementedError(
      'AI submission analysis is not implemented in Phase 0 as per architecture specification. Target phase: Phase 2.'
    );
  }

  async mapInternshipOutcomes(_request: AIOutcomeMappingRequest): Promise<AIOutcomeMappingResponse> {
    throw new NotImplementedError(
      'AI outcome mapping is not implemented in Phase 0 as per architecture specification. Target phase: Phase 2.'
    );
  }

  async recommendRubric(_request: AIRubricRecommendationRequest): Promise<AIRubricRecommendationResponse> {
    throw new NotImplementedError(
      'AI rubric recommendation is not implemented in Phase 0 as per architecture specification. Target phase: Phase 2.'
    );
  }
}

// Export singleton interface instance for Phase 0
export const aiService: IAIService = new Phase0DisabledAIService();
