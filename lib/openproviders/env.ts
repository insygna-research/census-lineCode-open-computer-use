export const env = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY!,
  GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
  PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY!,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,
  XAI_API_KEY: process.env.XAI_API_KEY!,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY!,
  AZURE_OPENAI_API_KEY: process.env.AZURE_OPENAI_API_KEY!,
  AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT!,
  AZURE_OPENAI_DEPLOYMENT: process.env.AZURE_OPENAI_DEPLOYMENT!,
}

export function createEnvWithUserKeys(
  userKeys: Record<string, string> = {}
): typeof env {
  return {
    OPENAI_API_KEY: userKeys.openai || env.OPENAI_API_KEY,
    MISTRAL_API_KEY: userKeys.mistral || env.MISTRAL_API_KEY,
    PERPLEXITY_API_KEY: userKeys.perplexity || env.PERPLEXITY_API_KEY,
    GOOGLE_GENERATIVE_AI_API_KEY:
      userKeys.google || env.GOOGLE_GENERATIVE_AI_API_KEY,
    ANTHROPIC_API_KEY: userKeys.anthropic || env.ANTHROPIC_API_KEY,
    XAI_API_KEY: userKeys.xai || env.XAI_API_KEY,
    OPENROUTER_API_KEY: userKeys.openrouter || env.OPENROUTER_API_KEY,
    AZURE_OPENAI_API_KEY: userKeys.azure || env.AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_ENDPOINT: userKeys.azure_endpoint || env.AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_DEPLOYMENT: userKeys.azure_deployment || env.AZURE_OPENAI_DEPLOYMENT,
  }
}
