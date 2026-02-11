# OpenRouter Provider for Vercel AI SDK

The [OpenRouter](https://openrouter.ai/) provider for the [Vercel AI SDK](https://sdk.vercel.ai/docs) gives access to over 300 large language models on the OpenRouter chat and completion APIs.

## Setup for AI SDK v6

```bash
# For pnpm
pnpm add @openrouter/ai-sdk-provider

# For npm
npm install @openrouter/ai-sdk-provider

# For yarn
yarn add @openrouter/ai-sdk-provider
```

## (LEGACY) Setup for AI SDK v5

```bash
# For pnpm
pnpm add @openrouter/ai-sdk-provider@ai-sdk-v5

# For npm
npm install @openrouter/ai-sdk-provider@ai-sdk-v5

# For yarn
yarn add @openrouter/ai-sdk-provider@ai-sdk-v5
```

## Provider Instance

You can import the default provider instance `openrouter` from `@openrouter/ai-sdk-provider`:

```ts
import { openrouter } from '@openrouter/ai-sdk-provider';
```

## Example

```ts
import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

const { text } = await generateText({
  model: openrouter('openai/gpt-4o'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
});
```

## Supported models

This list is not a definitive list of models supported by OpenRouter, as it constantly changes as we add new models (and deprecate old ones) to our system. You can find the latest list of models supported by OpenRouter [here](https://openrouter.ai/models).

You can find the latest list of tool-supported models supported by OpenRouter [here](https://openrouter.ai/models?order=newest&supported_parameters=tools). (Note: This list may contain models that are not compatible with the AI SDK.)

## Embeddings

OpenRouter supports embedding models for semantic search, RAG pipelines, and vector-native features.

### Basic Usage

```ts
import { embed } from 'ai';
import { openrouter } from '@openrouter/ai-sdk-provider';

const { embedding } = await embed({
  model: openrouter.textEmbeddingModel('openai/text-embedding-3-small'),
  value: 'sunny day at the beach',
});

console.log(embedding); // Array of numbers representing the embedding
```

### Batch Embeddings

```ts
import { embedMany } from 'ai';
import { openrouter } from '@openrouter/ai-sdk-provider';

const { embeddings } = await embedMany({
  model: openrouter.textEmbeddingModel('openai/text-embedding-3-small'),
  values: [
    'sunny day at the beach',
    'rainy day in the city',
    'snowy mountain peak',
  ],
});

console.log(embeddings); // Array of embedding arrays
```

### Supported Embedding Models

OpenRouter supports various embedding models including:
- `openai/text-embedding-3-small`
- `openai/text-embedding-3-large`
- `openai/text-embedding-ada-002`
- And more available on [OpenRouter](https://openrouter.ai/models?output_modalities=embeddings)

## Passing Extra Body to OpenRouter

There are 3 ways to pass extra body to OpenRouter:

1. Via the `providerOptions.openrouter` property:

   ```typescript
   import { createOpenRouter } from '@openrouter/ai-sdk-provider';
   import { streamText } from 'ai';

   const openrouter = createOpenRouter({ apiKey: 'your-api-key' });
   const model = openrouter('anthropic/claude-3.7-sonnet:thinking');
   await streamText({
     model,
     messages: [{ role: 'user', content: 'Hello' }],
     providerOptions: {
       openrouter: {
         reasoning: {
           max_tokens: 10,
         },
       },
     },
   });
   ```

2. Via the `extraBody` property in the model settings:

   ```typescript
   import { createOpenRouter } from '@openrouter/ai-sdk-provider';
   import { streamText } from 'ai';

   const openrouter = createOpenRouter({ apiKey: 'your-api-key' });
   const model = openrouter('anthropic/claude-3.7-sonnet:thinking', {
     extraBody: {
       reasoning: {
         max_tokens: 10,
       },
     },
   });
   await streamText({
     model,
     messages: [{ role: 'user', content: 'Hello' }],
   });
   ```

3. Via the `extraBody` property in the model factory.

   ```typescript
   import { createOpenRouter } from '@openrouter/ai-sdk-provider';
   import { streamText } from 'ai';

   const openrouter = createOpenRouter({
     apiKey: 'your-api-key',
     extraBody: {
       reasoning: {
         max_tokens: 10,
       },
     },
   });
   const model = openrouter('anthropic/claude-3.7-sonnet:thinking');
   await streamText({
     model,
     messages: [{ role: 'user', content: 'Hello' }],
   });
   ```

## Anthropic Prompt Caching

You can include Anthropic-specific options directly in your messages when using functions like `streamText`. The OpenRouter provider will automatically convert these messages to the correct format internally.

### Basic Usage

```typescript
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';

const openrouter = createOpenRouter({ apiKey: 'your-api-key' });
const model = openrouter('anthropic/<supported-caching-model>');

await streamText({
  model,
  messages: [
    {
      role: 'system',
      content:
        'You are a podcast summary assistant. You are detail-oriented and critical about the content.',
    },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Given the text body below:',
        },
        {
          type: 'text',
          text: `<LARGE BODY OF TEXT>`,
          providerOptions: {
            openrouter: {
              cacheControl: { type: 'ephemeral' },
            },
          },
        },
        {
          type: 'text',
          text: 'List the speakers?',
        },
      ],
    },
  ],
});
```

## Anthropic Beta Features

You can enable Anthropic beta features by passing custom headers through the OpenRouter SDK.

### Fine-grained Tool Streaming

[Fine-grained tool streaming](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/fine-grained-tool-streaming) allows streaming tool parameters without buffering, reducing latency for large schemas. This is particularly useful when working with large nested JSON structures.

**Important:** This is a beta feature from Anthropic. Make sure to evaluate responses before using in production.

#### Basic Usage

```typescript
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamObject } from 'ai';

const provider = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'anthropic-beta': 'fine-grained-tool-streaming-2025-05-14',
  },
});

const model = provider.chat('anthropic/claude-sonnet-4');

const result = await streamObject({
  model,
  schema: yourLargeSchema,
  prompt: 'Generate a complex object...',
});

for await (const partialObject of result.partialObjectStream) {
  console.log(partialObject);
}
```

You can also pass the header at the request level:

```typescript
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

const provider = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const model = provider.chat('anthropic/claude-sonnet-4');

await generateText({
  model,
  prompt: 'Hello',
  headers: {
    'anthropic-beta': 'fine-grained-tool-streaming-2025-05-14',
  },
});
```

**Note:** Fine-grained tool streaming is specific to Anthropic models. When using models from other providers, the header will be ignored.

#### Use Case: Large Component Generation

This feature is particularly beneficial when streaming large, nested JSON structures like UI component trees:

```typescript
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamObject } from 'ai';
import { z } from 'zod';

const componentSchema = z.object({
  type: z.string(),
  props: z.record(z.any()),
  children: z.array(z.lazy(() => componentSchema)).optional(),
});

const provider = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'anthropic-beta': 'fine-grained-tool-streaming-2025-05-14',
  },
});

const model = provider.chat('anthropic/claude-sonnet-4');

const result = await streamObject({
  model,
  schema: componentSchema,
  prompt: 'Create a responsive dashboard layout',
});

for await (const partialComponent of result.partialObjectStream) {
  console.log('Partial component:', partialComponent);
}
```

## Grounding (URL Context & Google Search)

OpenRouter supports grounding with URL context and Google Search for supported models like Google Gemini. Grounding improves factual accuracy by using specific web content or real-time search results, and provides citations in responses.

### URL Grounding

URL grounding allows you to provide specific URLs that the model should use as context when generating responses. This is useful when you want the model to reference specific articles, documentation, or web pages.

#### Using the Convenience Method (Recommended)

```typescript
import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

const model = openrouter.urlGrounding('google/gemini-2.0-flash-exp', [
  'https://example.com/article1',
  'https://example.com/article2',
]);

const { text } = await generateText({
  model,
  prompt: 'Summarize the key points from these articles.',
});

console.log(text);
```

You can also pass a single URL as a string:

```typescript
const model = openrouter.urlGrounding(
  'google/gemini-2.0-flash-exp',
  'https://example.com/article',
);
```

#### Using Model Settings

```typescript
import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

const model = openrouter('google/gemini-2.0-flash-exp', {
  url_grounding: {
    urls: ['https://example.com/article1', 'https://example.com/article2'],
  },
});

const { text } = await generateText({
  model,
  prompt: 'Summarize the key points from these articles.',
});
```

#### Advanced: Dynamic Retrieval Configuration

You can control when URL grounding is applied using dynamic retrieval configuration:

```typescript
const model = openrouter('google/gemini-2.0-flash-exp', {
  url_grounding: {
    urls: ['https://example.com/article'],
    dynamic_retrieval_config: {
      mode: 'MODE_DYNAMIC', // 'MODE_UNSPECIFIED' | 'MODE_DYNAMIC' | 'MODE_STATIC'
      dynamic_threshold: 0.5, // Only applies when mode is MODE_DYNAMIC (0-1)
    },
  },
});
```

### Google Search Grounding

Google Search grounding provides real-time information from Google Search results to improve factual accuracy and provide up-to-date information.

#### Using the Convenience Method (Recommended)

```typescript
import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

const model = openrouter.googleSearch('google/gemini-2.0-flash-exp');

const { text } = await generateText({
  model,
  prompt: 'What are the latest developments in AI research?',
});

console.log(text);
```

#### Using Model Settings

```typescript
import { openrouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

const model = openrouter('google/gemini-2.0-flash-exp', {
  google_search_retrieval: {},
});

const { text } = await generateText({
  model,
  prompt: 'What are the latest developments in AI research?',
});
```

#### Advanced: Dynamic Retrieval Configuration

```typescript
const model = openrouter('google/gemini-2.0-flash-exp', {
  google_search_retrieval: {
    dynamic_retrieval_config: {
      mode: 'MODE_DYNAMIC',
      dynamic_threshold: 0.7,
    },
  },
});
```

### Supported Models

URL grounding and Google Search grounding are primarily supported by Google Gemini models. Check the [OpenRouter documentation](https://openrouter.ai/docs) for the latest list of supported models.

## Use Cases

### Response Healing for Structured Outputs

The provider supports the [Response Healing plugin](https://openrouter.ai/docs/guides/features/plugins/response-healing), which automatically validates and repairs malformed JSON responses from AI models. This is particularly useful when using `generateObject` or structured outputs, as it can fix common issues like missing brackets, trailing commas, markdown wrappers, and mixed text.

```typescript
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateObject } from 'ai';
import { z } from 'zod';

const openrouter = createOpenRouter({ apiKey: 'your-api-key' });
const model = openrouter('openai/gpt-4o', {
  plugins: [{ id: 'response-healing' }],
});

const { object } = await generateObject({
  model,
  schema: z.object({
    name: z.string(),
    age: z.number(),
  }),
  prompt: 'Generate a person with name and age.',
});

console.log(object); // { name: "John", age: 30 }
```

Note that Response Healing only works with non-streaming requests. When the model returns imperfect JSON formatting, the plugin attempts to repair the response so you receive valid, parseable JSON.

### Debugging API Requests

The provider supports a debug mode that echoes back the request body sent to the upstream provider. This is useful for troubleshooting and understanding how your requests are being processed. Note that debug mode only works with streaming requests.

```typescript
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';

const openrouter = createOpenRouter({ apiKey: 'your-api-key' });
const model = openrouter('anthropic/claude-3.5-sonnet', {
  debug: {
    echo_upstream_body: true,
  },
});

const result = await streamText({
  model,
  prompt: 'Hello, how are you?',
});

// The debug data is available in the stream's first chunk
// and in the final response's providerMetadata
for await (const chunk of result.fullStream) {
  // Debug chunks have empty choices and contain debug.echo_upstream_body
  console.log(chunk);
}
```

The debug response will include the request body that was sent to the upstream provider, with sensitive data redacted (user IDs, base64 content, etc.). This helps you understand how OpenRouter transforms your request before sending it to the model provider.

### Usage Accounting

The provider supports [OpenRouter usage accounting](https://openrouter.ai/docs/use-cases/usage-accounting), which allows you to track token usage details directly in your API responses, without making additional API calls.

```typescript
// Enable usage accounting
const model = openrouter('openai/gpt-3.5-turbo', {
  usage: {
    include: true,
  },
});

// Access usage accounting data
const result = await generateText({
  model,
  prompt: 'Hello, how are you today?',
});

// Provider-specific usage details (available in providerMetadata)
if (result.providerMetadata?.openrouter?.usage) {
  console.log('Cost:', result.providerMetadata.openrouter.usage.cost);
  console.log(
    'Total Tokens:',
    result.providerMetadata.openrouter.usage.totalTokens,
  );
}
```

It also supports BYOK (Bring Your Own Key) [usage accounting](https://openrouter.ai/docs/docs/guides/usage-accounting#cost-breakdown), which allows you to track passthrough costs when you are using a provider's own API key in your OpenRouter account.

```typescript
// Assuming you have set an OpenAI API key in https://openrouter.ai/settings/integrations

// Enable usage accounting
const model = openrouter('openai/gpt-3.5-turbo', {
  usage: {
    include: true,
  },
});

// Access usage accounting data
const result = await generateText({
  model,
  prompt: 'Hello, how are you today?',
});

// Provider-specific BYOK usage details (available in providerMetadata)
if (result.providerMetadata?.openrouter?.usage) {
  const costDetails = result.providerMetadata.openrouter.usage.costDetails;
  if (costDetails) {
    console.log('BYOK cost:', costDetails.upstreamInferenceCost);
  }
  console.log('OpenRouter credits cost:', result.providerMetadata.openrouter.usage.cost);
  console.log(
    'Total Tokens:',
    result.providerMetadata.openrouter.usage.totalTokens,
  );
}
```
