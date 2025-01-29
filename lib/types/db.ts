import { ObjectId } from "mongodb"

export interface User {
  _id: ObjectId
  name: string
  email: string
  createdAt: Date
}

export interface Project {
  _id: ObjectId
  name: string
  clientId: ObjectId
  status: "active" | "completed" | "paused"
  progress: number
  dueDate: Date
  createdAt: Date
}

export interface TimeEntry {
  _id: ObjectId
  projectId: ObjectId
  userId: ObjectId
  duration: number // in seconds
  description: string
  date: Date
}

export interface Invoice {
  _id: ObjectId
  clientId: ObjectId
  projectId: ObjectId
  amount: number
  status: "draft" | "sent" | "paid"
  dueDate: Date
  createdAt: Date
}

export interface Client {
  _id: ObjectId
  name: string
  email: string
  status: "active" | "inactive"
  projects: ObjectId[]
  createdAt: Date
}

export interface Task {
  _id: ObjectId
  projectId: ObjectId
  title: string
  status: "pending" | "in_progress" | "completed"
  dueDate: Date
  startTime?: Date
  completedAt?: Date
  createdAt: Date
}

export interface DashboardMetrics {
  totalEarnings: number
  activeProjects: number
  hoursWorked: number
  activeClients: number
  currentProjects: Project[]
  upcomingDeadlines: Task[]
} 