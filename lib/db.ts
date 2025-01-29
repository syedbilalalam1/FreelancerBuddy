import { MongoClient, ObjectId } from "mongodb"
import clientPromise from "./mongodb"
import { DashboardMetrics, Project, Task, TimeEntry, Client, Invoice } from "./types/db"

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
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

  // Get current projects with proper typing
  const currentProjects = await db
    .collection<Omit<Project, "_id">>("projects")
    .find({ status: "active" })
    .sort({ dueDate: 1 })
    .limit(5)
    .toArray()

  // Get upcoming deadlines with proper typing
  const upcomingDeadlines = await db
    .collection<Omit<Task, "_id">>("tasks")
    .find({ status: "pending" })
    .sort({ dueDate: 1 })
    .limit(5)
    .toArray()

  return {
    totalEarnings: totalEarnings[0]?.total || 0,
    activeProjects,
    hoursWorked: Math.round((timeEntries[0]?.total || 0) / 3600), // Convert seconds to hours
    activeClients,
    currentProjects: currentProjects as Project[],
    upcomingDeadlines: upcomingDeadlines as Task[],
  }
}

export async function updateProjectProgress(projectId: string, progress: number) {
  const client = await clientPromise
  const db = client.db(process.env.DB_NAME)

  return db
    .collection("projects")
    .updateOne(
      { _id: new ObjectId(projectId) },
      { $set: { progress, updatedAt: new Date() } }
    )
}

export async function startTask(taskId: string) {
  const client = await clientPromise
  const db = client.db(process.env.DB_NAME)

  return db
    .collection("tasks")
    .updateOne(
      { _id: new ObjectId(taskId) },
      { 
        $set: { 
          status: "in_progress",
          startTime: new Date(),
          updatedAt: new Date()
        } 
      }
    )
}

export async function addTimeEntry(entry: Omit<TimeEntry, "_id">) {
  const client = await clientPromise
  const db = client.db(process.env.DB_NAME)

  return db.collection("time_entries").insertOne({
    ...entry,
    createdAt: new Date()
  })
}

export async function getWeeklyTimeEntries() {
  const client = await clientPromise
  const db = client.db(process.env.DB_NAME)

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  return db
    .collection("time_entries")
    .aggregate([
      { $match: { date: { $gte: oneWeekAgo } } },
      {
        $group: {
          _id: { $dayOfWeek: "$date" },
          totalHours: { $sum: "$duration" },
          projects: { $addToSet: "$projectId" }
        }
      },
      {
        $project: {
          day: "$_id",
          hours: { $divide: ["$totalHours", 3600] },
          projectCount: { $size: "$projects" }
        }
      },
      { $sort: { day: 1 } }
    ])
    .toArray()
}

export async function getClients(): Promise<Client[]> {
  const client = await clientPromise
  const db = client.db(process.env.DB_NAME)
  
  const clients = await db
    .collection<Omit<Client, "_id">>("clients")
    .find({})
    .toArray()
  
  return clients as Client[]
}

export async function addClient(clientData: Omit<Client, "_id">) {
  const mongoClient = await clientPromise
  const db = mongoClient.db(process.env.DB_NAME)
  
  const result = await db
    .collection<Omit<Client, "_id">>("clients")
    .insertOne(clientData)
  
  return { ...clientData, _id: result.insertedId }
}

export async function addProject(projectData: Omit<Project, "_id">) {
  const client = await clientPromise
  const db = client.db(process.env.DB_NAME)
  
  const result = await db
    .collection<Omit<Project, "_id">>("projects")
    .insertOne(projectData)
  
  // Update client's projects array
  await db
    .collection<Client>("clients")
    .updateOne(
      { _id: projectData.clientId },
      { $push: { projects: result.insertedId } }
    )
  
  return { ...projectData, _id: result.insertedId }
}

export async function addTask(taskData: Omit<Task, "_id">) {
  const client = await clientPromise
  const db = client.db(process.env.DB_NAME)
  
  const result = await db
    .collection<Omit<Task, "_id">>("tasks")
    .insertOne(taskData)
  
  return { ...taskData, _id: result.insertedId }
}

export async function getInvoices(): Promise<Invoice[]> {
  const client = await clientPromise
  const db = client.db(process.env.DB_NAME)
  
  const invoices = await db
    .collection<Omit<Invoice, "_id">>("invoices")
    .find({})
    .sort({ createdAt: -1 })
    .toArray()
  
  return invoices as Invoice[]
}

export async function addInvoice(invoiceData: Omit<Invoice, "_id">) {
  const client = await clientPromise
  const db = client.db(process.env.DB_NAME)
  
  const result = await db
    .collection<Omit<Invoice, "_id">>("invoices")
    .insertOne(invoiceData)
  
  return { ...invoiceData, _id: result.insertedId }
}

export async function updateInvoiceStatus(invoiceId: string, status: Invoice["status"]) {
  const client = await clientPromise
  const db = client.db(process.env.DB_NAME)
  
  return db
    .collection<Invoice>("invoices")
    .updateOne(
      { _id: new ObjectId(invoiceId) },
      { 
        $set: { 
          status
        } 
      }
    )
} 