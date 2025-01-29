import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { Client, Project } from "@/lib/types/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("clientId")
    
    const client = await clientPromise
    const db = client.db(process.env.DB_NAME)

    // If clientId is provided, filter by client
    if (clientId) {
      const projects = await db
        .collection("projects")
        .find({ clientId: new ObjectId(clientId) })
        .toArray()
      return NextResponse.json(projects)
    }

    // Otherwise, return all projects
    const projects = await db
      .collection("projects")
      .find({})
      .sort({ createdAt: -1 })
      .toArray()
    
    return NextResponse.json(projects)
  } catch (error) {
    console.error("Failed to fetch projects:", error)
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const client = await clientPromise
    const db = client.db(process.env.DB_NAME)

    // Create the project with optional fields
    const project = {
      name: data.name,
      clientId: new ObjectId(data.clientId),
      status: data.status || "active",
      progress: data.progress || 0,
      description: data.description || "",
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      createdAt: new Date(),
      priority: data.priority || "medium",
      tags: data.tags || []
    }

    const result = await db.collection("projects").insertOne(project)
    
    // Update the client's projects array
    if (data.clientId) {
      await db
        .collection<Client>("clients")
        .updateOne(
          { _id: new ObjectId(data.clientId) },
          { $push: { projects: result.insertedId } }
        )
    }

    const createdProject = {
      ...project,
      _id: result.insertedId
    }

    return NextResponse.json(createdProject)
  } catch (error: any) {
    console.error("Failed to create project:", error)
    return NextResponse.json(
      { 
        error: "Failed to create project", 
        details: error?.message || "Unknown error occurred" 
      },
      { status: 500 }
    )
  }
} 