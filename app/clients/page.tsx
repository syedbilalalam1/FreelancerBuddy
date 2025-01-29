"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle, Loader2, Check, X, MoreHorizontal } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Project {
  _id: string
  name: string
  status: string
}

interface Client {
  _id: string
  name: string
  email: string
  projects: Project[]
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export default function Clients() {
  const [isNewClientOpen, setIsNewClientOpen] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/clients")
      if (!response.ok) throw new Error('Failed to fetch clients')
      const data = await response.json() as Client[]
      setClients(data.map(client => ({
        ...client,
        projects: client.projects || []
      })))
    } catch (error) {
      console.error("Failed to fetch clients:", error)
      toast({
        title: "Error",
        description: "Failed to fetch clients. Please try again.",
        variant: "destructive",
      })
      setClients([])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    if (searchParams.get("action") === "newClient") {
      setIsNewClientOpen(true)
    }
  }, [searchParams])

  const handleAddClient = async (name: string, email: string) => {
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          email,
          status: 'active',
          projects: [] as Project[]
        }),
      })
      
      if (!response.ok) throw new Error("Failed to add client")
      
      const newClient = await response.json()
      setClients([newClient, ...clients])
      toast({
        title: "Success",
        description: "New client added successfully.",
      })
    } catch (error) {
      console.error("Failed to add client:", error)
      toast({
        title: "Error",
        description: "Failed to add client. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateStatus = async (clientId: string, newStatus: 'active' | 'inactive') => {
    try {
      // Optimistically update the UI
      setClients(clients.map(client => 
        client._id === clientId 
          ? { ...client, status: newStatus }
          : client
      ))

      const response = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (!response.ok) {
        // Revert the optimistic update on error
        setClients(clients)
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update client status")
      }
      
      const updatedClient = await response.json()
      setClients(clients.map(client => 
        client._id === clientId 
          ? updatedClient
          : client
      ))

      toast({
        title: "Success",
        description: `Client marked as ${newStatus}.`,
      })
    } catch (error) {
      console.error("Failed to update client status:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update client status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      })
      
      if (!response.ok) throw new Error("Failed to delete client")
      
      setClients(clients.filter(client => client._id !== clientId))
      toast({
        title: "Success",
        description: "Client deleted successfully.",
      })
    } catch (error) {
      console.error("Failed to delete client:", error)
      toast({
        title: "Error",
        description: "Failed to delete client. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'inactive':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Clients</h1>
        <Dialog open={isNewClientOpen} onOpenChange={setIsNewClientOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>Fill in the details for the new client.</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const name = formData.get("clientName") as string
                const email = formData.get("clientEmail") as string
                if (name && email) {
                  handleAddClient(name, email)
                  setIsNewClientOpen(false)
                  e.currentTarget.reset()
                }
              }}
            >
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="clientName" className="text-right">
                    Name
                  </Label>
                  <Input id="clientName" name="clientName" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="clientEmail" className="text-right">
                    Email
                  </Label>
                  <Input id="clientEmail" name="clientEmail" type="email" className="col-span-3" required />
                </div>
              </div>
              <Button type="submit">Add Client</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client List</CardTitle>
          <CardDescription>Manage your clients and their projects</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client._id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {client.projects?.length > 0 ? (
                          client.projects.map((project) => (
                            <Badge key={project._id} variant="secondary">
                              {project.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">No projects</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(client.status)}>
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {client.status === 'active' ? (
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(client._id, 'inactive')}
                              className="text-red-600"
                            >
                              <X className="mr-2 h-4 w-4" /> Mark Inactive
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(client._id, 'active')}
                              className="text-green-600"
                            >
                              <Check className="mr-2 h-4 w-4" /> Mark Active
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDeleteClient(client._id)}
                            className="text-red-600"
                          >
                            <X className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

