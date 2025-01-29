import { NextResponse } from "next/server"
import { getDashboardMetrics, updateProjectProgress, startTask } from "@/lib/db"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db(process.env.DB_NAME)

    // Get total earnings
    const totalEarnings = await db
      .collection("invoices")
      .aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
      .toArray()

    // Get active projects count
    const activeProjects = await db
      .collection("projects")
      .countDocuments({ status: "active" })

    // Get total hours worked
    const timeEntries = await db
      .collection("time_entries")
      .aggregate([
        { $group: { _id: null, total: { $sum: "$duration" } } }
      ])
      .toArray()

    // Get active clients count
    const activeClients = await db
      .collection("clients")
      .countDocuments({ status: "active" })

    // Get current projects
    const currentProjects = await db
      .collection("projects")
      .find({ status: "active" })
      .sort({ dueDate: 1 })
      .limit(5)
      .toArray()

    // Get upcoming deadlines (tasks) that are not completed
    const upcomingDeadlines = await db
      .collection("tasks")
      .find({ 
        status: { $ne: "completed" },
        dueDate: { $gte: new Date() }
      })
      .sort({ dueDate: 1, priority: -1 }) // Sort by date and then priority (high to low)
      .limit(5)
      .toArray()

    return NextResponse.json({
      totalEarnings: totalEarnings[0]?.total || 0,
      activeProjects,
      hoursWorked: Math.round((timeEntries[0]?.total || 0) / 3600), // Convert seconds to hours
      activeClients,
      currentProjects,
      upcomingDeadlines
    })
  } catch (error) {
    console.error("Failed to fetch dashboard metrics:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard metrics" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { action, data } = await request.json()

    switch (action) {
      case "updateProjectProgress":
        await updateProjectProgress(data.id, data.progress)
        break
      case "startTask":
        await startTask(data.id)
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to update data" }, { status: 500 })
  }
}

