import { OpenAIStream, StreamingTextResponse } from "ai"
import { openai } from "@/lib/openrouter"

export const runtime = "edge"

const MODELS = {
  PROOFREAD: "meta-llama/llama-3.2-3b-instruct:free",
  BACKUP: "mistralai/mistral-7b-instruct:free" // Using Mistral as backup since it's also good at text analysis
} as const

export async function POST(req: Request) {
  try {
    const response = await openai.chat.completions.create({
      model: MODELS.PROOFREAD,
      messages: [
        {
          role: "system",
          content: `You are an expert proofreader and writing assistant. Review the text for grammar, spelling, punctuation, and style issues.
Provide suggestions in JSON format with the following structure:
{
  "suggestions": [
    { "type": "grammar"|"spelling"|"style", "text": string, "replacement": string }
  ],
  "stats": {
    "words": number,
    "characters": number,
    "sentences": number
  },
  "score": {
    "readability": number,
    "grammar": number,
    "style": number
  }
}`
        },
        {
          role: "user",
          content: await req.text()
        }
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 2000
    })

    return new StreamingTextResponse(OpenAIStream(response))
  } catch (error: any) {
    // Try fallback model if primary fails
    if (error?.error?.code === 429 || error?.error?.code === 503) {
      try {
        const fallbackResponse = await openai.chat.completions.create({
          model: MODELS.BACKUP,
          messages: [
            {
              role: "system",
              content: `You are an expert proofreader and writing assistant. Review the text for grammar, spelling, punctuation, and style issues.
Provide suggestions in JSON format with the following structure:
{
  "suggestions": [
    { "type": "grammar"|"spelling"|"style", "text": string, "replacement": string }
  ],
  "stats": {
    "words": number,
    "characters": number,
    "sentences": number
  },
  "score": {
    "readability": number,
    "grammar": number,
    "style": number
  }
}`
            },
            {
              role: "user",
              content: await req.text()
            }
          ],
          stream: true,
          temperature: 0.7,
          max_tokens: 2000
        })
        return new StreamingTextResponse(OpenAIStream(fallbackResponse))
      } catch (fallbackError) {
        throw error // If fallback fails, throw original error
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: "Proofreading failed",
        details: error?.error?.message || "Unknown error"
      }),
      { 
        status: error?.error?.code || 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

