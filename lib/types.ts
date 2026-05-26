// Source of truth: scripts/001_create_schema.sql
// Every interface here mirrors a row in the corresponding public.* table.
// If you change a column in SQL, change it here, and the build will tell you
// which UI references to update (assuming typescript.ignoreBuildErrors is off).

export type VehicleStatus = "Available" | "Reserved" | "Sold" | "Pending"
export type SaleStatus    = "Completed" | "Pending" | "Cancelled"
export type TaskStatus    = "todo" | "in_progress" | "done"
export type TaskPriority  = "low" | "medium" | "high"
export type ChatRole      = "user" | "assistant" | "system"
export type AiPersonality = "direct" | "friendly" | "formal"
export type ProfileRole   = "dealer" | "founder" | "support" | "analyst"
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "paused"
export type PlanId = "software_ai" | "done_for_you" | "grow_for_you"

// public.profiles — 1:1 with auth.users
export interface Profile {
  id: string
  dealer_name: string
  lmct: string
  abn: string
  acn: string
  address: string
  phone: string
  email: string
  website: string
  manager_pin: string
  warn_margin: number
  min_margin: number
  target_margin: number
  ai_name: string
  ai_personality: AiPersonality
  ai_training: string
  role: ProfileRole   // added by scripts/004 — gates /admin access
  // Billing (scripts/005)
  stripe_customer_id: string | null
  subscription_status: SubscriptionStatus
  plan: PlanId | null
  trial_ends_at: string | null
  created_at: string
  updated_at: string
}

// public.vehicles — stock inventory
export interface Vehicle {
  id: string
  user_id: string
  make: string
  model: string
  year: number
  variant: string       // added by scripts/002 — trim level
  stock_number: string  // added by scripts/002 — dealer SKU
  colour: string
  body: string
  transmission: string
  fuel: string
  odometer: number
  rego: string
  rego_expiry: string | null
  vin: string
  price: number
  purchase_price: number
  recon_cost: number
  other_cost: number
  source: string
  acquisition_date: string
  status: VehicleStatus
  score: number
  notes: string
  features: string[]    // added by scripts/002 — listing bullets
  images: string[]
  ppsr_checked: boolean // added by scripts/005 — quality filter
  created_at: string
  updated_at: string
}

// public.customers
export interface Customer {
  id: string
  user_id: string
  name: string
  phone: string
  email: string
  address: string
  license: string
  date_of_birth: string | null  // added by scripts/002 — required on VicRoads VP151
  interests: string
  notes: string
  hot: boolean
  lead_source: string           // added by scripts/005
  created_at: string
  updated_at: string
}

// public.sales — vehicle snapshot fields (make/model/year/rego) survive vehicle deletion
export interface Sale {
  id: string
  user_id: string
  vehicle_id: string | null
  customer_id: string | null
  make: string
  model: string
  year: number
  rego: string
  sale_price: number
  total_cost: number
  profit: number
  margin: number
  buyer_name: string
  buyer_email: string
  buyer_phone: string
  buyer_address: string
  buyer_license: string
  sale_date: string
  settlement_date: string | null
  status: SaleStatus
  notes: string
  payment_method: string     // added by scripts/003
  deposit_amount: number     // added by scripts/003
  warranty_type: string      // added by scripts/003
  warranty_months: number    // added by scripts/003
  created_at: string
  updated_at: string
  // Joined relations (when select includes them)
  vehicle?: Vehicle | null
  customer?: Customer | null
}

// public.tasks
export interface Task {
  id: string
  user_id: string
  vehicle_id: string | null
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  created_at: string
  updated_at: string
  // Joined relation
  vehicle?: Vehicle | null
}

// public.chat_history — MAX conversation memory
export interface ChatHistory {
  id: string
  user_id: string
  role: ChatRole
  content: string
  created_at: string
}

// public.email_settings — Resend (or other provider) per-user config
export interface EmailSettings {
  id: string
  user_id: string
  api_key: string
  sender_email: string
  sender_name: string
  created_at: string
  updated_at: string
}

// Computed values for the dashboard — not a table, lives in the UI layer
export interface DashboardStats {
  totalVehicles: number
  availableVehicles: number
  totalSales: number
  totalRevenue: number
  totalProfit: number
  pendingTasks: number
}
