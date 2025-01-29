import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

export async function PATCH(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const data = await request.json()
    const client = await clientPromise
    const db = client.db(process.env.DB_NAME)

    const result = await db
      .collection("tasks")
      .updateOne(
        { _id: new ObjectId(params.taskId) },
        { 
          $set: { 
            status: data.status,
            updatedAt: new Date()
          } 
        }
      )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Failed to update task:", error)
    return NextResponse.json(
      { 
        error: "Failed to update task", 
        details: error?.message || "Unknown error occurred" 
      },
      { status: 500 }
    )
  }
} 