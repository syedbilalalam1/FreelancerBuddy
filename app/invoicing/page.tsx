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
import { PlusCircle, Check, X, Send } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"

// Add currency formatter
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ur-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-500'
    case 'sent':
      return 'bg-blue-500'
    case 'draft':
      return 'bg-gray-500'
    case 'overdue':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

interface Client {
  _id: string
  name: string
  projects: string[]
}

interface Project {
  _id: string
  name: string
  clientId: string
}

interface Invoice {
  _id: string
  clientId: string
  projectId: string
  amount: number
  status: "draft" | "sent" | "paid" | "overdue"
  dueDate: string
  createdAt: string
}

export default function Invoicing() {
  const { toast } = useToast()
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedClient, setSelectedClient] = useState("")
  const [selectedProject, setSelectedProject] = useState("")
  const [amount, setAmount] = useState("")
  const [dueDate, setDueDate] = useState("")
  const searchParams = useSearchParams()

  useEffect(() => {
    fetchInvoices()
    fetchClients()
    fetchAllProjects()
  }, [])

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/invoices")
      const data = await response.json()
      setInvoices(data)
    } catch (error) {
      console.error("Failed to fetch invoices:", error)
      toast({
        title: "Error",
        description: "Failed to fetch invoices. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients")
      const data = await response.json()
      setClients(data)
    } catch (error) {
      console.error("Failed to fetch clients:", error)
      toast({
        title: "Error",
        description: "Failed to fetch clients. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchAllProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
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

  useEffect(() => {
    if (searchParams.get("action") === "newInvoice") {
      setIsNewInvoiceOpen(true)
    }
  }, [searchParams])

  const handleCreateInvoice = async () => {
    if (!selectedClient || !selectedProject || !amount || !dueDate) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: selectedClient,
          projectId: selectedProject,
          amount: parseFloat(amount),
          dueDate: new Date(dueDate),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create invoice')
      }

      const newInvoice = await response.json()
      setInvoices([newInvoice, ...invoices])
      setIsNewInvoiceOpen(false)
      // Reset form
      setSelectedClient("")
      setSelectedProject("")
      setAmount("")
      setDueDate("")
      toast({
        title: "Success",
        description: "Invoice created successfully.",
      })
    } catch (error) {
      console.error("Failed to create invoice:", error)
      toast({
        title: "Error",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateStatus = async (invoiceId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/invoices", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId,
          status: newStatus,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update invoice status')
      }

      setInvoices(invoices.map(invoice => 
        invoice._id === invoiceId 
          ? { ...invoice, status: newStatus as Invoice['status'] }
          : invoice
      ))

      toast({
        title: "Success",
        description: "Invoice status updated successfully.",
      })
    } catch (error) {
      console.error("Failed to update invoice status:", error)
      toast({
        title: "Error",
        description: "Failed to update invoice status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getAvailableProjects = (clientId: string) => {
    return projects.filter(project => project.clientId === clientId)
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Invoicing</h1>
        <Dialog open={isNewInvoiceOpen} onOpenChange={setIsNewInvoiceOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Invoice
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>Fill in the details for the new invoice.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client" className="text-right">
                  Client
                </Label>
                <Select value={selectedClient} onValueChange={(value) => {
                  setSelectedClient(value)
                  setSelectedProject("")
                }}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client._id} value={client._id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedClient && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="project" className="text-right">
                    Project
                  </Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableProjects(selectedClient).map((project) => (
                        <SelectItem key={project._id} value={project._id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount (PKR)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  className="col-span-3"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount in PKR"
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
            </div>
            <Button onClick={handleCreateInvoice}>Create Invoice</Button>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>Manage your invoices and track payments</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Amount (PKR)</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status & Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => {
                const client = clients.find(c => c._id === invoice.clientId)
                const project = projects.find(p => p._id === invoice.projectId)
                return (
                  <TableRow key={invoice._id}>
                    <TableCell className="font-medium">{invoice._id}</TableCell>
                    <TableCell>{client?.name || 'Loading...'}</TableCell>
                    <TableCell>{project?.name || 'Loading...'}</TableCell>
                    <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                    <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <Badge className={getStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                        <div className="flex items-center gap-2">
                          {invoice.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(invoice._id, 'sent')}
                            >
                              <Send className="h-4 w-4 mr-1" /> Send
                            </Button>
                          )}
                          {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(invoice._id, 'paid')}
                              className="text-green-600"
                            >
                              <Check className="h-4 w-4 mr-1" /> Mark Paid
                            </Button>
                          )}
                          {invoice.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600"
                              onClick={() => {
                                toast({
                                  title: "Not Implemented",
                                  description: "Delete functionality coming soon.",
                                })
                              }}
                            >
                              <X className="h-4 w-4 mr-1" /> Delete
                            </Button>
                          )}
                        </div>
                      </div>
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

