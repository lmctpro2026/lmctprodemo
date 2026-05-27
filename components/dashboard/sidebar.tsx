"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/brand/logo"
import {
  Car,
  LayoutDashboard,
  Package,
  DollarSign,
  Users,
  ScanLine,
  FileText,
  ListTodo,
  BarChart3,
  Settings,
  MessageSquare,
  Megaphone,
  FileBarChart,
  Network,
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: typeof Car
}

const sections: { label: string; items: NavItem[] }[] = [
  {
    label: "Workspace",
    items: [
      { title: "Dashboard", href: "/dashboard",           icon: LayoutDashboard },
      { title: "Stock",     href: "/dashboard/stock",     icon: Package },
      { title: "Sales",     href: "/dashboard/sales",     icon: DollarSign },
      { title: "Customers", href: "/dashboard/customers", icon: Users },
    ],
  },
  {
    label: "Tools",
    items: [
      { title: "Scanner",         href: "/dashboard/scanner", icon: ScanLine },
      { title: "Listing builder", href: "/dashboard/listing", icon: Megaphone },
      { title: "Forms",           href: "/dashboard/forms",   icon: FileText },
      { title: "Tasks",           href: "/dashboard/tasks",   icon: ListTodo },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Reports",       href: "/dashboard/reports",   icon: FileBarChart },
      { title: "Market intel",  href: "/dashboard/intel",     icon: BarChart3 },
      { title: "AI assistant",  href: "/dashboard/assistant", icon: MessageSquare },
      { title: "Network",       href: "/dashboard/network",   icon: Network },
    ],
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex w-60 border-r border-border flex-col bg-card/50">
      <div className="h-16 px-4 border-b border-border flex items-center">
        <Link href="/dashboard" aria-label="LMCT PRO home">
          <Logo size={30} tone="transparent" color="#f1f0ff" />
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {sections.map((section) => (
          <div key={section.label}>
            <div className="px-2 pb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-secondary text-foreground font-medium"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-border">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors",
            pathname.startsWith("/dashboard/settings")
              ? "bg-secondary text-foreground font-medium"
              : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
          )}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  )
}
