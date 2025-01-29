import { OpenAIStream, StreamingTextResponse } from "ai"
import { openai, MODELS } from "@/lib/openrouter"

export const runtime = "edge"

export async function POST(req: Request) {
  try {
    const { messages, fileContent, analysisMode, systemMessage, activeDocument } = await req.json()

    // Construct the system message based on the active document
    const baseSystemMessage = systemMessage || (activeDocument === 'questions' ?
      `You are an AI assistant specifically focused on analyzing assessment requirements. Your primary tasks are:

1. FIRST, clearly identify the type of assessment (e.g., Learning Assessment, Task, Assignment, Project Brief)
2. Break down and list ALL specific requirements the assessor is asking for
3. For each requirement:
   - Identify if it's a main task or sub-task
   - Note any specific deliverables mentioned
   - Highlight any marking criteria or weightage
   - Point out any specific constraints or conditions
4. When answering questions:
   - Always refer back to the specific assessment requirements
   - Cite relevant information from the context document
   - Explain how the context material helps address each requirement

Remember: Your primary goal is to ensure the student clearly understands WHAT the assessor is asking for before proceeding with any answers.` :
      `You are an AI assistant helping analyze documents. Provide detailed answers based on the document content.`)

    const fullSystemMessage = `${baseSystemMessage}

The following is the document content and analysis:

${fileContent}

${activeDocument === 'questions' ? 
  "IMPORTANT: Always start by identifying and listing the assessment requirements before providing any answers. Make sure to break down complex tasks into clear, manageable components." :
  "Provide detailed answers based on this content and analysis."}`

    const response = await openai.chat.completions.create({
      model: MODELS.CHAT,
      messages: [
        {
          role: "system",
          content: fullSystemMessage
        },
        ...messages
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
        const { messages, fileContent, analysisMode, systemMessage, activeDocument } = await req.json()
        
        const baseSystemMessage = systemMessage || (activeDocument === 'questions' ?
          `You are an AI assistant specifically focused on analyzing assessment requirements. Your primary tasks are:

1. FIRST, clearly identify the type of assessment (e.g., Learning Assessment, Task, Assignment, Project Brief)
2. Break down and list ALL specific requirements the assessor is asking for
3. For each requirement:
   - Identify if it's a main task or sub-task
   - Note any specific deliverables mentioned
   - Highlight any marking criteria or weightage
   - Point out any specific constraints or conditions
4. When answering questions:
   - Always refer back to the specific assessment requirements
   - Cite relevant information from the context document
   - Explain how the context material helps address each requirement

Remember: Your primary goal is to ensure the student clearly understands WHAT the assessor is asking for before proceeding with any answers.` :
          `You are an AI assistant helping analyze documents. Provide detailed answers based on the document content.`)

        const fullSystemMessage = `${baseSystemMessage}

The following is the document content and analysis:

${fileContent}

${activeDocument === 'questions' ? 
  "IMPORTANT: Always start by identifying and listing the assessment requirements before providing any answers. Make sure to break down complex tasks into clear, manageable components." :
  "Provide detailed answers based on this content and analysis."}`

        const fallbackResponse = await openai.chat.completions.create({
          model: MODELS.CHAT_BACKUP,
          messages: [
            {
              role: "system",
              content: fullSystemMessage
            },
            ...messages
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
        error: "Chat failed",
        details: error?.error?.message || "Unknown error"
      }),
      {
        status: error?.error?.code || 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

