import type {
    StreamChatParams,
    StreamChatResult,
    NormalizedToolCall,
    OpenAIToolSchema,
} from "./types";
import { requireApiKey } from "./errors";

type OpenRouterToolCall = {
    id: string;
    type: "function";
    function: {
        name: string;
        arguments?: string;
    };
};

type OpenRouterMessage =
    | {
          role: "system" | "user" | "assistant";
          content: string | null;
          tool_calls?: OpenRouterToolCall[];
      }
    | {
          role: "tool";
          content: string;
          tool_call_id: string;
      };

type OpenRouterChoice = {
    finish_reason?: string | null;
    message?: {
        role?: string;
        content?: string | null;
        tool_calls?: OpenRouterToolCall[];
    };
};

type OpenRouterResponse = {
    choices?: OpenRouterChoice[];
    error?: {
        message?: string;
    };
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function getApiKey(override?: string | null): string {
    return requireApiKey("OpenRouter", override, process.env.OPENROUTER_API_KEY);
}

function requestHeaders(apiKey: string): Record<string, string> {
    const headers: Record<string, string> = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
    };
    const referer = process.env.OPENROUTER_HTTP_REFERER?.trim();
    if (referer) headers["HTTP-Referer"] = referer;
    const title =
        process.env.OPENROUTER_X_TITLE?.trim() ??
        process.env.OPENROUTER_TITLE?.trim();
    if (title) headers["X-Title"] = title;
    return headers;
}

function toNativeMessages(
    systemPrompt: string,
    messages: StreamChatParams["messages"],
): OpenRouterMessage[] {
    return [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
            role: m.role,
            content: m.content,
        })),
    ];
}

function toOpenRouterTools(tools: OpenAIToolSchema[]): OpenAIToolSchema[] {
    return tools.map((t) => ({
        type: "function",
        function: {
            name: t.function.name,
            description: t.function.description,
            parameters: t.function.parameters,
        },
    }));
}

function parseToolInput(args: string | undefined): Record<string, unknown> {
    if (!args?.trim()) return {};
    try {
        const parsed = JSON.parse(args) as unknown;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return {};
        }
        return parsed as Record<string, unknown>;
    } catch {
        return {};
    }
}

async function callOpenRouter(payload: Record<string, unknown>, apiKey: string): Promise<OpenRouterResponse> {
    const resp = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: requestHeaders(apiKey),
        body: JSON.stringify(payload),
    });

    let body: OpenRouterResponse;
    try {
        body = (await resp.json()) as OpenRouterResponse;
    } catch {
        body = {};
    }

    if (!resp.ok) {
        const detail = body.error?.message ?? `HTTP ${resp.status}`;
        throw new Error(`OpenRouter request failed: ${detail}`);
    }
    return body;
}

export async function streamOpenRouter(
    params: StreamChatParams,
): Promise<StreamChatResult> {
    const {
        model,
        systemPrompt,
        tools = [],
        callbacks = {},
        runTools,
        apiKeys,
    } = params;
    const maxIter = params.maxIterations ?? 10;
    const apiKey = getApiKey(apiKeys?.openrouter);
    const nativeTools = toOpenRouterTools(tools);

    const messages = toNativeMessages(systemPrompt, params.messages);
    let fullText = "";

    for (let iter = 0; iter < maxIter; iter++) {
        const response = await callOpenRouter(
            {
                model,
                messages,
                tools: nativeTools.length ? nativeTools : undefined,
                ...(nativeTools.length ? { tool_choice: "auto" } : {}),
            },
            apiKey,
        );
        const choice = response.choices?.[0];
        const content = choice?.message?.content ?? "";
        if (content) {
            fullText += content;
            callbacks.onContentDelta?.(content);
        }

        const toolCallsRaw = choice?.message?.tool_calls ?? [];
        const toolCalls: NormalizedToolCall[] = toolCallsRaw.map((call, idx) => {
            const normalized: NormalizedToolCall = {
                id: call.id || `${call.function.name}-${idx}`,
                name: call.function.name,
                input: parseToolInput(call.function.arguments),
            };
            callbacks.onToolCallStart?.(normalized);
            return normalized;
        });

        if (choice?.finish_reason !== "tool_calls" || !toolCalls.length || !runTools) {
            break;
        }

        const results = await runTools(toolCalls);

        messages.push({
            role: "assistant",
            content: content || null,
            tool_calls: toolCallsRaw,
        });
        for (const result of results) {
            messages.push({
                role: "tool",
                tool_call_id: result.tool_use_id,
                content: result.content,
            });
        }
    }

    return { fullText };
}

export async function completeOpenRouterText(params: {
    model: string;
    systemPrompt?: string;
    user: string;
    maxTokens?: number;
    apiKeys?: { openrouter?: string | null };
}): Promise<string> {
    const apiKey = getApiKey(params.apiKeys?.openrouter);
    const response = await callOpenRouter(
        {
            model: params.model,
            messages: [
                ...(params.systemPrompt
                    ? [{ role: "system", content: params.systemPrompt }]
                    : []),
                { role: "user", content: params.user },
            ],
            ...(params.maxTokens ? { max_tokens: params.maxTokens } : {}),
        },
        apiKey,
    );
    return response.choices?.[0]?.message?.content ?? "";
}
