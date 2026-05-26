// AI tool definitions and server-side executors for the dealer assistant.
//
// Tools run under the dealer's authenticated Supabase server client, so RLS
// alone enforces data isolation — no per-tool user_id checks needed.

import type { SupabaseClient } from "@supabase/supabase-js"

export type ToolInput = Record<string, unknown>

export interface Tool {
  name: string
  description: string
  input_schema: {
    type: "object"
    properties: Record<string, unknown>
    required?: string[]
  }
}

export const tools: Tool[] = [
  {
    name: "lookup_vehicle_by_rego",
    description:
      "Look up a vehicle in the dealer's stock by registration plate. Returns the full vehicle record if found, or null. Use this when the dealer asks about a specific car by rego.",
    input_schema: {
      type: "object",
      properties: {
        rego: {
          type: "string",
          description: "Registration plate. Case-insensitive, whitespace ignored.",
        },
      },
      required: ["rego"],
    },
  },
  {
    name: "stock_summary",
    description:
      "Summarise the dealer's current stock: count by status, total inventory value at purchase price and at asking price, oldest 5 available cars by acquisition date. Use this for 'what's in stock' or 'how much inventory do I have' style questions.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_sale_for_vehicle",
    description:
      "Get the sale record for a specific vehicle by its ID, including buyer, profit, margin and dates. Returns null if the vehicle has not been sold.",
    input_schema: {
      type: "object",
      properties: {
        vehicle_id: {
          type: "string",
          description: "UUID of the vehicle.",
        },
      },
      required: ["vehicle_id"],
    },
  },
  {
    name: "top_makes_last_n_days",
    description:
      "Find the top-selling makes from completed sales in the last N days, ranked by units sold. Returns total revenue and average profit per make.",
    input_schema: {
      type: "object",
      properties: {
        days: {
          type: "integer",
          description: "Lookback window in days. Defaults to 90.",
        },
      },
    },
  },
  {
    name: "aged_stock_action_plan",
    description:
      "Identify aged stock — vehicles still Available after more than N days since acquisition. Returns oldest-first, with a suggested action ('reduce price', 'reduce price aggressively', 'wholesale or auction', etc.) based on age band. Use this for 'what should I do about old cars' questions.",
    input_schema: {
      type: "object",
      properties: {
        threshold_days: {
          type: "integer",
          description: "Age threshold in days. Defaults to 60.",
        },
      },
    },
  },
]

type ToolResult = unknown

export async function executeTool(
  name: string,
  input: ToolInput,
  supabase: SupabaseClient,
  userId: string
): Promise<ToolResult> {
  switch (name) {
    case "lookup_vehicle_by_rego": {
      const rego = String(input.rego ?? "").trim().toUpperCase()
      if (!rego) return { error: "rego required" }
      const { data } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", userId)
        .ilike("rego", rego)
        .limit(1)
        .maybeSingle()
      return data ?? null
    }

    case "stock_summary": {
      const { data: rows } = await supabase
        .from("vehicles")
        .select("status, price, purchase_price, make, model, year, acquisition_date, rego")
        .eq("user_id", userId)
      const vehicles = rows ?? []
      const byStatus: Record<string, number> = {}
      let inventoryAtCost = 0
      let inventoryAtAsk = 0
      for (const v of vehicles) {
        const status = String(v.status ?? "Unknown")
        byStatus[status] = (byStatus[status] ?? 0) + 1
        if (status === "Available") {
          inventoryAtCost += Number(v.purchase_price ?? 0)
          inventoryAtAsk += Number(v.price ?? 0)
        }
      }
      const oldest_available = vehicles
        .filter((v) => v.status === "Available" && v.acquisition_date)
        .sort((a, b) =>
          String(a.acquisition_date).localeCompare(String(b.acquisition_date))
        )
        .slice(0, 5)
        .map((v) => ({
          rego: v.rego,
          title: `${v.year} ${v.make} ${v.model}`.trim(),
          acquired: v.acquisition_date,
        }))
      return {
        total_vehicles: vehicles.length,
        by_status: byStatus,
        inventory_at_cost: Math.round(inventoryAtCost),
        inventory_at_ask: Math.round(inventoryAtAsk),
        oldest_available,
      }
    }

    case "get_sale_for_vehicle": {
      const vehicle_id = String(input.vehicle_id ?? "")
      if (!vehicle_id) return { error: "vehicle_id required" }
      const { data } = await supabase
        .from("sales")
        .select("*")
        .eq("user_id", userId)
        .eq("vehicle_id", vehicle_id)
        .order("sale_date", { ascending: false })
        .limit(1)
        .maybeSingle()
      return data ?? null
    }

    case "top_makes_last_n_days": {
      const days = Number(input.days ?? 90)
      const since = new Date()
      since.setDate(since.getDate() - days)
      const sinceISO = since.toISOString().split("T")[0]
      const { data: rows } = await supabase
        .from("sales")
        .select("make, sale_price, profit")
        .eq("user_id", userId)
        .eq("status", "Completed")
        .gte("sale_date", sinceISO)
      const byMake = new Map<
        string,
        { units: number; revenue: number; profit: number }
      >()
      for (const s of rows ?? []) {
        const make = String(s.make ?? "Unknown")
        const e = byMake.get(make) ?? { units: 0, revenue: 0, profit: 0 }
        e.units += 1
        e.revenue += Number(s.sale_price ?? 0)
        e.profit += Number(s.profit ?? 0)
        byMake.set(make, e)
      }
      const ranked = Array.from(byMake.entries())
        .map(([make, e]) => ({
          make,
          units: e.units,
          revenue: Math.round(e.revenue),
          avg_profit: Math.round(e.profit / e.units),
        }))
        .sort((a, b) => b.units - a.units)
      return { window_days: days, since: sinceISO, top_makes: ranked }
    }

    case "aged_stock_action_plan": {
      const threshold = Number(input.threshold_days ?? 60)
      const today = new Date()
      const { data: rows } = await supabase
        .from("vehicles")
        .select("id, rego, make, model, year, price, acquisition_date")
        .eq("user_id", userId)
        .eq("status", "Available")
      const aged = (rows ?? [])
        .map((v) => {
          if (!v.acquisition_date) return null
          const acq = new Date(String(v.acquisition_date))
          const days = Math.floor(
            (today.getTime() - acq.getTime()) / (1000 * 60 * 60 * 24)
          )
          if (days < threshold) return null
          let action = "monitor"
          if (days > 120) action = "wholesale or auction"
          else if (days > 90) action = "reduce price aggressively"
          else if (days > 60) action = "reduce price 5-8%"
          return {
            id: v.id,
            rego: v.rego,
            title: `${v.year} ${v.make} ${v.model}`.trim(),
            ask_price: Number(v.price ?? 0),
            days_in_stock: days,
            suggested_action: action,
          }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
        .sort((a, b) => b.days_in_stock - a.days_in_stock)
      return { threshold_days: threshold, aged_count: aged.length, vehicles: aged }
    }

    default:
      return { error: `unknown tool: ${name}` }
  }
}
