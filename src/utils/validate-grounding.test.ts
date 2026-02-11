import { describe, expect, it, vi } from 'vitest';
import {
  GroundingValidationError,
  validateAndLogGrounding,
  validateGoogleSearchRetrieval,
  validateUrlGrounding,
} from './validate-grounding';

describe('validateUrlGrounding', () => {
  it('should pass validation for valid URL grounding configuration', () => {
    expect(() => {
      validateUrlGrounding({
        urls: ['https://example.com', 'https://docs.example.com/page'],
      });
    }).not.toThrow();
  });

  it('should throw error when urls array is empty', () => {
    expect(() => {
      validateUrlGrounding({
        urls: [],
      });
    }).toThrow(GroundingValidationError);
    expect(() => {
      validateUrlGrounding({
        urls: [],
      });
    }).toThrow('url_grounding.urls must be a non-empty array of URLs');
  });

  it('should throw error when urls array contains non-string values', () => {
    expect(() => {
      validateUrlGrounding({
        urls: [123 as unknown as string],
      });
    }).toThrow(GroundingValidationError);
    expect(() => {
      validateUrlGrounding({
        urls: [123 as unknown as string],
      });
    }).toThrow('All URLs must be non-empty strings');
  });

  it('should throw error when urls array contains empty strings', () => {
    expect(() => {
      validateUrlGrounding({
        urls: [''],
      });
    }).toThrow(GroundingValidationError);
  });

  it('should throw error when urls array contains invalid URL format', () => {
    expect(() => {
      validateUrlGrounding({
        urls: ['not-a-valid-url'],
      });
    }).toThrow(GroundingValidationError);
    expect(() => {
      validateUrlGrounding({
        urls: ['not-a-valid-url'],
      });
    }).toThrow('Invalid URL format');
  });

  it('should validate dynamic_retrieval_config when present', () => {
    expect(() => {
      validateUrlGrounding({
        urls: ['https://example.com'],
        dynamic_retrieval_config: {
          mode: 'MODE_DYNAMIC',
          dynamic_threshold: 0.5,
        },
      });
    }).not.toThrow();
  });

  it('should throw error for invalid dynamic_threshold', () => {
    expect(() => {
      validateUrlGrounding({
        urls: ['https://example.com'],
        dynamic_retrieval_config: {
          dynamic_threshold: 1.5,
        },
      });
    }).toThrow(GroundingValidationError);
    expect(() => {
      validateUrlGrounding({
        urls: ['https://example.com'],
        dynamic_retrieval_config: {
          dynamic_threshold: 1.5,
        },
      });
    }).toThrow('Must be a number between 0 and 1');
  });

  it('should throw error for negative dynamic_threshold', () => {
    expect(() => {
      validateUrlGrounding({
        urls: ['https://example.com'],
        dynamic_retrieval_config: {
          dynamic_threshold: -0.1,
        },
      });
    }).toThrow(GroundingValidationError);
  });

  it('should warn when dynamic_threshold is set with non-DYNAMIC mode', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      /* noop */
    });

    validateUrlGrounding({
      urls: ['https://example.com'],
      dynamic_retrieval_config: {
        mode: 'MODE_STATIC',
        dynamic_threshold: 0.5,
      },
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "threshold only applies when mode is 'MODE_DYNAMIC'",
      ),
    );

    consoleWarnSpy.mockRestore();
  });
});

describe('validateGoogleSearchRetrieval', () => {
  it('should pass validation for empty configuration', () => {
    expect(() => {
      validateGoogleSearchRetrieval({});
    }).not.toThrow();
  });

  it('should validate dynamic_retrieval_config when present', () => {
    expect(() => {
      validateGoogleSearchRetrieval({
        dynamic_retrieval_config: {
          mode: 'MODE_DYNAMIC',
          dynamic_threshold: 0.7,
        },
      });
    }).not.toThrow();
  });

  it('should throw error for invalid dynamic_threshold', () => {
    expect(() => {
      validateGoogleSearchRetrieval({
        dynamic_retrieval_config: {
          dynamic_threshold: 2,
        },
      });
    }).toThrow(GroundingValidationError);
  });
});

describe('validateAndLogGrounding', () => {
  it('should pass validation when no grounding is configured', () => {
    const warnings = validateAndLogGrounding({});
    expect(warnings).toEqual([]);
  });

  it('should validate URL grounding when present', () => {
    expect(() => {
      validateAndLogGrounding({
        url_grounding: {
          urls: ['https://example.com'],
        },
      });
    }).not.toThrow();
  });

  it('should validate Google Search grounding when present', () => {
    const warnings = validateAndLogGrounding({
      google_search_retrieval: {
        dynamic_retrieval_config: {
          mode: 'MODE_DYNAMIC',
        },
      },
    });
    expect(warnings).toEqual([]);
  });

  it('should warn when both grounding methods are configured', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      /* noop */
    });

    const warnings = validateAndLogGrounding({
      url_grounding: {
        urls: ['https://example.com'],
      },
      google_search_retrieval: {},
    });

    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain(
      'Both url_grounding and google_search_retrieval are configured',
    );
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Both'));

    consoleWarnSpy.mockRestore();
  });

  it('should log debug information when DEBUG=openrouter is set', () => {
    const originalDebug = process.env.DEBUG;
    process.env.DEBUG = 'openrouter';

    const consoleDebugSpy = vi
      .spyOn(console, 'debug')
      .mockImplementation(() => {
        /* noop */
      });

    validateAndLogGrounding({
      url_grounding: {
        urls: ['https://example.com'],
      },
    });

    expect(consoleDebugSpy).toHaveBeenCalledWith(
      expect.stringContaining('URL grounding enabled'),
      expect.any(String),
    );

    consoleDebugSpy.mockRestore();
    process.env.DEBUG = originalDebug;
  });

  it('should throw error for invalid URL grounding configuration', () => {
    expect(() => {
      validateAndLogGrounding({
        url_grounding: {
          urls: [],
        },
      });
    }).toThrow(GroundingValidationError);
  });

  it('should throw error for invalid Google Search grounding configuration', () => {
    expect(() => {
      validateAndLogGrounding({
        google_search_retrieval: {
          dynamic_retrieval_config: {
            dynamic_threshold: 5,
          },
        },
      });
    }).toThrow(GroundingValidationError);
  });
});
