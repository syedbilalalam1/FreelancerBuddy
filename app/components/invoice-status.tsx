"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Send } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface InvoiceStatusProps {
  invoiceId: string
  status: string
  dueDate: string
  onStatusChange: (invoiceId: string, newStatus: string) => Promise<void>
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

export function InvoiceStatus({ invoiceId, status, dueDate, onStatusChange }: InvoiceStatusProps) {
  const { toast } = useToast()
  const isOverdue = new Date(dueDate) < new Date() && status !== 'paid'
  const currentStatus = isOverdue ? 'overdue' : status

  return (
    <div className="flex items-center gap-4">
      <Badge className={getStatusColor(currentStatus)}>
        {currentStatus}
      </Badge>
      <div className="flex items-center gap-2">
        {currentStatus === 'draft' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange(invoiceId, 'sent')}
          >
            <Send className="h-4 w-4 mr-1" /> Send
          </Button>
        )}
        {(currentStatus === 'sent' || currentStatus === 'overdue') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange(invoiceId, 'paid')}
            className="text-green-600"
          >
            <Check className="h-4 w-4 mr-1" /> Mark Paid
          </Button>
        )}
        {currentStatus === 'draft' && (
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
  )
} 