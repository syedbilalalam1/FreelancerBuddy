"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Wallet, Clock, Users, PlusCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const formatCurrency = (amount: number) => {
  return `Rs ${new Intl.NumberFormat('ur-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)}`
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

interface Project {
  _id: string
  name: string
  clientId: string
  dueDate: string
  status: string
}

interface Task {
  _id: string
  title: string
  projectId: string
  dueDate: string
  status: string
  priority: string
}

interface DashboardData {
  totalEarnings: number
  activeProjects: number
  hoursWorked: number
  activeClients: number
  currentProjects: Project[]
  upcomingDeadlines: Task[]
}

interface Client {
  _id: string
  name: string
}

export default function Dashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalEarnings: 0,
    activeProjects: 0,
    hoursWorked: 0,
    activeClients: 0,
    currentProjects: [],
    upcomingDeadlines: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Record<string, Project>>({})

  useEffect(() => {
    fetchDashboardData()
    fetchClients()
    fetchProjects()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/dashboard")
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data. Please try again.",
        variant: "destructive",
      })
    }
    setIsLoading(false)
  }

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients")
      if (!response.ok) throw new Error('Failed to fetch clients')
      const data = await response.json() as Client[]
      setClients(data)
    } catch (error) {
      console.error("Failed to fetch clients:", error)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (!response.ok) throw new Error('Failed to fetch projects')
      const data = await response.json() as Project[]
      const projectMap = data.reduce((acc: Record<string, Project>, project: Project) => {
        acc[project._id] = project
        return acc
      }, {})
      setProjects(projectMap)
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Loading...</div>
  }

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
            <div className="text-2xl font-bold">{formatCurrency(dashboardData.totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">Total earnings from paid invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.activeProjects}</div>
            <p className="text-xs text-muted-foreground">Currently active projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hours Worked</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.hoursWorked}h</div>
            <p className="text-xs text-muted-foreground">Total hours tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.activeClients}</div>
            <p className="text-xs text-muted-foreground">Total active clients</p>
          </CardContent>
        </Card>
      </div>

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
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData.currentProjects.map((project) => {
                  const client = clients.find(c => c._id === project.clientId)
                  const daysUntilDue = Math.ceil((new Date(project.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
                  return (
                    <TableRow key={project._id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>{client?.name || 'Loading...'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.replace('_', ' ')}
                        </Badge>
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
              {dashboardData.upcomingDeadlines.map((task) => {
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
              {dashboardData.upcomingDeadlines.length === 0 && (
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

