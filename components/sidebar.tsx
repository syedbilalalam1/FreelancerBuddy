"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard,
  FileText,
  PenTool,
  BookOpen,
  MessageSquare,
  Upload,
  Clock,
  FileCheck,
  Users,
  Calendar,
  Receipt,
  FileSearch,
  FolderKanban,
  Timer,
  Briefcase,
  ChevronRight,
} from "lucide-react"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

const freelanceRoutes = [
  { label: "Clients", icon: Users, href: "/clients" },
  { label: "Projects", icon: FolderKanban, href: "/projects" },
  { label: "Deadlines", icon: Timer, href: "/deadlines" },
  { label: "Time Tracking", icon: Clock, href: "/time-tracking" },
  { label: "Invoicing", icon: Receipt, href: "/invoicing" },
  { label: "Resources", icon: BookOpen, href: "/resources" },
]

const routes = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "File Analysis", icon: FileSearch, href: "/file-analysis" },
  { label: "Proofreading", icon: FileCheck, href: "/proofreading" },
  { label: "Chatbot", icon: MessageSquare, href: "/chatbot" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-sidebar text-sidebar-foreground flex flex-col h-screen border-r border-sidebar-border">
      <div className="p-6 border-b border-sidebar-border bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <span className="text-xl font-bold text-white">Z</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Project Ziio</h1>
        </div>
      </div>
      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-2 py-4">
          {routes.map((route) => (
            <Button
              key={route.href}
              asChild
              variant={pathname === route.href ? "secondary" : "ghost"}
              className="w-full justify-start text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Link href={route.href}>
                <route.icon className="mr-2 h-4 w-4" />
                {route.label}
              </Link>
            </Button>
          ))}
          
          <HoverCard openDelay={0}>
            <HoverCardTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between text-sidebar-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent group"
              >
                <div className="flex items-center">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Freelance Hub
                </div>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent 
              side="right" 
              align="start" 
              className="w-64 p-2"
            >
              <div className="space-y-2">
                {freelanceRoutes.map((route) => (
                  <Button
                    key={route.href}
                    asChild
                    variant={pathname === route.href ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    <Link href={route.href}>
                      <route.icon className="mr-2 h-4 w-4" />
                      {route.label}
                    </Link>
                  </Button>
                ))}
              </div>
            </HoverCardContent>
          </HoverCard>
        </nav>
      </ScrollArea>
    </div>
  )
}

