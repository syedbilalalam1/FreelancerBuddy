"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Check, Highlighter, AlertTriangle, ThumbsUp, Loader2 } from "lucide-react"
import { useCompletion } from "ai/react"
import { useToast } from "@/components/ui/use-toast"

type Suggestion = {
  type: "grammar" | "spelling" | "style"
  text: string
  replacement: string
}

type Stats = {
  words: number
  characters: number
  sentences: number
}

type Score = {
  readability: number
  grammar: number
  style: number
}

type ProofreadResult = {
  suggestions: Suggestion[]
  stats: Stats
  score: Score
}

export default function Proofreading() {
  const [text, setText] = useState("")
  const [result, setResult] = useState<ProofreadResult | null>(null)
  const { toast } = useToast()

  const { complete, completion, isLoading } = useCompletion({
    api: "/api/proofread",
  })

  useEffect(() => {
    if (completion) {
      try {
        const result = JSON.parse(completion) as ProofreadResult
        setResult(result)
        toast({
          title: "Proofreading Complete",
          description: "Your text has been successfully analyzed.",
        })
      } catch (error) {
        console.error("Failed to parse completion:", error)
        toast({
          title: "Error",
          description: "Failed to analyze the text. Please try again.",
          variant: "destructive",
        })
      }
    }
  }, [completion, toast])

  const handleProofread = () => {
    if (text.trim()) {
      complete(text)
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    setResult(null)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Proofreading Station</h1>
      <p className="text-gray-600">Enhance your writing with AI-powered proofreading</p>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Highlighter className="mr-2" />
              Document to Proofread
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              className="min-h-[300px] mb-4"
              placeholder="Paste your text here for proofreading..."
              value={text}
              onChange={handleTextChange}
            />
            <Button onClick={handleProofread} disabled={isLoading || text.trim().length === 0}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Proofreading...
                </>
              ) : (
                <>
                  <Highlighter className="mr-2 h-4 w-4" />
                  Proofread
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Check className="mr-2" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <Tabs defaultValue="suggestions">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                  <TabsTrigger value="stats">Stats</TabsTrigger>
                  <TabsTrigger value="score">Score</TabsTrigger>
                </TabsList>
                <TabsContent value="suggestions">
                  <ul className="space-y-2">
                    {result.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="outline"
                                className={
                                  suggestion.type === "grammar"
                                    ? "bg-red-100 text-red-800"
                                    : suggestion.type === "spelling"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-blue-100 text-blue-800"
                                }
                              >
                                {suggestion.type}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{suggestion.replacement}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <span className="ml-2">{suggestion.text}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
                <TabsContent value="stats">
                  <div className="space-y-2">
                    <p>Words: {result.stats.words}</p>
                    <p>Characters: {result.stats.characters}</p>
                    <p>Sentences: {result.stats.sentences}</p>
                  </div>
                </TabsContent>
                <TabsContent value="score">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Readability</span>
                        <span>{result.score.readability}%</span>
                      </div>
                      <Progress value={result.score.readability} className="w-full" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Grammar</span>
                        <span>{result.score.grammar}%</span>
                      </div>
                      <Progress value={result.score.grammar} className="w-full" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Style</span>
                        <span>{result.score.style}%</span>
                      </div>
                      <Progress value={result.score.style} className="w-full" />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <AlertTriangle className="mr-2 h-4 w-4" />
                No proofreading results yet. Enter some text and click the Proofread button to get started.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

