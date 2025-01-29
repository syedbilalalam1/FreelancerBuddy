import { NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: "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",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "Project Ziio",
  }
})

export async function POST(req: Request) {
  try {
    const { imageUrl, pageNumber, totalPages } = await req.json()
    
    if (!imageUrl?.trim()) {
      return NextResponse.json(
        { error: "No image URL provided" },
        { status: 400 }
      )
    }

    const analysisPrompt = `You are an advanced academic assignment analyzer specializing in question papers, assignments, and assessments. Analyze the provided document image (page ${pageNumber} of ${totalPages}) and extract key information.

    Return ONLY a JSON object (no markdown, no code blocks) with the following structure:
    {
      "documentContext": {
        "type": "string (exam paper, assignment brief, research task, etc.)",
        "subject": "string (the academic subject/course)",
        "level": "string (undergraduate, postgraduate, etc.)",
        "estimatedTime": "string (estimated time to complete)",
        "totalMarks": "number (if specified)"
      },
      "keyComponents": {
        "mainTopics": ["string (list of main topics covered)"],
        "learningOutcomes": ["string (list of learning outcomes being assessed)"],
        "requiredResources": ["string (list of resources/materials needed)"]
      },
      "questions": [
        {
          "number": "string (question number/identifier)",
          "text": "string (the actual question)",
          "type": "string (multiple choice, essay, calculation, etc.)",
          "marks": "number (marks allocated)",
          "requirements": ["string (list of specific requirements)"],
          "suggestedApproach": "string (how to tackle this question)"
        }
      ],
      "importantInstructions": ["string (list of crucial instructions)"],
      "assessmentCriteria": ["string (list of marking criteria)"],
      "keyPages": [
        {
          "pageNumber": "number",
          "content": "string (what makes this page important)",
          "relevance": "string (why this page matters)"
        }
      ],
      "timeManagement": {
        "suggestedBreakdown": ["string (time allocation suggestions)"],
        "priorityOrder": ["string (suggested order of completion)"]
      },
      "summary": {
        "overview": "string (brief overview of the assessment)",
        "keyFocus": "string (what to focus on)",
        "commonPitfalls": ["string (things to avoid)"]
      }
    }

    Focus on providing actionable insights that will help in understanding and completing the assessment successfully.
    Since this is page ${pageNumber} of ${totalPages}, pay special attention to any page-specific content and its relevance to the overall document.`

    try {
      const response = await openai.chat.completions.create({
        model: "meta-llama/llama-3.2-90b-vision-instruct:free",
        messages: [
          { role: "system", content: analysisPrompt },
          { 
            role: "user", 
            content: [
              { type: "text", text: "Please analyze this page of the document." },
              { type: "image_url", image_url: imageUrl }
            ]
          }
        ],
        temperature: 0.7,
        stream: false
      })

      const completion = response.choices[0].message.content
      if (!completion) {
        throw new Error("No analysis results received")
      }

      // Clean the response of any markdown formatting
      const cleanedCompletion = completion
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      try {
        const parsedAnalysis = JSON.parse(cleanedCompletion)
        return NextResponse.json(parsedAnalysis)
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError)
        console.error("Cleaned Content:", cleanedCompletion)
        throw new Error("Failed to parse analysis results")
      }
    } catch (error: any) {
      // Try fallback model if rate limited or other error
      if (error?.status === 429 || error?.status === 503) {
        const fallbackResponse = await openai.chat.completions.create({
          model: "meta-llama/llama-3.1-405b-instruct:free",
          messages: [
            { role: "system", content: analysisPrompt },
            { 
              role: "user", 
              content: [
                { type: "text", text: "Please analyze this page of the document." },
                { type: "image_url", image_url: imageUrl }
              ]
            }
          ],
          temperature: 0.7,
          stream: false
        })
        
        const completion = fallbackResponse.choices[0].message.content
        if (!completion) {
          throw new Error("No analysis results received from fallback model")
        }

        // Clean the fallback response as well
        const cleanedCompletion = completion
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim()

        try {
          const parsedAnalysis = JSON.parse(cleanedCompletion)
          return NextResponse.json(parsedAnalysis)
        } catch (parseError) {
          console.error("Fallback JSON Parse Error:", parseError)
          console.error("Cleaned Fallback Content:", cleanedCompletion)
          throw new Error("Failed to parse fallback analysis results")
        }
      }
      
      throw error
    }
  } catch (error: any) {
    console.error("Analysis error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to analyze document" },
      { status: error.status || 500 }
    )
  }
} 