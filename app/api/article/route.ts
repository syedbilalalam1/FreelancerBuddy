import { OpenAIStream, StreamingTextResponse } from "ai"
import { openai, MODELS } from "@/lib/openrouter"

export const runtime = "edge"

export async function POST(req: Request) {
  const { topic, style, length } = await req.json()

  const response = await openai.chat.completions.create({
    model: MODELS.ARTICLE_WRITING,
    stream: true,
    messages: [
      {
        role: "system",
        content:
          'You are a professional article writer. Write engaging, well-researched articles that are informative and easy to read. Focus on maintaining a consistent tone and style throughout the piece. Structure the content with clear sections and smooth transitions.',
      },
      {
        role: "user",
        content: `Write an article about ${topic}. Style: ${style}. Target length: ${length} words.`,
      },
    ],
  })

  const stream = OpenAIStream(response)
  return new StreamingTextResponse(stream)
} 