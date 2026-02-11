import type { ProviderV3 } from '@ai-sdk/provider';
import type {
  OpenRouterChatModelId,
  OpenRouterChatSettings,
} from './types/openrouter-chat-settings';
import type {
  OpenRouterCompletionModelId,
  OpenRouterCompletionSettings,
} from './types/openrouter-completion-settings';
import type {
  OpenRouterEmbeddingModelId,
  OpenRouterEmbeddingSettings,
} from './types/openrouter-embedding-settings';
import type {
  OpenRouterImageModelId,
  OpenRouterImageSettings,
} from './types/openrouter-image-settings';

import { loadApiKey, withoutTrailingSlash } from '@ai-sdk/provider-utils';
import { OpenRouterChatLanguageModel } from './chat';
import { OpenRouterCompletionLanguageModel } from './completion';
import { OpenRouterEmbeddingModel } from './embedding';
import { OpenRouterImageModel } from './image';
import { withUserAgentSuffix } from './utils/with-user-agent-suffix';
import { VERSION } from './version';

export type { OpenRouterChatSettings, OpenRouterCompletionSettings };

export interface OpenRouterProvider extends ProviderV3 {
  (
    modelId: OpenRouterChatModelId,
    settings?: OpenRouterCompletionSettings,
  ): OpenRouterCompletionLanguageModel;
  (
    modelId: OpenRouterChatModelId,
    settings?: OpenRouterChatSettings,
  ): OpenRouterChatLanguageModel;

  languageModel(
    modelId: OpenRouterChatModelId,
    settings?: OpenRouterCompletionSettings,
  ): OpenRouterCompletionLanguageModel;
  languageModel(
    modelId: OpenRouterChatModelId,
    settings?: OpenRouterChatSettings,
  ): OpenRouterChatLanguageModel;

  /**
Creates an OpenRouter chat model for text generation.
   */
  chat(
    modelId: OpenRouterChatModelId,
    settings?: OpenRouterChatSettings,
  ): OpenRouterChatLanguageModel;

  /**
Creates an OpenRouter completion model for text generation.
   */
  completion(
    modelId: OpenRouterCompletionModelId,
    settings?: OpenRouterCompletionSettings,
  ): OpenRouterCompletionLanguageModel;

  /**
Creates an OpenRouter text embedding model. (AI SDK v5)
   */
  textEmbeddingModel(
    modelId: OpenRouterEmbeddingModelId,
    settings?: OpenRouterEmbeddingSettings,
  ): OpenRouterEmbeddingModel;

  /**
Creates an OpenRouter text embedding model. (AI SDK v4 - deprecated, use textEmbeddingModel instead)
@deprecated Use textEmbeddingModel instead
   */
  embedding(
    modelId: OpenRouterEmbeddingModelId,
    settings?: OpenRouterEmbeddingSettings,
  ): OpenRouterEmbeddingModel;

  /**
Creates an OpenRouter image model for image generation.
   */
  imageModel(
    modelId: OpenRouterImageModelId,
    settings?: OpenRouterImageSettings,
  ): OpenRouterImageModel;

  /**
Creates an OpenRouter chat model with URL grounding enabled.
URL grounding uses specific web content to improve factual accuracy and provide citations.

@param modelId - The model identifier (e.g., 'google/gemini-2.0-flash-exp')
@param urls - Single URL or array of URLs to use for grounding
@param settings - Additional model settings (optional)

@example
```ts
const model = openrouter.urlGrounding('google/gemini-2.0-flash-exp', [
  'https://example.com/article1',
  'https://example.com/article2',
]);
```
   */
  urlGrounding(
    modelId: OpenRouterChatModelId,
    urls: string | string[],
    settings?: Omit<OpenRouterChatSettings, 'url_grounding'>,
  ): OpenRouterChatLanguageModel;

  /**
Creates an OpenRouter chat model with Google Search grounding enabled.
Google Search grounding provides real-time information from Google Search results
to improve factual accuracy and provide citations.

@param modelId - The model identifier (e.g., 'google/gemini-2.0-flash-exp')
@param settings - Additional model settings (optional)

@example
```ts
const model = openrouter.googleSearch('google/gemini-2.0-flash-exp');
```
   */
  googleSearch(
    modelId: OpenRouterChatModelId,
    settings?: Omit<OpenRouterChatSettings, 'google_search_retrieval'>,
  ): OpenRouterChatLanguageModel;

  /**
Creates an OpenRouter chat model with smart grounding that automatically falls back
between URL context and Google Search based on availability and model support.

When you provide URLs, the SDK will try URL grounding first, then fall back to
Google Search if URL grounding is not supported. If no URLs are provided, it uses
Google Search directly.

This method eliminates the need for manual fallback logic, making grounding "just work".

@param modelId - The model identifier (e.g., 'google/gemini-2.0-flash-exp')
@param urls - Optional URL(s) to use for URL grounding. If omitted, uses Google Search only.
@param settings - Additional model settings (optional)

@example Using with URLs (tries URL grounding, falls back to Google Search):
```ts
const model = openrouter.grounding('google/gemini-2.0-flash-exp', [
  'https://example.com/article',
]);
```

@example Using without URLs (uses Google Search):
```ts
const model = openrouter.grounding('google/gemini-2.0-flash-exp');
```
   */
  grounding(
    modelId: OpenRouterChatModelId,
    urls?: string | string[],
    settings?: Omit<
      OpenRouterChatSettings,
      'url_grounding' | 'google_search_retrieval'
    >,
  ): OpenRouterChatLanguageModel;
}

export interface OpenRouterProviderSettings {
  /**
Base URL for the OpenRouter API calls.
     */
  baseURL?: string;

  /**
@deprecated Use `baseURL` instead.
     */
  baseUrl?: string;

  /**
API key for authenticating requests.
     */
  apiKey?: string;

  /**
Custom headers to include in the requests.
     */
  headers?: Record<string, string>;

  /**
OpenRouter compatibility mode. Should be set to `strict` when using the OpenRouter API,
and `compatible` when using 3rd party providers. In `compatible` mode, newer
information such as streamOptions are not being sent. Defaults to 'compatible'.
   */
  compatibility?: 'strict' | 'compatible';

  /**
Custom fetch implementation. You can use it as a middleware to intercept requests,
or to provide a custom fetch implementation for e.g. testing.
    */
  fetch?: typeof fetch;

  /**
A JSON object to send as the request body to access OpenRouter features & upstream provider features.
  */
  extraBody?: Record<string, unknown>;

  /**
   * Record of provider slugs to API keys for injecting into provider routing.
   * Maps provider slugs (e.g. "anthropic", "openai") to their respective API keys.
   */
  api_keys?: Record<string, string>;
}

/**
Create an OpenRouter provider instance.
 */
export function createOpenRouter(
  options: OpenRouterProviderSettings = {},
): OpenRouterProvider {
  const baseURL =
    withoutTrailingSlash(options.baseURL ?? options.baseUrl) ??
    'https://openrouter.ai/api/v1';

  // we default to compatible, because strict breaks providers like Groq:
  const compatibility = options.compatibility ?? 'compatible';

  const getHeaders = () =>
    withUserAgentSuffix(
      {
        Authorization: `Bearer ${loadApiKey({
          apiKey: options.apiKey,
          environmentVariableName: 'OPENROUTER_API_KEY',
          description: 'OpenRouter',
        })}`,
        ...options.headers,
        ...(options.api_keys &&
          Object.keys(options.api_keys).length > 0 && {
            'X-Provider-API-Keys': JSON.stringify(options.api_keys),
          }),
      },
      `ai-sdk/openrouter/${VERSION}`,
    );

  const createChatModel = (
    modelId: OpenRouterChatModelId,
    settings: OpenRouterChatSettings = {},
  ) =>
    new OpenRouterChatLanguageModel(modelId, settings, {
      provider: 'openrouter.chat',
      url: ({ path }) => `${baseURL}${path}`,
      headers: getHeaders,
      compatibility,
      fetch: options.fetch,
      extraBody: options.extraBody,
    });

  const createCompletionModel = (
    modelId: OpenRouterCompletionModelId,
    settings: OpenRouterCompletionSettings = {},
  ) =>
    new OpenRouterCompletionLanguageModel(modelId, settings, {
      provider: 'openrouter.completion',
      url: ({ path }) => `${baseURL}${path}`,
      headers: getHeaders,
      compatibility,
      fetch: options.fetch,
      extraBody: options.extraBody,
    });

  const createEmbeddingModel = (
    modelId: OpenRouterEmbeddingModelId,
    settings: OpenRouterEmbeddingSettings = {},
  ) =>
    new OpenRouterEmbeddingModel(modelId, settings, {
      provider: 'openrouter.embedding',
      url: ({ path }) => `${baseURL}${path}`,
      headers: getHeaders,
      fetch: options.fetch,
      extraBody: options.extraBody,
    });

  const createImageModel = (
    modelId: OpenRouterImageModelId,
    settings: OpenRouterImageSettings = {},
  ) =>
    new OpenRouterImageModel(modelId, settings, {
      provider: 'openrouter.image',
      url: ({ path }) => `${baseURL}${path}`,
      headers: getHeaders,
      fetch: options.fetch,
      extraBody: options.extraBody,
    });

  const createLanguageModel = (
    modelId: OpenRouterChatModelId | OpenRouterCompletionModelId,
    settings?: OpenRouterChatSettings | OpenRouterCompletionSettings,
  ) => {
    if (new.target) {
      throw new Error(
        'The OpenRouter model function cannot be called with the new keyword.',
      );
    }

    if (modelId === 'openai/gpt-3.5-turbo-instruct') {
      return createCompletionModel(
        modelId,
        settings as OpenRouterCompletionSettings,
      );
    }

    return createChatModel(modelId, settings as OpenRouterChatSettings);
  };

  const createUrlGroundingModel = (
    modelId: OpenRouterChatModelId,
    urls: string | string[],
    settings: Omit<OpenRouterChatSettings, 'url_grounding'> = {},
  ) => {
    const urlArray = Array.isArray(urls) ? urls : [urls];
    return createChatModel(modelId, {
      ...settings,
      url_grounding: {
        urls: urlArray,
      },
    });
  };

  const createGoogleSearchModel = (
    modelId: OpenRouterChatModelId,
    settings: Omit<OpenRouterChatSettings, 'google_search_retrieval'> = {},
  ) => {
    return createChatModel(modelId, {
      ...settings,
      google_search_retrieval: {},
    });
  };

  const createGroundingModel = (
    modelId: OpenRouterChatModelId,
    urls?: string | string[],
    settings: Omit<
      OpenRouterChatSettings,
      'url_grounding' | 'google_search_retrieval'
    > = {},
  ) => {
    // If URLs are provided, use URL grounding with fallback enabled
    if (urls !== undefined && urls !== null) {
      const urlArray = Array.isArray(urls) ? urls : [urls];

      // If empty array provided, treat as no URLs
      if (urlArray.length === 0) {
        return createChatModel(modelId, {
          ...settings,
          google_search_retrieval: {},
        });
      }

      return createChatModel(modelId, {
        ...settings,
        url_grounding: {
          urls: urlArray,
        },
        google_search_retrieval: {},
        _enableGroundingFallback: true,
        _groundingPreference: 'url-first',
      });
    }

    // No URLs provided, use Google Search only
    return createChatModel(modelId, {
      ...settings,
      google_search_retrieval: {},
    });
  };

  const provider = (
    modelId: OpenRouterChatModelId | OpenRouterCompletionModelId,
    settings?: OpenRouterChatSettings | OpenRouterCompletionSettings,
  ) => createLanguageModel(modelId, settings);

  provider.languageModel = createLanguageModel;
  provider.chat = createChatModel;
  provider.completion = createCompletionModel;
  provider.textEmbeddingModel = createEmbeddingModel;
  provider.embedding = createEmbeddingModel; // deprecated alias for v4 compatibility
  provider.imageModel = createImageModel;
  provider.urlGrounding = createUrlGroundingModel;
  provider.googleSearch = createGoogleSearchModel;
  provider.grounding = createGroundingModel;

  return provider as OpenRouterProvider;
}

/**
Default OpenRouter provider instance. It uses 'strict' compatibility mode.
 */
export const openrouter = createOpenRouter({
  compatibility: 'strict', // strict for OpenRouter API
});
