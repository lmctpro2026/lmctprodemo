import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans, DM_Mono, Fraunces } from "next/font/google"
import { Toaster } from "sonner"
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register"
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
})
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
})
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
})

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
  themeColor: "#0a0a12",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${jakarta.variable} ${dmMono.variable} ${fraunces.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="top-center" theme="dark" />
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
