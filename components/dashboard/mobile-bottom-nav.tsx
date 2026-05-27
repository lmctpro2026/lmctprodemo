"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  DollarSign,
  ScanLine,
  Menu,
  Users,
  FileText,
  ListTodo,
  BarChart3,
  Settings,
  MessageSquare,
  FileBarChart,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const primary = [
  { title: "Home", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { title: "Stock", href: "/dashboard/stock", icon: Package },
  { title: "Scan", href: "/dashboard/scanner", icon: ScanLine },
  { title: "Sales", href: "/dashboard/sales", icon: DollarSign },
]

const more = [
  { title: "Customers", href: "/dashboard/customers", icon: Users },
  { title: "Listing Builder", href: "/dashboard/listing", icon: FileText },
  { title: "Forms", href: "/dashboard/forms", icon: FileText },
  { title: "Tasks", href: "/dashboard/tasks", icon: ListTodo },
  { title: "Reports", href: "/dashboard/reports", icon: FileBarChart },
  { title: "Market Intel", href: "/dashboard/intel", icon: BarChart3 },
  { title: "AI Assistant", href: "/dashboard/assistant", icon: MessageSquare },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(href + "/")
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const moreActive = more.some((i) => isActive(pathname, i.href))

  return (
    <nav
      aria-label="Primary"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5">
        {primary.map((item) => {
          const active = isActive(pathname, item.href, item.exact)
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span>{item.title}</span>
              </Link>
            </li>
          )
        })}
        <li>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className={cn(
                  "w-full flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors",
                  moreActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
                <span>More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>More</SheetTitle>
              </SheetHeader>
              <ul className="mt-4 grid grid-cols-3 gap-2 pb-[env(safe-area-inset-bottom)]">
                {more.map((item) => {
                  const active = isActive(pathname, item.href)
                  const Icon = item.icon
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 rounded-lg border border-border/60 p-3 text-xs font-medium transition-colors",
                          active
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                      >
                        <Icon className="w-5 h-5" aria-hidden="true" />
                        <span className="text-center">{item.title}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  )
}
