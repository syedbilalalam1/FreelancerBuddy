"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PlusCircle } from "lucide-react"

interface Project {
  _id: string
  name: string
}

interface Task {
  _id: string
  title: string
  projectId: string
  status: "pending" | "in_progress" | "completed"
  dueDate: string
  priority: "low" | "medium" | "high"
  description?: string
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

export default function Deadlines() {
  const [isNewDeadlineOpen, setIsNewDeadlineOpen] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState("")
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch("/api/tasks")
        if (!response.ok) throw new Error('Failed to fetch tasks')
        const data = await response.json()
        setTasks(data)
      } catch (error) {
        console.error("Failed to fetch tasks:", error)
      }
    }
    fetchTasks()
  }, [])

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects")
        if (!response.ok) throw new Error('Failed to fetch projects')
        const data = await response.json()
        setProjects(data)
      } catch (error) {
        console.error("Failed to fetch projects:", error)
      }
    }
    fetchProjects()
  }, [])

  const handleCreateDeadline = async () => {
    if (!selectedProject || !taskTitle || !dueDate) {
      alert("Please fill in all required fields")
      return
    }

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: taskTitle,
          projectId: selectedProject,
          description: taskDescription,
          dueDate: new Date(dueDate),
          priority,
          status: "pending"
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Failed to create task')
      }

      const newTask = await response.json()
      setTasks([newTask, ...tasks])
      setIsNewDeadlineOpen(false)
      // Reset form
      setSelectedProject("")
      setTaskTitle("")
      setTaskDescription("")
      setDueDate("")
      setPriority("medium")
    } catch (error: any) {
      console.error("Failed to create task:", error)
      alert(error?.message || "Failed to create task. Please try again.")
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update task status')

      setTasks(tasks.map(task => 
        task._id === taskId ? { ...task, status: newStatus } : task
      ))
    } catch (error) {
      console.error("Failed to update task status:", error)
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Deadlines</h1>
        <Dialog open={isNewDeadlineOpen} onOpenChange={setIsNewDeadlineOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Deadline
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Deadline</DialogTitle>
              <DialogDescription>Add a new deadline or task.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="project" className="text-right">
                  Project
                </Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project._id} value={project._id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  className="col-span-3"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  className="col-span-3"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dueDate" className="text-right">
                  Due Date
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  className="col-span-3"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priority" className="text-right">
                  Priority
                </Label>
                <Select value={priority} onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleCreateDeadline}>Create Deadline</Button>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Deadlines</CardTitle>
          <CardDescription>Manage your tasks and deadlines</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => {
                const project = projects.find(p => p._id === task.projectId)
                const daysUntilDue = Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
                return (
                  <TableRow key={task._id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>{project?.name || 'Loading...'}</TableCell>
                    <TableCell>{task.description}</TableCell>
                    <TableCell>
                      <Select
                        value={task.status}
                        onValueChange={(value: Task['status']) => handleStatusChange(task._id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue>
                            <Badge className={getStatusColor(task.status)}>
                              {task.status}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className={daysUntilDue <= 3 ? 'text-red-500 font-bold' : ''}>
                      {new Date(task.dueDate).toLocaleDateString()}
                      {daysUntilDue <= 3 && ` (${daysUntilDue} days left)`}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(task._id, 'completed')}
                        disabled={task.status === 'completed'}
                      >
                        Complete
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 