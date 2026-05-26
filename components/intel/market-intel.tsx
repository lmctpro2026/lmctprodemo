"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { Vehicle, Sale } from "@/lib/types"
import { TrendingUp, DollarSign, Package, BarChart3, PieChart } from "lucide-react"

interface MarketIntelProps {
  vehicles: Vehicle[]
  sales: Sale[]
}

export function MarketIntel({ vehicles, sales }: MarketIntelProps) {
  // Calculate metrics
  const totalStock = vehicles.length
  const availableStock = vehicles.filter(v => v.status === "Available").length
  const totalSales = sales.length

  const totalRevenue = sales.reduce((sum, s) => sum + (s.sale_price || 0), 0)
  // Use sales.profit (computed at sale time) — falls back to revenue - vehicle.purchase_price if join present
  const totalProfit = sales.reduce((sum, s) => sum + (s.profit || 0), 0)
  const avgProfit = totalSales > 0 ? totalProfit / totalSales : 0
  const avgDaysToSell = 14 // TODO: compute from sale_date - acquisition_date once data exists

  // Stock value at retail price
  const stockValue = vehicles
    .filter(v => v.status === "Available")
    .reduce((sum, v) => sum + (v.price || 0), 0)

  // Sales by make (uses the vehicle snapshot stored on sales row)
  const salesByMake = sales.reduce((acc, s) => {
    const make = s.make || "Unknown"
    acc[make] = (acc[make] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const topMakes = Object.entries(salesByMake)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Stock by status (lowercase keys for display; uppercase comparisons against SQL)
  const stockByStatus = {
    available: vehicles.filter(v => v.status === "Available").length,
    reserved: vehicles.filter(v => v.status === "Reserved").length,
    sold: vehicles.filter(v => v.status === "Sold").length,
    pending: vehicles.filter(v => v.status === "Pending").length,
  }

  // Profit margins — use the stored margin column if populated, else compute
  const margins = sales.map(s => {
    if (s.margin) return s.margin
    if (s.total_cost > 0 && s.sale_price > 0) {
      return ((s.sale_price - s.total_cost) / s.sale_price) * 100
    }
    return 0
  })
  const avgMargin = margins.length > 0
    ? margins.reduce((a, b) => a + b, 0) / margins.length
    : 0

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From {totalSales} sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalProfit)}</div>
            <p className="text-xs text-muted-foreground">
              {avgMargin.toFixed(1)}% avg margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stockValue)}</div>
            <p className="text-xs text-muted-foreground">
              {availableStock} vehicles available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Profit/Sale</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgProfit)}</div>
            <p className="text-xs text-muted-foreground">
              ~{avgDaysToSell} days avg to sell
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Makes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Selling Makes
            </CardTitle>
            <CardDescription>Your best performing brands</CardDescription>
          </CardHeader>
          <CardContent>
            {topMakes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No sales data yet
              </p>
            ) : (
              <div className="space-y-4">
                {topMakes.map(([make, count]) => {
                  const percentage = (count / totalSales) * 100
                  return (
                    <div key={make}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{make}</span>
                        <span className="text-sm text-muted-foreground">
                          {count} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Stock Distribution
            </CardTitle>
            <CardDescription>Current inventory status</CardDescription>
          </CardHeader>
          <CardContent>
            {totalStock === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No vehicles in stock
              </p>
            ) : (
              <div className="space-y-4">
                {Object.entries(stockByStatus)
                  .filter(([_, count]) => count > 0)
                  .map(([status, count]) => {
                    const percentage = (count / totalStock) * 100
                    const colors: Record<string, string> = {
                      available: "bg-success",
                      reserved: "bg-warning",
                      sold: "bg-muted-foreground",
                      pending: "bg-info",
                    }
                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium capitalize">{status}</span>
                          <span className="text-sm text-muted-foreground">
                            {count} ({percentage.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${colors[status]}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>Key metrics at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold">{totalStock}</p>
              <p className="text-sm text-muted-foreground">Total Vehicles</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold">{totalSales}</p>
              <p className="text-sm text-muted-foreground">Total Sales</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold">{avgMargin.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Avg Margin</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold text-primary">{formatCurrency(avgProfit)}</p>
              <p className="text-sm text-muted-foreground">Avg Profit</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
