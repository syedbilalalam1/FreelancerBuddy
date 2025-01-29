"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Send, Bot, Loader2, ThumbsUp, ThumbsDown, Copy } from "lucide-react"
import { useChat } from "ai/react"
import { useToast } from "@/components/ui/use-toast"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function Chatbot() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    scrollToBottom()
  }, []) // Removed unnecessary dependency: messages

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "The message has been copied to your clipboard.",
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Project Ruby Chat</h1>
      <p className="text-gray-600">Your AI-powered writing assistant</p>
      <Card className="h-[70vh] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bot className="mr-2" />
            Chat with Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full px-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-4`}
              >
                <div
                  className={`flex items-start space-x-2 max-w-[70%] ${message.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                >
                  <Avatar>
                    <AvatarFallback>{message.role === "user" ? "U" : "A"}</AvatarFallback>
                    <AvatarImage src={message.role === "user" ? "/user-avatar.png" : "/assistant-avatar.png"} />
                  </Avatar>
                  <div
                    className={`p-3 rounded-lg ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                  >
                    <p>{message.content}</p>
                    {message.role === "assistant" && (
                      <div className="flex justify-end mt-2 space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(message.content)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copy to clipboard</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <ThumbsUp className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Helpful</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <ThumbsDown className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Not helpful</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </ScrollArea>
        </CardContent>
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input value={input} onChange={handleInputChange} placeholder="Type your message..." disabled={isLoading} />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}

