import OpenAI from "openai"

// Define error types for OpenRouter
interface OpenRouterError {
  error?: {
    message: string;
    code: number;
    metadata?: unknown;
  };
}

export const MODELS = {
  // Vision model for document analysis
  VISION: "meta-llama/llama-3.2-90b-vision-instruct:free",
  
  // Primary text analysis model
  FILE_ANALYSIS: "meta-llama/llama-3.1-405b-instruct:free",
  
  // Backup text analysis model
  TEXT_BACKUP: "meta-llama/llama-3.1-70b-instruct:free",
  
  // Chat model for interactive analysis
  CHAT: "openchat/openchat-7b:free",
  
  // Backup chat model
  CHAT_BACKUP: "mistralai/mistral-7b-instruct:free"
} as const

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("Missing OPENROUTER_API_KEY environment variable")
}

export const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
    "X-Title": "Project Ziio",
  }
}) 