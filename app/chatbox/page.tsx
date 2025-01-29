"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { useState } from "react"
import { Send, ArrowLeft } from "lucide-react"

type Message = {
  id: number
  text: string
  sender: "user" | "assistant"
}

export default function Chatbox() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! How can I assist you today?", sender: "assistant" },
  ])
  const [inputMessage, setInputMessage] = useState("")

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const newUserMessage = { id: messages.length + 1, text: inputMessage, sender: "user" as const }
      setMessages([...messages, newUserMessage])
      setInputMessage("")

      // Simulate assistant response
      setTimeout(() => {
        const assistantMessage = {
          id: messages.length + 2,
          text: "I'm processing your request. How else can I help you?",
          sender: "assistant" as const,
        }
        setMessages((prev) => [...prev, assistantMessage])
      }, 1000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-blue-100">
      <header className="p-6 bg-white shadow-md">
        <h1 className="text-3xl font-bold text-purple-600">Project Ruby Chat</h1>
      </header>
      <main className="container mx-auto p-6">
        <Card className="h-[70vh] flex flex-col">
          <CardHeader>
            <CardTitle>Chat with Assistant</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto mb-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`flex items-start space-x-2 max-w-[70%] ${message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                >
                  <Avatar>
                    <AvatarFallback>{message.sender === "user" ? "U" : "A"}</AvatarFallback>
                  </Avatar>
                  <div
                    className={`p-3 rounded-lg ${message.sender === "user" ? "bg-purple-500 text-white" : "bg-gray-200"}`}
                  >
                    {message.text}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <Button onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
        <div className="mt-6">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}

