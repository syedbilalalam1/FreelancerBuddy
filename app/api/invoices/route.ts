import { NextResponse } from "next/server"
import { addInvoice, getInvoices, updateInvoiceStatus } from "@/lib/db"

export async function GET() {
  try {
    const invoices = await getInvoices()
    return NextResponse.json(invoices)
  } catch (error) {
    console.error("Failed to fetch invoices:", error)
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const invoice = await addInvoice({
      clientId: data.clientId,
      projectId: data.projectId,
      amount: data.amount,
      status: "draft",
      dueDate: new Date(data.dueDate),
      createdAt: new Date()
    })
    return NextResponse.json(invoice)
  } catch (error) {
    console.error("Failed to create invoice:", error)
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const data = await request.json()
    const { invoiceId, status } = data
    
    const result = await updateInvoiceStatus(invoiceId, status)
    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update invoice:", error)
    return NextResponse.json(
      { error: "Failed to update invoice status" },
      { status: 500 }
    )
  }
}

