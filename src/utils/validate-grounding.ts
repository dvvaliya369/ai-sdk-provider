import type {
  DynamicRetrievalConfig,
  OpenRouterChatSettings,
} from '../types/openrouter-chat-settings';

/**
 * Validation error for grounding configuration issues
 */
export class GroundingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GroundingValidationError';
  }
}

/**
 * Validates URL grounding configuration
 * @throws {GroundingValidationError} if configuration is invalid
 */
export function validateUrlGrounding(
  urlGrounding: NonNullable<OpenRouterChatSettings['url_grounding']>,
): void {
  if (!urlGrounding.urls || urlGrounding.urls.length === 0) {
    throw new GroundingValidationError(
      'url_grounding.urls must be a non-empty array of URLs',
    );
  }

  for (const url of urlGrounding.urls) {
    if (typeof url !== 'string' || url.trim() === '') {
      throw new GroundingValidationError(
        `Invalid URL in url_grounding.urls: ${JSON.stringify(url)}. All URLs must be non-empty strings.`,
      );
    }

    // Basic URL format validation
    try {
      new URL(url);
    } catch {
      throw new GroundingValidationError(
        `Invalid URL format in url_grounding.urls: "${url}". URLs must be valid HTTP/HTTPS URLs.`,
      );
    }
  }

  if (urlGrounding.dynamic_retrieval_config) {
    validateDynamicRetrievalConfig(
      urlGrounding.dynamic_retrieval_config,
      'url_grounding',
    );
  }
}

/**
 * Validates Google Search grounding configuration
 * @throws {GroundingValidationError} if configuration is invalid
 */
export function validateGoogleSearchRetrieval(
  googleSearchRetrieval: NonNullable<
    OpenRouterChatSettings['google_search_retrieval']
  >,
): void {
  if (googleSearchRetrieval.dynamic_retrieval_config) {
    validateDynamicRetrievalConfig(
      googleSearchRetrieval.dynamic_retrieval_config,
      'google_search_retrieval',
    );
  }
}

/**
 * Validates dynamic retrieval configuration
 * @throws {GroundingValidationError} if configuration is invalid
 */
function validateDynamicRetrievalConfig(
  config: DynamicRetrievalConfig,
  context: string,
): void {
  if (config.mode !== undefined) {
    const validModes = ['MODE_UNSPECIFIED', 'MODE_DYNAMIC', 'MODE_STATIC'];
    if (!validModes.includes(config.mode) && typeof config.mode !== 'string') {
      throw new GroundingValidationError(
        `Invalid ${context}.dynamic_retrieval_config.mode: ${JSON.stringify(config.mode)}. Must be 'MODE_UNSPECIFIED', 'MODE_DYNAMIC', or 'MODE_STATIC'.`,
      );
    }
  }

  if (config.dynamic_threshold !== undefined) {
    if (
      typeof config.dynamic_threshold !== 'number' ||
      config.dynamic_threshold < 0 ||
      config.dynamic_threshold > 1
    ) {
      throw new GroundingValidationError(
        `Invalid ${context}.dynamic_retrieval_config.dynamic_threshold: ${config.dynamic_threshold}. Must be a number between 0 and 1.`,
      );
    }

    // Warn if dynamic_threshold is set but mode is not MODE_DYNAMIC
    if (config.mode && config.mode !== 'MODE_DYNAMIC') {
      console.warn(
        `[OpenRouter] Warning: ${context}.dynamic_retrieval_config.dynamic_threshold is set but mode is '${config.mode}'. The threshold only applies when mode is 'MODE_DYNAMIC'.`,
      );
    }
  }
}

/**
 * Validates grounding configuration and logs debug information
 * @throws {GroundingValidationError} if configuration is invalid
 * @returns warnings array if any issues are detected
 */
export function validateAndLogGrounding(
  settings: OpenRouterChatSettings,
): string[] {
  const warnings: string[] = [];

  // Validate if both grounding methods are configured
  if (settings.url_grounding && settings.google_search_retrieval) {
    const warning =
      '[OpenRouter] Warning: Both url_grounding and google_search_retrieval are configured. Depending on the model, this may cause conflicts or unexpected behavior. Consider using only one grounding method.';
    warnings.push(warning);
    console.warn(warning);
  }

  // Validate URL grounding if present
  if (settings.url_grounding) {
    validateUrlGrounding(settings.url_grounding);

    // Debug log
    if (process.env.DEBUG?.includes('openrouter')) {
      console.debug(
        '[OpenRouter] URL grounding enabled:',
        JSON.stringify(
          {
            urls: settings.url_grounding.urls,
            dynamic_retrieval_config:
              settings.url_grounding.dynamic_retrieval_config,
          },
          null,
          2,
        ),
      );
    }
  }

  // Validate Google Search grounding if present
  if (settings.google_search_retrieval) {
    validateGoogleSearchRetrieval(settings.google_search_retrieval);

    // Debug log
    if (process.env.DEBUG?.includes('openrouter')) {
      console.debug(
        '[OpenRouter] Google Search grounding enabled:',
        JSON.stringify(
          {
            dynamic_retrieval_config:
              settings.google_search_retrieval.dynamic_retrieval_config,
          },
          null,
          2,
        ),
      );
    }
  }

  return warnings;
}
