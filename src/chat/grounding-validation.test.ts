/**
 * Integration tests for grounding validation in OpenRouterChatLanguageModel
 */
import { describe, expect, it } from 'vitest';
import { createOpenRouter } from '../provider';
import { GroundingValidationError } from '../utils/validate-grounding';

describe('OpenRouterChatLanguageModel grounding validation', () => {
  const openrouter = createOpenRouter({
    apiKey: 'test-key',
  });

  describe('URL grounding validation', () => {
    it('should throw error when creating model with empty urls array', () => {
      expect(() => {
        openrouter('google/gemini-3-pro-preview', {
          url_grounding: {
            urls: [],
          },
        });
      }).toThrow(GroundingValidationError);
    });

    it('should throw error when creating model with invalid URL format', () => {
      expect(() => {
        openrouter('google/gemini-3-pro-preview', {
          url_grounding: {
            urls: ['not a valid url'],
          },
        });
      }).toThrow(GroundingValidationError);
    });

    it('should throw error when creating model with non-string URL', () => {
      expect(() => {
        openrouter('google/gemini-3-pro-preview', {
          url_grounding: {
            urls: [123 as unknown as string],
          },
        });
      }).toThrow(GroundingValidationError);
    });

    it('should throw error for invalid dynamic_threshold in url_grounding', () => {
      expect(() => {
        openrouter('google/gemini-3-pro-preview', {
          url_grounding: {
            urls: ['https://example.com'],
            dynamic_retrieval_config: {
              dynamic_threshold: 1.5,
            },
          },
        });
      }).toThrow(GroundingValidationError);
    });

    it('should create model successfully with valid url_grounding', () => {
      expect(() => {
        openrouter('google/gemini-3-pro-preview', {
          url_grounding: {
            urls: ['https://example.com', 'https://docs.example.com'],
          },
        });
      }).not.toThrow();
    });

    it('should create model successfully with valid dynamic_retrieval_config', () => {
      expect(() => {
        openrouter('google/gemini-3-pro-preview', {
          url_grounding: {
            urls: ['https://example.com'],
            dynamic_retrieval_config: {
              mode: 'MODE_DYNAMIC',
              dynamic_threshold: 0.5,
            },
          },
        });
      }).not.toThrow();
    });
  });

  describe('Google Search grounding validation', () => {
    it('should create model successfully with empty google_search_retrieval', () => {
      expect(() => {
        openrouter('google/gemini-3-pro-preview', {
          google_search_retrieval: {},
        });
      }).not.toThrow();
    });

    it('should throw error for invalid dynamic_threshold in google_search_retrieval', () => {
      expect(() => {
        openrouter('google/gemini-3-pro-preview', {
          google_search_retrieval: {
            dynamic_retrieval_config: {
              dynamic_threshold: -0.5,
            },
          },
        });
      }).toThrow(GroundingValidationError);
    });

    it('should create model successfully with valid google_search_retrieval', () => {
      expect(() => {
        openrouter('google/gemini-3-pro-preview', {
          google_search_retrieval: {
            dynamic_retrieval_config: {
              mode: 'MODE_STATIC',
            },
          },
        });
      }).not.toThrow();
    });
  });

  describe('Combined grounding validation', () => {
    it('should create model with both grounding methods (with warning)', () => {
      // This should not throw, but should log a warning
      expect(() => {
        openrouter('google/gemini-3-pro-preview', {
          url_grounding: {
            urls: ['https://example.com'],
          },
          google_search_retrieval: {},
        });
      }).not.toThrow();
    });
  });

  describe('Error messages', () => {
    it('should provide clear error message for empty urls', () => {
      try {
        openrouter('google/gemini-3-pro-preview', {
          url_grounding: {
            urls: [],
          },
        });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(GroundingValidationError);
        expect((error as Error).message).toContain(
          'url_grounding.urls must be a non-empty array',
        );
      }
    });

    it('should provide clear error message for invalid URL format', () => {
      try {
        openrouter('google/gemini-3-pro-preview', {
          url_grounding: {
            urls: ['invalid-url'],
          },
        });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(GroundingValidationError);
        expect((error as Error).message).toContain('Invalid URL format');
        expect((error as Error).message).toContain('invalid-url');
      }
    });

    it('should provide clear error message for invalid dynamic_threshold', () => {
      try {
        openrouter('google/gemini-3-pro-preview', {
          url_grounding: {
            urls: ['https://example.com'],
            dynamic_retrieval_config: {
              dynamic_threshold: 2.5,
            },
          },
        });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(GroundingValidationError);
        expect((error as Error).message).toContain(
          'Must be a number between 0 and 1',
        );
        expect((error as Error).message).toContain('2.5');
      }
    });
  });
});
