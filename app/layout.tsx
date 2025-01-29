import "./globals.css"
import { Inter } from "next/font/google"
import { Sidebar } from "@/components/sidebar"
import { Clock } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Project Ziio",
  description: "Your personal freelancing assistant",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} flex h-screen overflow-hidden`}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white shadow-sm z-10">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-end items-center">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-2" />
                Started development on 27th January
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto bg-gradient-to-br from-rose-100 via-white to-teal-100 p-6">
            {children}
          </main>
          <footer className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600">
              Developed by Syed Bilal Alam
            </div>
          </footer>
        </div>
        <Toaster />
      </body>
    </html>
  )
}

