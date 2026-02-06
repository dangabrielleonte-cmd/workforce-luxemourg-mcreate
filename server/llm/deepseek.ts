/**
 * DeepSeek API Integration
 * Replaces Manus LLM with open DeepSeek API
 */

import axios, { AxiosError } from "axios";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const API_KEY = process.env.DEEPSEEK_API_KEY;

if (!API_KEY) {
  console.warn(
    "DEEPSEEK_API_KEY not set. LLM features will not work. Set it in .env"
  );
}

export interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface DeepSeekRequest {
  messages: DeepSeekMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  response_format?: {
    type: "text" | "json_object";
  };
}

export interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call DeepSeek API
 * Returns the content of the first choice
 */
export async function callDeepSeek(request: DeepSeekRequest): Promise<string> {
  if (!API_KEY) {
    throw new Error("DEEPSEEK_API_KEY not configured");
  }

  try {
    const response = await axios.post<DeepSeekResponse>(DEEPSEEK_API_URL, {
      model: "deepseek-chat",
      ...request,
    }, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in DeepSeek response");
    }

    // Log token usage for cost tracking
    const tokens = response.data.usage?.total_tokens || 0;
    console.log(`[DeepSeek] Used ${tokens} tokens`);

    return content;
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("DeepSeek API error:", {
      status: axiosError.response?.status,
      data: axiosError.response?.data,
      message: axiosError.message,
    });
    throw new Error(`DeepSeek API failed: ${axiosError.message}`);
  }
}

/**
 * Stream response from DeepSeek (for future use)
 */
export async function* streamDeepSeek(
  request: DeepSeekRequest
): AsyncGenerator<string> {
  if (!API_KEY) {
    throw new Error("DEEPSEEK_API_KEY not configured");
  }

  try {
    const response = await axios.post(DEEPSEEK_API_URL, {
      model: "deepseek-chat",
      stream: true,
      ...request,
    }, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      responseType: "stream",
      timeout: 60000,
    });

    const stream = response.data;

    for await (const chunk of stream) {
      const lines = chunk.toString().split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    }
  } catch (error) {
    const axiosError = error as AxiosError;
    console.error("DeepSeek streaming error:", axiosError.message);
    throw new Error(`DeepSeek streaming failed: ${axiosError.message}`);
  }
}

/**
 * Cost estimation
 * DeepSeek pricing: $0.14 per 1M input tokens, $0.28 per 1M output tokens
 */
export function estimateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * 0.14;
  const outputCost = (outputTokens / 1_000_000) * 0.28;
  return inputCost + outputCost;
}

/**
 * Health check - verify API key works
 */
export async function healthCheck(): Promise<boolean> {
  if (!API_KEY) {
    return false;
  }

  try {
    await callDeepSeek({
      messages: [{ role: "user", content: "test" }],
      max_tokens: 10,
    });
    return true;
  } catch (error) {
    console.error("DeepSeek health check failed:", error);
    return false;
  }
}
