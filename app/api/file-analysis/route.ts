import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(request: Request) {
  try {
    const client = await clientPromise
    const db = client.db("project_ruby")
    const { fileName, fileSize, analysis } = await request.json()
    const result = await db.collection("file_analyses").insertOne({
      fileName,
      fileSize,
      analysis,
      timestamp: new Date(),
    })
    return NextResponse.json({ success: true, id: result.insertedId })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to save file analysis" }, { status: 500 })
  }
}

