import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "LMCT PRO - Dealer Management System",
  description: "Professional dealer management system for Australian Licensed Motor Car Traders. Manage stock, sales, customers, and compliance with ease.",
  keywords: ["LMCT", "dealer management", "car sales", "automotive", "Australia", "VicRoads"],
  manifest: "/manifest.json",
  applicationName: "LMCT PRO",
  appleWebApp: {
    capable: true,
    title: "LMCT PRO",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="top-center" theme="dark" />
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
