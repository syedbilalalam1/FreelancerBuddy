import { NextResponse } from "next/server"
import { addClient, getClients } from "@/lib/db"

export async function GET() {
  try {
    const clients = await getClients()
    return NextResponse.json(clients)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const client = await addClient({
      name: data.name,
      email: data.email,
      status: "active",
      projects: [],
      createdAt: new Date()
    })
    return NextResponse.json(client)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to add client" }, { status: 500 })
  }
}

