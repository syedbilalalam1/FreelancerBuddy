import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("project_ruby")
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const weeklyData = await db
      .collection("time_entries")
      .aggregate([
        { $match: { date: { $gte: oneWeekAgo } } },
        {
          $group: {
            _id: { $dayOfWeek: "$date" },
            totalHours: { $sum: "$duration" },
            projects: { $addToSet: "$project" },
          },
        },
        {
          $project: {
            day: "$_id",
            hours: { $divide: ["$totalHours", 3600] }, // Convert seconds to hours
            projectCount: { $size: "$projects" },
          },
        },
        { $sort: { day: 1 } },
      ])
      .toArray()

    return NextResponse.json(weeklyData)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to fetch weekly data" }, { status: 500 })
  }
}

