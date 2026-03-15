import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { fetchAllTokens } from '@/lib/api/pumpfun';

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are an elite memecoin researcher and AI agent integrated directly into the memepro.lite platform.
Your primary objective is to help users identify high-potential tokens, analyze market trends, and make informed trading decisions.

You have access to native tools and user-supplied MCP tools.
Always prioritize native tools for platform-specific data (pump.fun, holders, etc.).

When asked to find opportunities:
- Look for tokens with strong bonding curve progress.
- Look for healthy holder distributions.
- Check social presence.

Format responses in Markdown. Analysis is not financial advice.`;

async function fetchMCPTools(url: string) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      })
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.result?.tools || [];
  } catch (e) {
    console.error(`Failed to fetch tools from MCP server: ${url}`, e);
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const { messages, modelId, openRouterKey, mcpServers = [] } = await req.json();

    const apiKey = openRouterKey || process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OpenRouter API Key is required' }), { status: 400 });
    }

    const openrouter = createOpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
    });

    let openRouterModelId = 'anthropic/claude-3.5-sonnet';
    if (modelId === 'Opus 4.6') {
      openRouterModelId = 'anthropic/claude-3-opus:beta';
    } else if (modelId === 'GPT-5.4') {
      openRouterModelId = 'openai/gpt-4o';
    } else if (modelId === 'Grok 4.1 Flash') {
      openRouterModelId = 'x-ai/grok-beta';
    } else if (modelId) {
      openRouterModelId = modelId;
    }

    const tools: any = {
      get_sol_price: tool({
        description: 'Get the current price of Solana (SOL) in USD.',
        parameters: z.object({}),
        // @ts-expect-error strict return types
        execute: async () => {
          const res = await fetch(new URL('/api/price', req.url).toString());
          const data = await res.json();
          return { success: true, data: { priceUsd: data.solPrice } };
        },
      }),
      get_token_stream: tool({
        description: 'Fetch the current live stream of tokens from Pump.fun.',
        parameters: z.object({}),
        // @ts-expect-error strict return types
        execute: async () => {
          const data = await fetchAllTokens();
          return { success: true, data: data as any };
        },
      }),
      get_token_holders: tool({
        description: 'Fetch the real on-chain holder distribution for a specific token mint.',
        parameters: z.object({ mint: z.string() }),
        // @ts-expect-error strict return types
        execute: async ({ mint }) => {
          const res = await fetch(new URL(`/api/holders/${mint}`, req.url).toString());
          const data = await res.json();
          return { success: true, data: data as any };
        },
      }),
      web_fetch: tool({
        description: 'Fetch the text content of a URL.',
        parameters: z.object({ url: z.string() }),
        // @ts-expect-error strict return types
        execute: async ({ url }) => {
          const res = await fetch(url);
          const text = await res.text();
          return { success: true, data: { content: text.substring(0, 2000) } };
        },
      }),
    };

    for (const serverUrl of mcpServers) {
      const externalTools = await fetchMCPTools(serverUrl);
      for (const t of externalTools) {
        tools[`mcp_${t.name}`] = tool({
          description: t.description || 'External MCP tool',
          parameters: z.any(),
          // @ts-expect-error dynamic tool execution
          execute: async (args) => {
            const res = await fetch(serverUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: Math.random().toString(),
                method: 'tools/call',
                params: { name: t.name, arguments: args }
              })
            });
            const data = await res.json();
            return data.result;
          }
        });
      }
    }

    const result = streamText({
      model: openrouter(openRouterModelId),
      system: SYSTEM_PROMPT,
      messages,
      tools,
    });

    // @ts-expect-error dynamic stream result
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Research API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), { status: 500 });
  }
}
