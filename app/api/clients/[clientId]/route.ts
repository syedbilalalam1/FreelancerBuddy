import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PATCH(
  request: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const { clientId } = params
    const body = await request.json()
    const { status } = body

    if (!status || !['active', 'inactive'].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.DB_NAME)
    
    const result = await db.collection("clients").updateOne(
      { _id: new ObjectId(clientId) },
      { $set: { 
        status,
        updatedAt: new Date().toISOString()
      }}
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      )
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "No changes made" },
        { status: 400 }
      )
    }

    // Fetch the updated client to return
    const updatedClient = await db.collection("clients").findOne(
      { _id: new ObjectId(clientId) }
    )

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error("Failed to update client:", error)
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const { clientId } = params
    const client = await clientPromise
    const db = client.db(process.env.DB_NAME)
    
    const result = await db.collection("clients").deleteOne({
      _id: new ObjectId(clientId)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete client:", error)
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    )
  }
} 