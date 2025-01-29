import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { Task } from "@/lib/types/db"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db(process.env.DB_NAME)

    const tasks = await db
      .collection("tasks")
      .find({})
      .sort({ dueDate: 1 })
      .toArray()

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Failed to fetch tasks:", error)
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const client = await clientPromise
    const db = client.db(process.env.DB_NAME)

    const task = {
      title: data.title,
      projectId: new ObjectId(data.projectId),
      description: data.description || "",
      status: data.status || "pending",
      priority: data.priority || "medium",
      dueDate: new Date(data.dueDate),
      createdAt: new Date()
    }

    const result = await db.collection("tasks").insertOne(task)

    return NextResponse.json({
      ...task,
      _id: result.insertedId
    })
  } catch (error: any) {
    console.error("Failed to create task:", error)
    return NextResponse.json(
      { 
        error: "Failed to create task", 
        details: error?.message || "Unknown error occurred" 
      },
      { status: 500 }
    )
  }
} 