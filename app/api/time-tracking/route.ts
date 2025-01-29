import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(request: Request) {
  try {
    const client = await clientPromise
    const db = client.db("project_ruby")
    const { project, task, duration } = await request.json()
    const result = await db.collection("time_entries").insertOne({ project, task, duration, date: new Date() })
    return NextResponse.json({ success: true, id: result.insertedId })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to add time entry" }, { status: 500 })
  }
}

