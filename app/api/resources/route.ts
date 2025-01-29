import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("project_ruby")
    const resources = await db.collection("resources").find({}).toArray()
    return NextResponse.json(resources)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const client = await clientPromise
    const db = client.db("project_ruby")
    const resourceData = await request.json()
    const result = await db.collection("resources").insertOne(resourceData)
    return NextResponse.json({ success: true, id: result.insertedId })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to add resource" }, { status: 500 })
  }
}

