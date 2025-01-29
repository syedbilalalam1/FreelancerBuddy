"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// Add currency formatter
const formatCurrency = (amount: number) => {
  return `Rs ${new Intl.NumberFormat('ur-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)}`
}

interface Client {
  _id: string
  name: string
}

interface Project {
  _id: string
  name: string
  clientId: string
  status: "active" | "completed" | "paused"
  progress: number
  dueDate: string
  createdAt: string
}

interface Task {
  _id: string
  title: string
  projectId: string
  status: "pending" | "in_progress" | "completed"
  dueDate: string
  priority: "low" | "medium" | "high"
}

interface DashboardMetrics {
  totalEarnings: number
  activeProjects: number
  hoursWorked: number
  activeClients: number
  currentProjects: Project[]
  upcomingDeadlines: Task[]
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-500'
    case 'medium':
      return 'bg-yellow-500'
    case 'low':
      return 'bg-green-500'
    default:
      return 'bg-gray-500'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500'
    case 'in_progress':
      return 'bg-blue-500'
    case 'pending':
      return 'bg-yellow-500'
    default:
      return 'bg-gray-500'
  }
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalEarnings: 0,
    activeProjects: 0,
    hoursWorked: 0,
    activeClients: 0,
    currentProjects: [],
    upcomingDeadlines: []
  })
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<{[key: string]: Project}>({})

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/dashboard')
        const data = await response.json()
        setMetrics(data)
      } catch (error) {
        console.error('Failed to fetch dashboard metrics:', error)
      }
    }
    fetchMetrics()
  }, [])

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch("/api/clients")
        if (!response.ok) throw new Error('Failed to fetch clients')
        const data = await response.json()
        setClients(data)
      } catch (error) {
        console.error("Failed to fetch clients:", error)
      }
    }
    fetchClients()
  }, [])

  useEffect(() => {
    // Fetch all projects for deadline tasks
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects")
        if (!response.ok) throw new Error('Failed to fetch projects')
        const data = await response.json()
        const projectMap = data.reduce((acc: {[key: string]: Project}, project: Project) => {
          acc[project._id] = project
          return acc
        }, {})
        setProjects(projectMap)
      } catch (error) {
        console.error("Failed to fetch projects:", error)
      }
    }
    fetchProjects()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">Total earnings from paid invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeProjects}</div>
            <p className="text-xs text-muted-foreground">Currently active projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Worked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.hoursWorked}h</div>
            <p className="text-xs text-muted-foreground">Total hours tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeClients}</div>
            <p className="text-xs text-muted-foreground">Total active clients</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects and Deadlines sections */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.currentProjects.map((project) => {
                  const client = clients.find(c => c._id === project.clientId)
                  const daysUntilDue = Math.ceil((new Date(project.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
                  return (
                    <TableRow key={project._id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>{client?.name || 'Loading...'}</TableCell>
                      <TableCell>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-muted-foreground mt-1">
                          {project.progress}%
                        </span>
                      </TableCell>
                      <TableCell className={daysUntilDue <= 3 ? 'text-red-500' : ''}>
                        {new Date(project.dueDate).toLocaleDateString()}
                        {daysUntilDue <= 3 && ` (${daysUntilDue} days left)`}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Upcoming Deadlines</span>
              <Button variant="link" className="text-sm" asChild>
                <Link href="/deadlines">View All</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.upcomingDeadlines.map((task) => {
                const project = projects[task.projectId]
                const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
                return (
                  <div
                    key={task._id}
                    className="flex items-start justify-between p-3 bg-card rounded-lg border"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {project?.name || 'Loading...'}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${daysUntilDue <= 3 ? 'text-red-500' : ''}`}>
                        {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                      {daysUntilDue <= 3 && (
                        <p className="text-xs text-red-500 font-medium">
                          {daysUntilDue} days left
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
              {metrics.upcomingDeadlines.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  No upcoming deadlines
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 