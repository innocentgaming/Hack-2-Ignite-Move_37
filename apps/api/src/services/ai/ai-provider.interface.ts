export interface AIProviderOptions {
  timeoutMs?: number;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface AIProviderResponse {
  rawContent: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  durationMs?: number;
}

export interface AIProvider {
  readonly name: string;
  readonly defaultModel: string;
  generateCompletion(
    systemPrompt: string,
    userPrompt: string,
    options?: AIProviderOptions
  ): Promise<AIProviderResponse>;
}
