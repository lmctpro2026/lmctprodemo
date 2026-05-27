"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/brand/logo"
import {
  Menu,
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
} from "lucide-react"

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Stock", href: "/dashboard/stock", icon: Package },
  { title: "Sales", href: "/dashboard/sales", icon: DollarSign },
  { title: "Customers", href: "/dashboard/customers", icon: Users },
  { title: "Scanner", href: "/dashboard/scanner", icon: ScanLine },
  { title: "Listing Builder", href: "/dashboard/listing", icon: FileText },
  { title: "Forms", href: "/dashboard/forms", icon: FileText },
  { title: "Tasks", href: "/dashboard/tasks", icon: ListTodo },
  { title: "Market Intel", href: "/dashboard/intel", icon: BarChart3 },
  { title: "AI Assistant", href: "/dashboard/assistant", icon: MessageSquare },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle asChild>
            <span>
              <Logo size={28} tone="transparent" color="#f1f0ff" />
            </span>
          </SheetTitle>
        </SheetHeader>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/dashboard" && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
