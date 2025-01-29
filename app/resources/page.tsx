"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, FileText, Link as LinkIcon, Video, Calculator, Clock, Calendar } from "lucide-react"

export default function ResourcesPage() {
  const [resources, setResources] = useState([
    {
      title: "Documentation",
      description: "Access guides and documentation",
      icon: FileText,
      link: "/docs"
    },
    {
      title: "Tutorials",
      description: "Step-by-step learning materials",
      icon: Video,
      link: "/tutorials"
    },
    {
      title: "Templates",
      description: "Ready-to-use document templates",
      icon: BookOpen,
      link: "/templates"
    },
    {
      title: "Tools",
      description: "Productivity and calculation tools",
      icon: Calculator,
      link: "/tools"
    },
    {
      title: "Time Management",
      description: "Time tracking and scheduling resources",
      icon: Clock,
      link: "/time"
    },
    {
      title: "Planning",
      description: "Project planning and organization",
      icon: Calendar,
      link: "/planning"
    }
  ])

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Resources</h1>
        <p className="text-muted-foreground">Access helpful tools and materials for your projects</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <resource.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <a 
                href={resource.link}
                className="inline-flex items-center text-sm text-primary hover:underline"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Access Resource
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

