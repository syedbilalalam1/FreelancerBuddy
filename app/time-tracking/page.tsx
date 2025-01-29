"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Play, Pause, StopCircle, BarChart, Calendar } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

interface Project {
  _id: string
  name: string
  clientId: string
}

interface TimeEntry {
  _id: string
  projectId: string
  task: string
  duration: number
  startTime: string
  endTime: string
  date: string
  status: 'active' | 'completed'
}

interface WeeklyData {
  day: string
  hours: number
  projects: string[]
}

export default function TimeTracking() {
  const { toast } = useToast()
  const [isTracking, setIsTracking] = useState(false)
  const [time, setTime] = useState(0)
  const [project, setProject] = useState("")
  const [task, setTask] = useState("")
  const [startTime, setStartTime] = useState<string>("")
  const [date, setDate] = useState<string>("")
  const [projects, setProjects] = useState<Project[]>([])
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([{
    day: '',
    hours: 0,
    projects: []
  }])
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([])

  useEffect(() => {
    fetchProjects()
    fetchWeeklyData()
    fetchRecentEntries()
    // Set default date to today
    setDate(new Date().toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isTracking) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1)
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isTracking])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (!response.ok) throw new Error('Failed to fetch projects')
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error("Failed to fetch projects:", error)
      toast({
        title: "Error",
        description: "Failed to fetch projects. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchWeeklyData = async () => {
    try {
      const response = await fetch("/api/time-tracking/weekly")
      if (!response.ok) throw new Error('Failed to fetch weekly data')
      const data = await response.json()
      setWeeklyData(data || [{ day: '', hours: 0, projects: [] }])
    } catch (error) {
      console.error("Failed to fetch weekly data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch weekly summary. Please try again.",
        variant: "destructive",
      })
      setWeeklyData([{ day: '', hours: 0, projects: [] }])
    }
  }

  const fetchRecentEntries = async () => {
    try {
      const response = await fetch("/api/time-tracking/recent")
      if (!response.ok) throw new Error('Failed to fetch recent entries')
      const data = await response.json()
      setRecentEntries(data)
    } catch (error) {
      console.error("Failed to fetch recent entries:", error)
      toast({
        title: "Error",
        description: "Failed to fetch recent entries. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatTime = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600)
    const minutes = Math.floor((timeInSeconds % 3600) / 60)
    const seconds = timeInSeconds % 60

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const handleStart = () => {
    if (!project || !task || !date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields before starting.",
        variant: "destructive",
      })
      return
    }
    setStartTime(new Date().toISOString())
    setIsTracking(true)
    toast({
      title: "Time Tracking Started",
      description: "The timer has been started for your task.",
    })
  }

  const handlePause = () => {
    setIsTracking(false)
    toast({
      title: "Time Tracking Paused",
      description: "The timer has been paused.",
    })
  }

  const handleStop = async () => {
    if (time === 0) {
      toast({
        title: "Error",
        description: "No time has been tracked yet.",
        variant: "destructive",
      })
      return
    }

    setIsTracking(false)
    const endTime = new Date().toISOString()
    await saveTimeEntry(project, task, time, startTime, endTime, date)
    setTime(0)
    setTask("")
    toast({
      title: "Time Entry Saved",
      description: "Your time entry has been saved successfully.",
    })
  }

  const saveTimeEntry = async (
    projectId: string,
    task: string,
    duration: number,
    startTime: string,
    endTime: string,
    date: string
  ) => {
    try {
      const response = await fetch("/api/time-tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          task,
          duration,
          startTime,
          endTime,
          date,
          status: 'completed'
        }),
      })
      
      if (!response.ok) throw new Error("Failed to save time entry")
      
      // Refresh data
      fetchWeeklyData()
      fetchRecentEntries()
    } catch (error) {
      console.error("Error saving time entry:", error)
      toast({
        title: "Error",
        description: "Failed to save time entry. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Time Tracking</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Track Your Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select onValueChange={setProject} value={project}>
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task">Task</Label>
                <Input
                  id="task"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  placeholder="Enter task description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-4">{formatTime(time)}</div>
                <div className="space-x-2">
                  {!isTracking ? (
                    <Button onClick={handleStart}>
                      <Play className="mr-2 h-4 w-4" /> Start
                    </Button>
                  ) : (
                    <Button onClick={handlePause}>
                      <Pause className="mr-2 h-4 w-4" /> Pause
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleStop}>
                    <StopCircle className="mr-2 h-4 w-4" /> Stop
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Projects</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weeklyData.map((dayData) => (
                  <TableRow key={dayData.day}>
                    <TableCell>{dayData.day}</TableCell>
                    <TableCell>{dayData.hours.toFixed(1)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {dayData.projects?.map((project, index) => (
                          <Badge key={index} variant="secondary">
                            {project}
                          </Badge>
                        )) || 'No projects'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Time Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEntries.map((entry) => {
                  const project = projects.find(p => p._id === entry.projectId)
                  return (
                    <TableRow key={entry._id}>
                      <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                      <TableCell>{project?.name || 'Loading...'}</TableCell>
                      <TableCell>{entry.task}</TableCell>
                      <TableCell>{formatTime(entry.duration)}</TableCell>
                      <TableCell>{new Date(entry.startTime).toLocaleTimeString()}</TableCell>
                      <TableCell>{new Date(entry.endTime).toLocaleTimeString()}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

