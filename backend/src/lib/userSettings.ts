import { createServerSupabase } from "./supabase";
import {
    resolveModel,
    DEFAULT_TITLE_MODEL,
    DEFAULT_TABULAR_MODEL,
    type UserApiKeys,
} from "./llm";

export type UserModelSettings = {
    title_model: string;
    tabular_model: string;
    api_keys: UserApiKeys;
};

// Title generation is a lightweight task — always routed to the cheapest model
// of whichever provider the user has keys for. When users only configure
// OpenRouter, use the OpenRouter low-tier model.
function hasConfiguredKey(value: string | null | undefined): boolean {
    const key = value?.trim();
    return !!key && key !== "your-anthropic-key";
}

function resolveTitleModel(apiKeys: UserApiKeys): string {
    if (hasConfiguredKey(apiKeys.openrouter) || hasConfiguredKey(process.env.OPENROUTER_API_KEY)) {
        return "openrouter/auto";
    }
    if (hasConfiguredKey(apiKeys.gemini) || hasConfiguredKey(process.env.GEMINI_API_KEY)) {
        return "gemini-3.1-flash-lite-preview";
    }
    if (hasConfiguredKey(apiKeys.claude) || hasConfiguredKey(process.env.ANTHROPIC_API_KEY)) {
        return "claude-haiku-4-5";
    }
    return DEFAULT_TITLE_MODEL;
}

export async function getUserModelSettings(
    userId: string,
    db?: ReturnType<typeof createServerSupabase>,
): Promise<UserModelSettings> {
    const client = db ?? createServerSupabase();
    const { data } = await client
        .from("user_profiles")
        .select("tabular_model, claude_api_key, gemini_api_key, openrouter_api_key")
        .eq("user_id", userId)
        .single();

    const api_keys: UserApiKeys = {
        claude: data?.claude_api_key ?? null,
        gemini: data?.gemini_api_key ?? null,
        openrouter: data?.openrouter_api_key ?? null,
    };

    return {
        title_model: resolveTitleModel(api_keys),
        tabular_model: resolveModel(data?.tabular_model, DEFAULT_TABULAR_MODEL),
        api_keys,
    };
}

export async function getUserApiKeys(
    userId: string,
    db?: ReturnType<typeof createServerSupabase>,
): Promise<UserApiKeys> {
    const client = db ?? createServerSupabase();
    const { data } = await client
        .from("user_profiles")
        .select("claude_api_key, gemini_api_key, openrouter_api_key")
        .eq("user_id", userId)
        .single();
    return {
        claude: data?.claude_api_key ?? null,
        gemini: data?.gemini_api_key ?? null,
        openrouter: data?.openrouter_api_key ?? null,
    };
}
