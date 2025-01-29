"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, Upload, AlertCircle, FileSearch, AlertTriangle,
  MessageSquare, Download, PenTool, Loader2
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Document, Page } from 'react-pdf'
import { generateAnsweredPDF, generatePuterAIAnswer } from '@/lib/pdf-modifier'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

declare global {
  interface Window {
    pdfjsLib: any;
    puter: any;
  }
}

type SuggestionType = 'critical' | 'important' | 'minor'

interface Suggestion {
  issue: string
  suggestion: string
  context: string
}

interface KeyPage {
  pageNumber: number;
  content: string;
  relevance: string;
}

interface Analysis {
  documentContext: {
    type: string;
    subject: string;
    level: string;
    wordCount: number | undefined;
    keyTopics: string[];
  };
  contentBreakdown: {
    mainPoints: string[];
    definitions: Array<string | { term: string; definition: string }>;
    examples: string[];
    references: string[];
  };
  writingGuide: {
    suggestedPoints: string[];
    relevantSources: string[];
    keyQuotes: string[];
    possibleArguments: string[];
  };
  summary: {
    overview: string;
    keyPoints: string[];
    conclusionPoints: string[];
  };
  pageAnalysis: Array<{
    pageNumber: number;
    content: string;
    keyPoints: string[];
    usefulContent: string[];
    topics?: string[];
    arguments?: string[];
    evidence?: string[];
    connections?: string[];
    importance?: string;
  }>;
}

const OPENROUTER_API_KEY = "sk-or-v1-12bac4bb4b0b083d9ddb9e2b6e1c5f3b8f8f8f8f8f8f8f8f8f8f8f8f8f8f8f"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface DocumentAnalysis {
  context: Analysis | null;
  questions: Analysis | null;
}

interface PageAnalysisResult {
  pageNumber: number;
  content: {
    documentContext?: {
      type?: string;
      subject?: string;
      level?: string;
      wordCount?: number;
      keyTopics?: string[];
    };
    contentBreakdown?: {
      mainPoints?: string[];
      definitions?: string[];
      examples?: string[];
      references?: string[];
    };
    writingGuide?: {
      suggestedPoints?: string[];
      relevantSources?: string[];
      keyQuotes?: string[];
      possibleArguments?: string[];
    };
    summary?: {
      overview?: string;
      keyPoints?: string[];
      conclusionPoints?: string[];
    };
    pageAnalysis?: {
      pageNumber?: number;
      content?: string;
      keyPoints?: string[];
      usefulContent?: string[];
      topics?: string[];
      arguments?: string[];
      evidence?: string[];
      connections?: string[];
      importance?: string;
    };
  };
}

const LoadingSpinner = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center p-8 space-y-4">
    <div className="relative">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-primary" />
      </div>
    </div>
    <p className="text-sm font-medium text-muted-foreground animate-pulse">
      {message}
    </p>
  </div>
)

const FileAnalysis = () => {
  const [contextFile, setContextFile] = useState<File | null>(null)
  const [questionFile, setQuestionFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<DocumentAnalysis>({
    context: null,
    questions: null
  })
  const [activeDocument, setActiveDocument] = useState<'context' | 'questions'>('context')
  const [uploadStep, setUploadStep] = useState<'context' | 'questions' | 'complete'>('context')
  const [progress, setProgress] = useState(0)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [input, setInput] = useState("")
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [pageProgress, setPageProgress] = useState<string[]>([])
  const [isPdfLibReady, setIsPdfLibReady] = useState(false)
  const [isPdfLibLoading, setIsPdfLibLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isAiReady, setIsAiReady] = useState(false)
  const [currentPageView, setCurrentPageView] = useState(1)
  const [isGeneratingAnswers, setIsGeneratingAnswers] = useState(false)
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [customPrompt, setCustomPrompt] = useState("")

  // Initialize PDF.js and Puter
  useEffect(() => {
    const loadLibraries = async () => {
      try {
        setIsPdfLibLoading(true)
        console.log('🔄 Loading libraries...')
        
        // Load PDF.js
        const pdfScript = document.createElement('script')
        pdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
        pdfScript.async = true
        
        const pdfScriptLoaded = new Promise((resolve, reject) => {
          pdfScript.onload = resolve
          pdfScript.onerror = reject
        })
        
        // Load Puter
        const puterScript = document.createElement('script')
        puterScript.src = 'https://js.puter.com/v2/'
        puterScript.async = true
        
        const puterScriptLoaded = new Promise((resolve, reject) => {
          puterScript.onload = resolve
          puterScript.onerror = reject
        })
        
        document.head.appendChild(pdfScript)
        document.head.appendChild(puterScript)
        
        await Promise.all([pdfScriptLoaded, puterScriptLoaded])
        console.log('✅ Libraries loaded')
        
        // Wait for pdfjsLib and puter to be available
        while (!window.pdfjsLib || !window.puter) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        // Load and set worker
        console.log('🔄 Setting up PDF.js worker...')
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        
        // Initialize Puter
        console.log('🔄 Verifying Puter AI...')
        if (!window.puter?.ai?.chat) {
          throw new Error('Puter AI chat not available')
        }
        
        // Wait a moment for worker to be ready
        await new Promise(resolve => setTimeout(resolve, 500))
        
        console.log('✅ PDF.js worker and Puter AI initialized')
        setIsPdfLibReady(true)
      } catch (error) {
        console.error('❌ Error loading libraries:', error)
        toast({
          title: "Loading Error",
          description: "Failed to load required libraries. Please refresh the page.",
          variant: "destructive",
        })
      } finally {
        setIsPdfLibLoading(false)
      }
    }

    loadLibraries()
    
    return () => {
      const scripts = document.querySelectorAll('script')
      scripts.forEach(script => {
        if (script.src.includes('pdf.js') || script.src.includes('puter.com')) {
          document.head.removeChild(script)
        }
      })
    }
  }, [])

  const uploadToImgHippo = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('api_key', 'f7704f5db4df2aae8a29ea150a1dcbb9')
    formData.append('file', file)
    formData.append('title', file.name)
    
    try {
      const response = await fetch('https://api.imghippo.com/v1/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Upload failed')
      }

      return data.data.view_url
    } catch (error) {
      console.error('Image upload error:', error)
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const analyzeImages = async (imageUrls: string[]): Promise<Analysis> => {
    try {
      console.log('🔍 Starting document analysis...')
      setPageProgress(prev => [...prev, 'Starting document analysis...'])
      
      const pageResults: PageAnalysisResult[] = []
      
      // First analyze each page individually
      for (let i = 0; i < imageUrls.length; i++) {
        console.log(`\n📄 Analyzing page ${i + 1}/${imageUrls.length}...`)
        setPageProgress(prev => [...prev, `Analyzing page ${i + 1}...`])
        
        try {
          // Use Puter AI to analyze the image
          console.log(`   🤖 Analyzing with Puter AI...`)
          const response = await window.puter.ai.chat(
            `You are an expert document analyzer focused on extracting detailed content for writing assignments. Your task is to analyze this image and return ONLY a JSON response in the exact format specified below.

IMPORTANT: You must ONLY return a JSON object. Do not include any other text or explanation.
If you cannot analyze the image, return a JSON object with default/empty values.

Required JSON format:
{
  "documentContext": {
    "type": "string (e.g., Assignment, Report, Case Study)",
    "subject": "string (detailed subject area)",
    "level": "string (academic level)",
    "wordCount": null,
    "keyTopics": ["list of main topics covered"]
  },
  "contentBreakdown": {
    "mainPoints": ["detailed list of key arguments or points"],
    "definitions": ["important terms and their detailed explanations"],
    "examples": ["detailed examples with context"],
    "references": ["cited works, sources, or relevant materials"]
  },
  "writingGuide": {
    "suggestedPoints": ["detailed writing suggestions with explanations"],
    "relevantSources": ["recommended sources with brief descriptions"],
    "keyQuotes": ["important quotes with context and page references"],
    "possibleArguments": ["potential arguments to develop with supporting points"]
  },
  "summary": {
    "overview": "detailed overview of the document's purpose and scope",
    "keyPoints": ["comprehensive list of critical points"],
    "conclusionPoints": ["key takeaways and concluding arguments"]
  },
  "pageAnalysis": {
    "pageNumber": ${i + 1},
    "content": "detailed summary of this specific page's content",
    "keyPoints": ["key points from this specific page"],
    "usefulContent": ["specific content pieces useful for writing"],
    "topics": ["main topics covered on this page"],
    "arguments": ["arguments presented on this page"],
    "evidence": ["evidence or examples provided on this page"],
    "connections": ["connections to other pages or concepts"],
    "importance": "explanation of this page's importance in the overall document"
  }
}

This is page ${i + 1} of ${imageUrls.length} - focus on providing detailed, academic-level analysis that would be useful for writing assignments.
For the page analysis:
1. Provide a thorough summary of what this specific page contains
2. Extract all key points unique to this page
3. Note any arguments or evidence presented
4. Identify connections to other parts of the document
5. Explain the page's importance in the overall document flow
6. Include any quotes or specific content that could be directly used in writing

Remember: Return ONLY the JSON object, no other text.`,
            imageUrls[i]
          )

          console.log(`   📥 Raw AI response for page ${i + 1}:`, response)
          
          // Parse the JSON from the response
          let parsedAnalysis
          try {
            // Extract JSON if it's wrapped in backticks or exists in the response
            const content = response.message?.content || ''
            let jsonStr = content.trim()
            
            // Try to find JSON in the response
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              jsonStr = jsonMatch[0]
            }
            
            try {
              parsedAnalysis = JSON.parse(jsonStr)
              console.log(`   ✅ Page ${i + 1} analysis parsed successfully:`, parsedAnalysis)
            } catch (parseError) {
              console.error(`   ⚠️ Error parsing JSON for page ${i + 1}:`, parseError)
              // Use default structure for failed parse
              parsedAnalysis = {
                documentContext: {
                  type: "Unknown",
                  subject: "Unknown",
                  level: "Unknown",
                  wordCount: undefined,
                  keyTopics: []
                },
                contentBreakdown: {
                  mainPoints: [],
                  definitions: [],
                  examples: [],
                  references: []
                },
                writingGuide: {
                  suggestedPoints: [],
                  relevantSources: [],
                  keyQuotes: [],
                  possibleArguments: []
                },
                summary: {
                  overview: "Failed to parse page analysis",
                  keyPoints: [],
                  conclusionPoints: []
                },
                pageAnalysis: {
                  pageNumber: 0,
                  content: "",
                  keyPoints: [],
                  usefulContent: [],
                  topics: [],
                  arguments: [],
                  evidence: [],
                  connections: [],
                  importance: ""
                }
              }
            }
            
            pageResults.push({
              pageNumber: i + 1,
              content: parsedAnalysis
            })
            
            setPageProgress(prev => [
              ...prev.slice(0, -1),
              `Completed analysis of page ${i + 1}`
            ])
            
          } catch (error) {
            console.error(`   ❌ Error processing page ${i + 1}:`, error)
            throw error
          }
        } catch (error) {
          console.error(`   ❌ Error analyzing page ${i + 1}:`, error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          
          setPageProgress(prev => [
            ...prev.slice(0, -1),
            `Error analyzing page ${i + 1}: ${errorMessage}`
          ])
          
          // Add a basic result for failed pages
          pageResults.push({
            pageNumber: i + 1,
            content: {
              documentContext: {
                type: "Error",
                subject: "Error",
                level: "Error",
                wordCount: undefined,
                keyTopics: []
              },
              contentBreakdown: {
                mainPoints: [],
                definitions: [],
                examples: [],
                references: []
              },
              writingGuide: {
                suggestedPoints: [],
                relevantSources: [],
                keyQuotes: [],
                possibleArguments: []
              },
              summary: {
                overview: "Analysis failed",
                keyPoints: [],
                conclusionPoints: []
              },
              pageAnalysis: {
                pageNumber: 0,
                content: "",
                keyPoints: [],
                usefulContent: [],
                topics: [],
                arguments: [],
                evidence: [],
                connections: [],
                importance: ""
              }
            }
          })
        }
      }
      
      // Now get a complete analysis of all pages
      try {
        console.log('\n🔄 Getting complete document analysis...')
        setPageProgress(prev => [...prev, 'Analyzing complete document...'])
        
        const allUrls = imageUrls.join('\n')
        const finalResponse = await window.puter.ai.chat(
          `You are an expert document analyzer focused on extracting content for writing assignments. Your task is to analyze these images and return ONLY a JSON response in the exact format specified below.

IMPORTANT: You must ONLY return a JSON object. Do not include any other text or explanation.
If you cannot analyze the images, return a JSON object with default/empty values.

The URLs to analyze are:
${allUrls}

Required JSON format:
{
  "documentContext": {
    "type": "string",
    "subject": "string",
    "level": "string",
    "wordCount": null,
    "keyTopics": []
  },
  "contentBreakdown": {
    "mainPoints": [],
    "definitions": [],
    "examples": [],
    "references": []
  },
  "writingGuide": {
    "suggestedPoints": [],
    "relevantSources": [],
    "keyQuotes": [],
    "possibleArguments": []
  },
  "summary": {
    "overview": "string",
    "keyPoints": [],
    "conclusionPoints": []
  },
  "pageAnalysis": [{
    "pageNumber": "number",
    "content": "detailed summary of this specific page's content",
    "keyPoints": ["key points from this specific page"],
    "usefulContent": ["specific content pieces useful for writing"],
    "topics": ["main topics covered on this page"],
    "arguments": ["arguments presented on this page"],
    "evidence": ["evidence or examples provided on this page"],
    "connections": ["connections to other pages or concepts"],
    "importance": "explanation of this page's importance in the overall document"
  }]
}

Remember: Return ONLY the JSON object, no other text.
Focus on extracting content that would be useful for writing an assignment.
Provide detailed page-by-page analysis with clear connections between pages.
Include key points, quotes, references, and any content that could be used directly in writing.`,
          imageUrls[0]
        )

        console.log('📥 Raw final analysis response:', finalResponse)
        
        let finalAnalysis: Analysis
        try {
          const content = finalResponse.message?.content || ''
          
          // Try to find JSON in the response
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          let jsonStr = jsonMatch ? jsonMatch[0] : content.trim()
          
          try {
            const parsedFinalAnalysis = JSON.parse(jsonStr)
            console.log('✅ Final analysis parsed successfully:', parsedFinalAnalysis)
            
            finalAnalysis = {
              documentContext: {
                type: parsedFinalAnalysis.documentContext?.type || "Unknown",
                subject: parsedFinalAnalysis.documentContext?.subject || "Unknown",
                level: parsedFinalAnalysis.documentContext?.level || "Unknown",
                wordCount: parsedFinalAnalysis.documentContext?.wordCount ?? undefined,
                keyTopics: parsedFinalAnalysis.documentContext?.keyTopics || []
              },
              contentBreakdown: {
                mainPoints: parsedFinalAnalysis.contentBreakdown?.mainPoints || [],
                definitions: parsedFinalAnalysis.contentBreakdown?.definitions || [],
                examples: parsedFinalAnalysis.contentBreakdown?.examples || [],
                references: parsedFinalAnalysis.contentBreakdown?.references || []
              },
              writingGuide: {
                suggestedPoints: parsedFinalAnalysis.writingGuide?.suggestedPoints || [],
                relevantSources: parsedFinalAnalysis.writingGuide?.relevantSources || [],
                keyQuotes: parsedFinalAnalysis.writingGuide?.keyQuotes || [],
                possibleArguments: parsedFinalAnalysis.writingGuide?.possibleArguments || []
              },
              summary: {
                overview: parsedFinalAnalysis.summary?.overview || "No overview available",
                keyPoints: parsedFinalAnalysis.summary?.keyPoints || [],
                conclusionPoints: parsedFinalAnalysis.summary?.conclusionPoints || []
              },
              pageAnalysis: pageResults.map(result => ({
                pageNumber: result.pageNumber,
                content: result.content.pageAnalysis?.content || result.content.summary?.overview || "No content available",
                keyPoints: result.content.pageAnalysis?.keyPoints || [],
                usefulContent: result.content.pageAnalysis?.usefulContent || [],
                topics: result.content.pageAnalysis?.topics || [],
                arguments: result.content.pageAnalysis?.arguments || [],
                evidence: result.content.pageAnalysis?.evidence || [],
                connections: result.content.pageAnalysis?.connections || [],
                importance: result.content.pageAnalysis?.importance || ""
              }))
            }
            
            return finalAnalysis
            
          } catch (parseError) {
            console.error('JSON Parse Error:', parseError)
            console.log('Attempted to parse:', jsonStr)
            
            // If final analysis parsing fails, construct from individual page analyses
            finalAnalysis = {
              documentContext: {
                type: pageResults[0]?.content?.documentContext?.type || "Unknown",
                subject: pageResults[0]?.content?.documentContext?.subject || "Unknown",
                level: pageResults[0]?.content?.documentContext?.level || "Unknown",
                wordCount: pageResults[0]?.content?.documentContext?.wordCount ?? undefined,
                keyTopics: Array.from(new Set(pageResults.flatMap(r => r.content.documentContext?.keyTopics || [])))
              },
              contentBreakdown: {
                mainPoints: Array.from(new Set(pageResults.flatMap(r => r.content.contentBreakdown?.mainPoints || []))),
                definitions: Array.from(new Set(pageResults.flatMap(r => r.content.contentBreakdown?.definitions || []))),
                examples: Array.from(new Set(pageResults.flatMap(r => r.content.contentBreakdown?.examples || []))),
                references: Array.from(new Set(pageResults.flatMap(r => r.content.contentBreakdown?.references || [])))
              },
              writingGuide: {
                suggestedPoints: Array.from(new Set(pageResults.flatMap(r => r.content.writingGuide?.suggestedPoints || []))),
                relevantSources: Array.from(new Set(pageResults.flatMap(r => r.content.writingGuide?.relevantSources || []))),
                keyQuotes: Array.from(new Set(pageResults.flatMap(r => r.content.writingGuide?.keyQuotes || []))),
                possibleArguments: Array.from(new Set(pageResults.flatMap(r => r.content.writingGuide?.possibleArguments || [])))
              },
              summary: {
                overview: pageResults[0]?.content?.summary?.overview || "No overview available",
                keyPoints: Array.from(new Set(pageResults.flatMap(r => r.content.summary?.keyPoints || []))),
                conclusionPoints: Array.from(new Set(pageResults.flatMap(r => r.content.summary?.conclusionPoints || [])))
              },
              pageAnalysis: pageResults.map(result => ({
                pageNumber: result.pageNumber,
                content: result.content.pageAnalysis?.content || result.content.summary?.overview || "No content available",
                keyPoints: result.content.pageAnalysis?.keyPoints || [],
                usefulContent: result.content.pageAnalysis?.usefulContent || [],
                topics: result.content.pageAnalysis?.topics || [],
                arguments: result.content.pageAnalysis?.arguments || [],
                evidence: result.content.pageAnalysis?.evidence || [],
                connections: result.content.pageAnalysis?.connections || [],
                importance: result.content.pageAnalysis?.importance || ""
              }))
            }
            
            return finalAnalysis
          }
        } catch (error) {
          console.error('⚠️ Error parsing final analysis:', error)
          throw new Error('Failed to parse final analysis')
        }
      } catch (error) {
        console.error('❌ Error getting final analysis:', error)
        throw error
      }
    } catch (error) {
      console.error('❌ Error in analysis:', error)
      throw error
    }
  }

  const handleAnalyze = async (file: File, type: 'context' | 'questions') => {
    if (!isPdfLibReady) {
      console.log('❌ PDF.js library not ready')
      toast({
        title: "PDF Library Not Ready",
        description: "Please wait a moment and try again.",
        variant: "destructive",
      })
      return
    }

    try {
      console.log('🚀 Starting PDF analysis...')
      console.log('📄 File:', file.name, '| Size:', (file.size / 1024 / 1024).toFixed(2) + 'MB')
      
      setIsAnalyzing(true)
      setAnalysis(prev => ({
        ...prev,
        [type]: null
      }))
      setFileContent(null)
      setPageProgress([])
      
      // Get PDF document
      console.log('📚 Loading PDF document...')
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const totalPages = pdf.numPages
      console.log(`📑 Total pages detected: ${totalPages}`)
      
      setTotalPages(totalPages)
      setPageProgress(prev => [...prev, `Processing document...`])
      
      // Process each page
      const imageUrls: string[] = []
      console.log('🔄 Starting page processing...')
      
      for (let i = 1; i <= totalPages; i++) {
        console.log(`\n📄 Processing page ${i}/${totalPages}...`)
        setCurrentPage(i)
        setPageProgress(prev => [...prev, `Processing page ${i}...`])
        
        try {
          // Convert PDF page to image
          console.log(`   ⚙️ Converting page ${i} to image...`)
          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale: 2.0 })
          console.log(`   📐 Viewport size: ${viewport.width}x${viewport.height}`)
          
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      const context = canvas.getContext('2d')
      
      if (!context) {
        throw new Error('Failed to get canvas context')
      }
      
          console.log(`   🎨 Rendering page to canvas...`)
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise
      
          // Convert canvas to blob
          console.log(`   💾 Converting canvas to blob...`)
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob)
                } else {
                  reject(new Error('Failed to convert canvas to blob'))
                }
              },
              'image/png',
              1.0
            )
          })
          
          // Create File object for upload
          const imageFile = new File([blob], `page-${i}.png`, { type: 'image/png' })
          console.log(`   📦 Created image file: ${imageFile.name} (${(imageFile.size / 1024).toFixed(2)}KB)`)
          
          // Upload to ImgHippo
          console.log(`   ⬆️ Uploading to ImgHippo...`)
          setPageProgress(prev => [...prev, `Uploading page ${i} to ImgHippo...`])
          
          const imageUrl = await uploadToImgHippo(imageFile)
          console.log(`   ✅ Upload successful! URL: ${imageUrl}`)
          imageUrls.push(imageUrl)
          
          setPageProgress(prev => [
            ...prev.slice(0, -1),
            `Successfully uploaded page ${i}`
          ])
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          console.error(`   ❌ Error processing page ${i}:`, error)
          setPageProgress(prev => [
            ...prev.slice(0, -1),
            `Error processing page ${i}: ${errorMessage}`
          ])
          throw error
        }
      }
      
      console.log('\n✨ All pages processed successfully!')
      console.log('📊 Summary:')
      console.log(`   - Total pages processed: ${totalPages}`)
      console.log(`   - Total images uploaded: ${imageUrls.length}`)
      console.log('📝 Image URLs:', imageUrls)
      
      setPageProgress(prev => [...prev, `Successfully processed all pages`])
      
      // Start analysis
      const analysisResult = await analyzeImages(imageUrls)
      
      if (analysisResult) {
        console.log('📊 Setting final analysis:', analysisResult)
        setAnalysis(prev => ({
          ...prev,
          [type]: analysisResult
        }))
        setPageProgress(prev => [...prev, 'Analysis complete!'])
        
        // Initialize chat with welcome message
        const initialMessage: ChatMessage = {
          role: "assistant",
          content: "I've analyzed your document and I'm ready to help! You can ask me anything about the content or how to use it in your writing."
        }
        setMessages([initialMessage])
        setIsAiReady(true)
      } else {
        console.error('❌ No analysis results available')
        throw new Error('Failed to get analysis results')
      }
      
    } catch (error) {
      console.error("❌ Analysis failed:", error)
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Error analyzing your document.",
        variant: "destructive",
      })
    } finally {
      console.log('🏁 Analysis process completed')
      setIsAnalyzing(false)
    }
  }

  const onDropContext = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    
    const file = acceptedFiles[0]
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive"
      })
      return
    }

    if (!isPdfLibReady) {
      toast({
        title: "PDF Library Not Ready",
        description: "Please wait while we initialize the PDF processor...",
        variant: "destructive"
      })
      return
    }

    setContextFile(file)
    await handleAnalyze(file, 'context')
    setUploadStep('questions')
  }, [isPdfLibReady])

  const onDropQuestions = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    
    const file = acceptedFiles[0]
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive"
      })
      return
    }

    if (!isPdfLibReady) {
      toast({
        title: "PDF Library Not Ready",
        description: "Please wait while we initialize the PDF processor...",
        variant: "destructive"
      })
      return
    }

    setQuestionFile(file)
    await handleAnalyze(file, 'questions')
    setUploadStep('complete')
  }, [isPdfLibReady])

  const {
    getRootProps: getContextRootProps,
    getInputProps: getContextInputProps
  } = useDropzone({
    onDrop: onDropContext,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf']
    }
  })

  const {
    getRootProps: getQuestionsRootProps,
    getInputProps: getQuestionsInputProps
  } = useDropzone({
    onDrop: onDropQuestions,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf']
    }
  })

  const getSystemPrompt = (mode: 'quick' | 'deep' | 'technical') => {
    const prompts = {
      quick: "Focus on essential elements: grammar, spelling, and basic style. Provide a quick overview.",
      deep: "Perform an in-depth analysis including tone, style, structure, and detailed suggestions.",
      technical: "Focus on technical accuracy, terminology consistency, and technical writing best practices."
    }

    return `You are an advanced document analyzer powered by Llama Vision. Analyze the given text and provide a comprehensive analysis in JSON format.
${prompts[mode]}

Return your analysis as a JSON object with the following structure:
{
  "analysis": {
    "overview": {
      "readabilityScore": number (0-100),
      "technicalAccuracy": number (0-100),
      "styleConsistency": number (0-100),
      "overallScore": number (0-100)
    },
    "structure": {
      "wordCount": number,
      "sentenceCount": number,
      "paragraphCount": number
    },
    "language": {
      "tone": string,
      "style": string,
      "complexity": string
    },
    "suggestions": {
      "critical": [{ issue: string, suggestion: string }],
      "important": [{ issue: string, suggestion: string }],
      "minor": [{ issue: string, suggestion: string }]
    },
    "keywords": string[],
    "strengths": string[],
    "improvement_areas": string[]
  }
}`
  }

  const getScoreColor = (score?: number) => {
    if (!score) return "text-gray-500"
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  const getSuggestionIcon = (type: SuggestionType) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'important':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'minor':
        return <AlertCircle className="h-4 w-4 text-blue-500" />
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const sendMessage = async (content: string) => {
    try {
      const newMessages: ChatMessage[] = [...messages, { role: "user", content }]
      setMessages(newMessages)
      setInput("")

      // Create a detailed context that includes both context and questions when in questions view
      const contextPrompt = activeDocument === 'questions' && analysis.context && analysis.questions ? `
Context Document Analysis:
Type: ${analysis.context.documentContext.type}
Subject: ${analysis.context.documentContext.subject}
Level: ${analysis.context.documentContext.level}
${analysis.context.documentContext.wordCount ? `Word Count: ${analysis.context.documentContext.wordCount}` : ''}

Context Key Topics:
${analysis.context.documentContext.keyTopics.map(topic => `- ${topic}`).join('\n')}

Context Main Points:
${analysis.context.contentBreakdown.mainPoints.map(point => `- ${point}`).join('\n')}

Context Key Definitions:
${analysis.context.contentBreakdown.definitions.map(def => `- ${def}`).join('\n')}

Questions Document Analysis:
Type: ${analysis.questions.documentContext.type}
Subject: ${analysis.questions.documentContext.subject}
Level: ${analysis.questions.documentContext.level}

Questions Overview:
${analysis.questions.summary.overview}

Questions Key Points:
${analysis.questions.summary.keyPoints.map(point => `- ${point}`).join('\n')}

Questions Page-by-Page Analysis:
${analysis.questions.pageAnalysis.map(page => `
Page ${page.pageNumber}:
Content: ${page.content}
Key Points:
${page.keyPoints.map(point => `- ${point}`).join('\n')}
Useful Content:
${page.usefulContent.map(content => `- ${content}`).join('\n')}
`).join('\n')}

Context Document References:
${analysis.context.contentBreakdown.references.map(ref => `- ${ref}`).join('\n')}

Writing Guide from Context:
${analysis.context.writingGuide.suggestedPoints.map(point => `- ${point}`).join('\n')}
` : analysis[activeDocument] ? `
Document Context:
- Type: ${analysis[activeDocument]?.documentContext.type}
- Subject: ${analysis[activeDocument]?.documentContext.subject}
- Level: ${analysis[activeDocument]?.documentContext.level}
${analysis[activeDocument]?.documentContext.wordCount ? `- Word Count: ${analysis[activeDocument]?.documentContext.wordCount}` : ''}

Key Topics:
${analysis[activeDocument]?.documentContext.keyTopics.map(topic => `- ${topic}`).join('\n')}

Main Points:
${analysis[activeDocument]?.contentBreakdown.mainPoints.map(point => `- ${point}`).join('\n')}

Key Definitions:
${analysis[activeDocument]?.contentBreakdown.definitions.map(def => `- ${def}`).join('\n')}

Examples:
${analysis[activeDocument]?.contentBreakdown.examples.map(example => `- ${example}`).join('\n')}

References:
${analysis[activeDocument]?.contentBreakdown.references.map(ref => `- ${ref}`).join('\n')}

Writing Guide:
${analysis[activeDocument]?.writingGuide.suggestedPoints.map(point => `- ${point}`).join('\n')}

Page-by-Page Analysis:
${analysis[activeDocument]?.pageAnalysis.map(page => `
Page ${page.pageNumber}:
Content: ${page.content}
Key Points:
${page.keyPoints.map(point => `- ${point}`).join('\n')}
Useful Content:
${page.usefulContent.map(content => `- ${content}`).join('\n')}
`).join('\n')}
` : "No analysis available."

      // Update the system message based on the active document
      const systemMessage = activeDocument === 'questions' ? 
        "You are an AI assistant helping with assignment questions. Use the context document to help answer questions accurately. When answering, cite relevant information from the context document." :
        "You are an AI assistant helping analyze a document. Provide detailed answers based on the document content."

      // Call chat route API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: newMessages,
          fileContent: contextPrompt,
          analysisMode: 'deep',
          systemMessage: systemMessage,
          activeDocument: activeDocument
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      // Read the streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let aiResponse = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value)
          aiResponse += chunk
          
          // Update messages with partial response
          const aiMessage: ChatMessage = { role: "assistant", content: aiResponse }
          setMessages([...newMessages, aiMessage])
        }
      }

    } catch (error) {
      console.error('Chat error:', error)
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    await sendMessage(input)
  }

  // Add useEffect to notify when analysis is ready
  useEffect(() => {
    if (analysis[activeDocument] && !isAiReady) {
      setIsAiReady(true)
      const initialMessage: ChatMessage = {
        role: "assistant",
        content: "I've been fed the data, you can ask me anything about it!"
      }
      setMessages([initialMessage])
    }
  }, [analysis, activeDocument])

  const downloadPdf = useCallback(async () => {
    const fileToDownload = contextFile || questionFile
    if (!fileToDownload) return
    
    try {
      const url = URL.createObjectURL(fileToDownload)
      const a = document.createElement('a')
      a.href = url
      a.download = fileToDownload.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast({
        title: "Download Failed",
        description: "Failed to download the PDF file.",
        variant: "destructive",
      })
    }
  }, [contextFile, questionFile])

  const generateAnswers = async (customInstructions?: string) => {
    if (!questionFile || !analysis.questions) return

    try {
      setIsGeneratingAnswers(true)
      
      // Get the PDF bytes
      const pdfBytes = await questionFile.arrayBuffer()
      
      // Generate answers for each question in the analysis
      const answers = await Promise.all(analysis.questions.pageAnalysis.map(async page => {
        // Extract requirements from the page analysis
        const requirements = [
          ...page.keyPoints,
          ...(page.topics || []),
          ...(page.arguments || [])
        ]

        try {
          // Generate an AI answer using Puter Vision with custom instructions if provided
          const answer = await generatePuterAIAnswer(
            page.content,
            analysis.context?.summary.overview || '',
            requirements,
            customInstructions
          )

          return {
            question: page.content,
            answer,
            pageNumber: page.pageNumber
          }
        } catch (error) {
          console.error(`Error generating answer for page ${page.pageNumber}:`, error)
          throw error
        }
      }))

      // Generate the new PDF with answers
      const modifiedPdfBytes = await generateAnsweredPDF(pdfBytes, answers)
      
      // Create a blob and download the file
      const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${questionFile.name.replace('.pdf', '')}_with_answers.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "Generated answers PDF successfully!",
      })
    } catch (error) {
      console.error('Error generating answers:', error)
      toast({
        title: "Error",
        description: "Failed to generate answers PDF. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingAnswers(false)
      setIsGenerateDialogOpen(false)
      setCustomPrompt("")
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileSearch className="h-5 w-5" />
              Document Analysis
            </CardTitle>
            <div className="flex items-center gap-2">
              {contextFile && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => {
                    setActiveDocument('context')
                  }}
                >
                  View Context
                </Button>
              )}
              {questionFile && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => {
                      setActiveDocument('questions')
                    }}
                  >
                    View Questions
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => setIsGenerateDialogOpen(true)}
                    disabled={isGeneratingAnswers || !isPdfLibReady || !questionFile}
                  >
                    <PenTool className="h-4 w-4" />
                    {isGeneratingAnswers ? 'Generating...' : 'Generate Answers'}
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => window.open('https://www.ilovepdf.com/word_to_pdf', '_blank')}
              >
                <Download className="h-4 w-4" />
                Convert to PDF
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {uploadStep === 'context' ? (
              "First, upload your context document (source material)"
            ) : uploadStep === 'questions' ? (
              "Now, upload your questions or assignment document"
            ) : (
              "Both documents uploaded and analyzed"
            )}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex gap-6">
              <div className="flex-1">
                <div className="mb-2">
                  <h3 className="text-sm font-medium">Context Document</h3>
                  <p className="text-xs text-muted-foreground">Upload your source material</p>
                </div>
                <div 
                  {...getContextRootProps()} 
                  className={`border border-dashed rounded-md p-6 text-center cursor-pointer hover:border-primary transition-colors ${isPdfLibLoading ? 'opacity-50' : ''} ${contextFile ? 'border-green-500 bg-green-50/50' : ''}`}
                >
                  <input {...getContextInputProps()} disabled={isPdfLibLoading || uploadStep === 'questions'} />
            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <h3 className="text-sm font-medium">
                      {isPdfLibLoading ? (
                        "Initializing..."
                      ) : contextFile ? (
                        contextFile.name
                      ) : (
                        "Drop context PDF here"
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isPdfLibLoading ? (
                        "Please wait..."
                      ) : contextFile ? (
                        "Context document uploaded"
                      ) : (
                        "or click to browse"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <div className="mb-2">
                  <h3 className="text-sm font-medium">Questions Document</h3>
                  <p className="text-xs text-muted-foreground">Upload your assignment or questions</p>
                </div>
                <div 
                  {...getQuestionsRootProps()} 
                  className={`border border-dashed rounded-md p-6 text-center cursor-pointer hover:border-primary transition-colors ${isPdfLibLoading ? 'opacity-50' : ''} ${questionFile ? 'border-green-500 bg-green-50/50' : ''} ${uploadStep === 'context' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input {...getQuestionsInputProps()} disabled={isPdfLibLoading || uploadStep === 'context'} />
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <h3 className="text-sm font-medium">
                      {isPdfLibLoading ? (
                        "Initializing..."
                      ) : questionFile ? (
                        questionFile.name
                      ) : uploadStep === 'context' ? (
                        "Upload context first"
                      ) : (
                        "Drop questions PDF here"
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isPdfLibLoading ? (
                        "Please wait..."
                      ) : questionFile ? (
                        "Questions document uploaded"
                      ) : uploadStep === 'context' ? (
                        "Context document required"
                      ) : (
                        "or click to browse"
                      )}
                    </p>
                  </div>
                </div>
            </div>
          </div>

          {isAnalyzing && (
              <Card className="border-dashed">
                <CardContent className="p-6">
                  <LoadingSpinner 
                    message={
                      currentPage === 0 
                        ? "Processing document..." 
                        : currentPage === totalPages 
                          ? "Analyzing content..." 
                          : "Processing pages..."
                    } 
                  />
                </CardContent>
              </Card>
          )}

            {analysis[activeDocument] && (
              <div>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      AI Assistant
                    </CardTitle>
                  <p className="text-sm text-muted-foreground">
                      Ask questions about your document and get instant answers
                    </p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex flex-col h-[600px]">
                      <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                          {messages.map((message: ChatMessage, index: number) => (
                            <div
                              key={index}
                              className={`flex ${
                                message.role === "assistant"
                                  ? "justify-start"
                                  : "justify-end"
                              }`}
                            >
                              <div
                                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                                  message.role === "assistant"
                                    ? "bg-muted"
                                    : "bg-primary text-primary-foreground"
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      
                      <div className="border-t p-4">
                        <form onSubmit={handleSubmit} className="flex gap-2">
                          <Input
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Ask me anything about your document..."
                            className="flex-1"
                          />
                          <Button type="submit" disabled={!input.trim()}>
                            Send
                          </Button>
                        </form>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {analysis[activeDocument] && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Analysis Results</h2>
                  <p className="text-sm text-muted-foreground">
                    Document Type: {analysis[activeDocument]?.documentContext?.type || 'Unknown'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {analysis[activeDocument]?.documentContext?.subject || 'Unknown'} - {analysis[activeDocument]?.documentContext?.level || 'Unknown'}
                  </Badge>
                  {analysis[activeDocument]?.documentContext?.wordCount && (
                    <Badge className="text-xs">
                      {analysis[activeDocument]?.documentContext.wordCount} words
                    </Badge>
                  )}
                </div>
              </div>

              <Tabs defaultValue="overview">
                <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                  <TabsTrigger value="overview" className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="content" className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                    Content
                  </TabsTrigger>
                  <TabsTrigger value="pages" className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                    Page Analysis
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-4">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Document Overview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid gap-4">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Document Type:</span>
                              <Badge variant="outline">{analysis[activeDocument]?.documentContext?.type || 'Unknown'}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Subject:</span>
                              <Badge variant="outline">{analysis[activeDocument]?.documentContext?.subject || 'Unknown'}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Level:</span>
                              <Badge variant="outline">{analysis[activeDocument]?.documentContext?.level || 'Unknown'}</Badge>
                            </div>
                            {analysis[activeDocument]?.documentContext?.wordCount && (
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Word Count:</span>
                                <Badge>{analysis[activeDocument]?.documentContext.wordCount}</Badge>
                              </div>
                            )}
                          </div>
                          <div className="pt-4">
                            <h4 className="font-semibold mb-2">Key Topics</h4>
                            <ul className="list-disc pl-4 space-y-1">
                              {analysis[activeDocument]?.documentContext.keyTopics.map((topic, index) => (
                                <li key={index} className="text-sm">{topic}</li>
                          ))}
                        </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <p className="text-sm">{analysis[activeDocument]?.summary.overview}</p>
                          <div>
                            <h4 className="font-semibold mb-2">Key Points</h4>
                            <ul className="list-disc pl-4 space-y-1">
                              {analysis[activeDocument]?.summary.keyPoints.map((point, index) => (
                                <li key={index} className="text-sm">{point}</li>
                          ))}
                        </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="content" className="mt-4">
                  <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                        <CardTitle>Main Arguments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px]">
                      <ul className="list-disc pl-4 space-y-2">
                            {analysis[activeDocument]?.contentBreakdown.mainPoints.map((point, index) => (
                              <li key={index} className="text-sm">{point}</li>
                        ))}
                      </ul>
                        </ScrollArea>
                    </CardContent>
                  </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Writing Guide</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-4">
                        <div>
                              <h4 className="font-semibold mb-2">Suggested Points</h4>
                              <ul className="list-disc pl-4 space-y-1">
                                {analysis[activeDocument]?.writingGuide.suggestedPoints.map((point, index) => (
                                  <li key={index} className="text-sm">{point}</li>
                                ))}
                              </ul>
                        </div>
                        <div>
                              <h4 className="font-semibold mb-2">Key Quotes</h4>
                              <ul className="list-disc pl-4 space-y-1">
                                {analysis[activeDocument]?.writingGuide.keyQuotes.map((quote, index) => (
                                  <li key={index} className="text-sm">{quote}</li>
                            ))}
                          </ul>
                        </div>
                        </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                  <Card>
                    <CardHeader>
                        <CardTitle>Supporting Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold mb-2">Examples</h4>
                              <ul className="list-disc pl-4 space-y-1">
                                {analysis[activeDocument]?.contentBreakdown.examples.map((example, index) => (
                                  <li key={index} className="text-sm">{example}</li>
                        ))}
                      </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Definitions</h4>
                              <ul className="list-disc pl-4 space-y-1">
                                {analysis[activeDocument]?.contentBreakdown.definitions.map((def, index) => (
                                  <li key={index} className="text-sm">
                                    {typeof def === 'string' ? (
                                      def
                                    ) : (
                                      <>
                                        <span className="font-medium">{def.term}</span>: {def.definition}
                                      </>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                        <CardTitle>References</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px]">
                      <ul className="list-disc pl-4 space-y-2">
                            {analysis[activeDocument]?.contentBreakdown.references.map((ref, index) => (
                              <li key={index} className="text-sm">{ref}</li>
                        ))}
                      </ul>
                        </ScrollArea>
                    </CardContent>
                  </Card>
                  </div>
                </TabsContent>

                <TabsContent value="pages" className="mt-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Page-by-Page Analysis</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Detailed breakdown of each page's content and key points
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPageView(prev => Math.max(1, prev - 1))}
                            disabled={currentPageView <= 1}
                          >
                            Previous
                          </Button>
                          <span className="text-sm">
                            Page {currentPageView} of {analysis[activeDocument]?.pageAnalysis?.length || 0}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPageView(prev => Math.min(analysis[activeDocument]?.pageAnalysis?.length || 0, prev + 1))}
                            disabled={!analysis[activeDocument]?.pageAnalysis?.length || currentPageView >= (analysis[activeDocument]?.pageAnalysis?.length || 0)}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[600px]">
                        {analysis[activeDocument]?.pageAnalysis && analysis[activeDocument]?.pageAnalysis.length > 0 ? (
                          <div className="space-y-6">
                            {analysis[activeDocument]?.pageAnalysis
                              .filter((_, index) => index + 1 === currentPageView)
                              .map((page) => (
                                <Card key={page.pageNumber} className="p-4">
                      <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-semibold">Page {page.pageNumber}</h3>
                                        <Badge variant="secondary" className="text-xs">
                                          {Math.round((currentPageView / (analysis[activeDocument]?.pageAnalysis.length || 1)) * 100)}%
                                        </Badge>
                            </div>
                                      <div className="flex gap-2">
                                        <Badge variant="outline" className="text-xs">
                                          {page.keyPoints.length} Key Points
                                        </Badge>
                                        {page.topics && (
                                          <Badge variant="outline" className="text-xs">
                                            {page.topics.length} Topics
                                          </Badge>
                                        )}
                          </div>
                      </div>
                                    
                      <div>
                                      <h4 className="font-medium mb-1">Summary</h4>
                                      <p className="text-sm text-muted-foreground">{page.content}</p>
                                    </div>

                                    <div>
                                      <h4 className="font-medium mb-1">Key Points</h4>
                                      <ul className="list-disc pl-4 space-y-1">
                                        {page.keyPoints.map((point, pointIndex) => (
                                          <li key={pointIndex} className="text-sm">{point}</li>
                          ))}
                        </ul>
                      </div>

                                    {page.topics && page.topics.length > 0 && (
                      <div>
                                        <h4 className="font-medium mb-1">Topics Covered</h4>
                                        <div className="flex flex-wrap gap-2">
                                          {page.topics.map((topic, topicIndex) => (
                                            <Badge key={topicIndex} variant="secondary" className="text-xs">
                                              {topic}
                                            </Badge>
                                          ))}
                      </div>
                                      </div>
                                    )}

                                    {page.arguments && page.arguments.length > 0 && (
                      <div>
                                        <h4 className="font-medium mb-1">Arguments</h4>
                                        <ul className="list-disc pl-4 space-y-1">
                                          {page.arguments.map((arg, argIndex) => (
                                            <li key={argIndex} className="text-sm">{arg}</li>
                                          ))}
                                        </ul>
                      </div>
                                    )}

                                    {page.evidence && page.evidence.length > 0 && (
                      <div>
                                        <h4 className="font-medium mb-1">Evidence</h4>
                                        <ul className="list-disc pl-4 space-y-1">
                                          {page.evidence.map((ev, evIndex) => (
                                            <li key={evIndex} className="text-sm">{ev}</li>
                                          ))}
                                        </ul>
                      </div>
                                    )}

                                    {page.connections && page.connections.length > 0 && (
                      <div>
                                        <h4 className="font-medium mb-1">Connections to Other Pages</h4>
                                        <ul className="list-disc pl-4 space-y-1">
                                          {page.connections.map((conn, connIndex) => (
                                            <li key={connIndex} className="text-sm">{conn}</li>
                          ))}
                        </ul>
            </div>
          )}

                                    {page.importance && (
                                      <div>
                                        <h4 className="font-medium mb-1">Significance</h4>
                                        <p className="text-sm text-muted-foreground">{page.importance}</p>
                          </div>
                                    )}
                        </div>
                                </Card>
                      ))}
                    </div>
                        ) : (
                          <div className="text-center text-muted-foreground">
                            No page analysis available
                    </div>
                        )}
                      </ScrollArea>
                </CardContent>
              </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Answers</DialogTitle>
            <DialogDescription>
              Add any custom instructions for the AI to follow when generating answers. Leave blank for default behavior.
            </DialogDescription>
          </DialogHeader>
          {isGeneratingAnswers ? (
            <div className="py-8">
              <LoadingSpinner message="Generating your answers..." />
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="prompt" className="text-sm font-medium">
                    Custom Instructions (Optional)
                  </label>
                  <Textarea
                    id="prompt"
                    placeholder="E.g., Write in a more casual tone, focus on practical examples, etc."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={5}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    setIsGeneratingAnswers(true);
                    generateAnswers(customPrompt || undefined);
                  }}
                  disabled={isGeneratingAnswers}
                >
                  {isGeneratingAnswers ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default FileAnalysis

