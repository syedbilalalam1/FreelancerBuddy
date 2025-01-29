import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

interface AnswerSection {
  question: string
  answer: string
  pageNumber: number
}

export async function generateAnsweredPDF(
  originalPdfBytes: ArrayBuffer,
  answers: AnswerSection[]
): Promise<Uint8Array> {
  // Load the original PDF
  const pdfDoc = await PDFDocument.load(originalPdfBytes)
  
  // Embed the standard font
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
  
  // For each answer, create a new page after the question
  for (const section of answers) {
    // Create a new page
    const page = pdfDoc.addPage()
    
    // Set standard page size
    page.setSize(595, 842) // A4 size in points
    
    // Set margins and content area
    const margin = 50
    const contentWidth = page.getWidth() - 2 * margin
    let yPosition = page.getHeight() - margin
    
    // Add question reference
    page.drawText(`Question from Page ${section.pageNumber}:`, {
      x: margin,
      y: yPosition,
      font: boldFont,
      size: 12,
      color: rgb(0, 0, 0),
    })
    yPosition -= 20

    // Add the question text with word wrap
    const questionWords = section.question.split(' ')
    let currentLine = ''
    for (const word of questionWords) {
      const testLine = currentLine + word + ' '
      const textWidth = font.widthOfTextAtSize(testLine, 12)
      
      if (textWidth > contentWidth) {
        page.drawText(currentLine, {
          x: margin,
          y: yPosition,
          font: font,
          size: 12,
          color: rgb(0, 0, 0),
        })
        yPosition -= 16
        currentLine = word + ' '
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) {
      page.drawText(currentLine, {
        x: margin,
        y: yPosition,
        font: font,
        size: 12,
        color: rgb(0, 0, 0),
      })
      yPosition -= 30
    }

    // Add "Answer:" header
    page.drawText('Answer:', {
      x: margin,
      y: yPosition,
      font: boldFont,
      size: 12,
      color: rgb(0, 0, 0),
    })
    yPosition -= 20

    // Add the answer text with word wrap and proper paragraph formatting
    const paragraphs = section.answer.split('\n\n')
    for (const paragraph of paragraphs) {
      const words = paragraph.split(' ')
      let currentLine = ''
      
      for (const word of words) {
        const testLine = currentLine + word + ' '
        const textWidth = font.widthOfTextAtSize(testLine, 12)
        
        if (textWidth > contentWidth) {
          page.drawText(currentLine, {
            x: margin,
            y: yPosition,
            font: font,
            size: 12,
            color: rgb(0, 0, 0),
          })
          yPosition -= 16
          currentLine = word + ' '
        } else {
          currentLine = testLine
        }
      }
      
      if (currentLine) {
        page.drawText(currentLine, {
          x: margin,
          y: yPosition,
          font: font,
          size: 12,
          color: rgb(0, 0, 0),
        })
        yPosition -= 24 // Extra space between paragraphs
      }
    }
  }

  // Save the modified PDF
  return await pdfDoc.save()
}

export async function generatePuterAIAnswer(
  question: string,
  context: string,
  requirements: string[],
  customInstructions?: string
): Promise<string> {
  try {
    const response = await window.puter.ai.chat(
      `You are writing an academic answer. Directly answer the following question using the provided context. Write naturally as if you deeply understand the material.

First, analyze if the question contains multiple parts (a, b, c, d) or separate activities/tasks:
1. Check if there are labeled parts like (a), (b), (c), etc.
2. Look for numbered tasks or activities
3. Identify if there are multiple questions within the main question
4. Note any requirements for separate files, diagrams, or additional materials

Question to Answer:
${question}

Context Information:
${context}

Key Points to Consider:
${requirements.map(req => `- ${req}`).join('\n')}

${customInstructions ? `Custom Instructions:
${customInstructions}

` : ''}Important:
- If multiple parts exist, address each part separately but maintain flow
- Clearly indicate transitions between different parts/activities
- Write a direct, comprehensive answer
- Do not mention question numbers or page numbers
- Do not include any guidelines or meta-instructions
- Do not use AI-like formatting or bullet points
- Write in a natural academic style with proper paragraphing
- Seamlessly incorporate evidence from the context
- Let the answer flow naturally across paragraphs
- Use proper academic language while maintaining readability
- If diagrams or files are required, mention them naturally in the answer

Write your answer now:`,
      null
    )

    if (!response?.message?.content) {
      throw new Error('Failed to generate answer')
    }

    return response.message.content
  } catch (error) {
    console.error('Error generating AI answer:', error)
    return formatStudentAnswer(question, context, requirements)
  }
}

// Keep the formatStudentAnswer as fallback
export function formatStudentAnswer(
  question: string,
  context: string,
  requirements: string[]
): string {
  let answer = ''
  answer += generateIntroduction(question)
  answer += generateMainBody(context, requirements)
  answer += generateConclusion(question, requirements)
  return answer
}

export function generateIntroduction(question: string): string {
  return `Based on the analysis of the given materials, this response will address the key aspects of the question. The following discussion will examine the main points and provide a comprehensive answer supported by relevant evidence.

`
}

export function generateMainBody(context: string, requirements: string[]): string {
  let body = ''
  requirements.forEach((req, index) => {
    if (index > 0) {
      body += '\n\n'
    }
    body += `Furthermore, ${req.toLowerCase()} can be addressed by examining the evidence presented in the materials. The analysis reveals several key points that support this understanding.`
  })
  return body
}

export function generateConclusion(question: string, requirements: string[]): string {
  return `

In conclusion, the analysis demonstrates a clear understanding of the key concepts and requirements. The evidence presented supports the main arguments, and the discussion has addressed the central aspects of the question. This comprehensive examination provides a solid foundation for understanding the topic at hand.`
} 