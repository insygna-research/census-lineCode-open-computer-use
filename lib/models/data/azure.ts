import { openproviders } from "@/lib/openproviders"
import { ModelConfig } from "../types"

const azureModels: ModelConfig[] = [
  {
    id: "azure-gpt-4.1-nano",
    name: "Azure GPT-4.1 Nano",
    provider: "Azure OpenAI",
    providerId: "azure",
    modelFamily: "GPT-4.1",
    baseProviderId: "azure",
    description: "Azure-hosted GPT-4.1 Nano model",
    tags: ["azure", "gpt-4.1", "nano", "cloud"],
    contextWindow: 1048576,
    inputCost: 0.1,
    outputCost: 0.4,
    priceUnit: "per 1M tokens",
    vision: false,
    webSearch: true,
    tools: true,
    audio: false,
    openSource: false,
    accessible: true,
    speed: "Fast",
    website: "https://azure.microsoft.com/en-us/products/ai-services/openai-service/",
    apiDocs: "https://learn.microsoft.com/en-us/azure/ai-services/openai/",
    modelPage: "https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models",
    icon: "openai",
    apiSdk: (apiKey?: string) => openproviders("azure-gpt-4.1-nano", undefined, apiKey),
  },
]

export { azureModels } 