export class LlmConfigurationError extends Error {
    constructor(
        public readonly provider: string,
        message = `${provider} API key is missing. Add one in Account > Models & API Keys or configure it in backend/.env.`,
    ) {
        super(message);
        this.name = "LlmConfigurationError";
    }
}

export function hasUsableApiKey(value: string | null | undefined): boolean {
    const key = value?.trim();
    return !!key && key !== "your-anthropic-key";
}

export function requireApiKey(
    provider: string,
    override: string | null | undefined,
    envKey: string | undefined,
): string {
    const key = hasUsableApiKey(override) ? override?.trim() : envKey?.trim();
    if (!hasUsableApiKey(key)) {
        throw new LlmConfigurationError(provider);
    }
    return key as string;
}

export function userFacingLlmError(error: unknown): string {
    if (error instanceof LlmConfigurationError) return error.message;
    if (
        error instanceof Error &&
        error.message.toLowerCase().includes("insufficient credits")
    ) {
        return "OpenRouter accepted the API key, but says the key being used does not have enough available credits. Check that the saved API key belongs to the funded OpenRouter account, then try again.";
    }
    return "The selected model provider returned an error. Please check your API key, provider account, and model selection, then try again.";
}
