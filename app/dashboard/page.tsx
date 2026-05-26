import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

function fmt(n: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(n)
}

function daysAgo(date: string) {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]

  const [vehiclesRes, salesRes, customersRes, profileRes] = await Promise.all([
    supabase.from("vehicles").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("sales").select("*").eq("user_id", user.id).order("sale_date", { ascending: false }),
    supabase.from("customers").select("id, hot").eq("user_id", user.id),
    supabase.from("profiles").select("dealer_name, ai_name").eq("id", user.id).single(),
  ])

  const vehicles  = vehiclesRes.data  || []
  const sales     = salesRes.data     || []
  const customers = customersRes.data || []
  const profile   = profileRes.data

  const available  = vehicles.filter((v: any) => v.status === "Available")
  const mtdSales   = sales.filter((s: any) => s.sale_date >= mtdStart)
  const hotLeads   = customers.filter((c: any) => c.hot === true)
  const mtdRevenue = mtdSales.reduce((s: number, x: any) => s + (x.sale_price || 0), 0)
  const mtdProfit  = mtdSales.reduce((s: number, x: any) => s + (x.profit || 0), 0)
  const avgMargin  = mtdSales.length ? mtdSales.reduce((s: number, x: any) => s + (x.margin || 0), 0) / mtdSales.length : 0

  const aged60 = available.filter((v: any) => daysAgo(v.acquisition_date || v.created_at) >= 60)
  const aged30 = available.filter((v: any) => { const d = daysAgo(v.acquisition_date || v.created_at); return d >= 30 && d < 60 })
  const fresh  = available.filter((v: any) => daysAgo(v.acquisition_date || v.created_at) < 30)

  // Body type breakdown
  const bodyMap: Record<string, number> = {}
  for (const v of available as any[]) {
    const b = v.body || "Other"
    bodyMap[b] = (bodyMap[b] || 0) + 1
  }
  const bodyData = Object.entries(bodyMap).sort((a, b) => b[1] - a[1])

  // 6 month sales trend
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  const trendData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const count = (sales as any[]).filter(s => s.sale_date?.startsWith(key)).length
    return { month: monthNames[d.getMonth()], count }
  })
  const maxCount = Math.max(...trendData.map(t => t.count), 1)

  const today = now.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })
  const aiName = (profile as any)?.ai_name || "MAX"

  const bodyColors = ["#7C3AED","#E8A020","#10B981","#3B82F6","#EF4444","#F59E0B"]

  return (
    <div style={{ background: "#080D1A", minHeight: "100vh", color: "#F1F0FF" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        .scard { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding:20px 24px; }
        .rrow { display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
        .rrow:last-child { border-bottom:none; }
        .qbtn { display:flex; align-items:center; justify-content:space-between; padding:11px 14px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:10px; text-decoration:none; }
        @media(max-width:900px){.g4{grid-template-columns:1fr 1fr !important}.g3{grid-template-columns:1fr !important}.g2{grid-template-columns:1fr !important}}
      `}</style>

      {/* Top bar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 28px", borderBottom:"1px solid rgba(255,255,255,0.05)", background:"rgba(255,255,255,0.02)" }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"#F1F0FF" }}>Dashboard</h1>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.35)", marginTop:2 }}>{today}</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:30, padding:"6px 14px" }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"#10B981", animation:"pulse 2s infinite" }}></div>
            <span style={{ fontSize:11, fontWeight:700, color:"#10B981", letterSpacing:"0.5px" }}>AI ACTIVE</span>
          </div>
          <Link href="/dashboard/stock">
            <button style={{ background:"#E8A020", color:"#0D1F3C", border:"none", borderRadius:8, padding:"9px 18px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
              + Add Vehicle
            </button>
          </Link>
        </div>
      </div>

      <div style={{ padding:"24px 28px", display:"flex", flexDirection:"column", gap:20 }}>

        {/* Aged alert */}
        {(aged60 as any[]).length > 0 && (
          <div style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:12, padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:16, color:"#EF4444" }}>⚠</span>
              <span style={{ fontSize:13, fontWeight:700, color:"#EF4444" }}>
                {(aged60 as any[]).length} vehicle{(aged60 as any[]).length > 1 ? "s" : ""} aged 60+ days —
              </span>
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.4)" }}>
                {fmt((aged60 as any[]).reduce((s: number, v: any) => s + (v.price || 0), 0))} tied up
              </span>
            </div>
            <Link href="/dashboard/stock">
              <button style={{ background:"rgba(239,68,68,0.12)", color:"#EF4444", border:"1px solid rgba(239,68,68,0.25)", borderRadius:6, padding:"6px 14px", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                View aged stock →
              </button>
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="g4" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
          {[
            { label:"In Stock",    value:String(available.length),   sub:`${vehicles.length} total`,            color:"#F1F0FF" },
            { label:"Sold MTD",    value:String(mtdSales.length),    sub:`${sales.length} all time`,            color:"#10B981" },
            { label:"MTD Revenue", value:fmt(mtdRevenue),            sub:"this month",                         color:"#F1F0FF" },
            { label:"MTD Profit",  value:fmt(mtdProfit),             sub:`${avgMargin.toFixed(1)}% avg margin`, color:"#10B981" },
          ].map(s => (
            <div key={s.label} className="scard">
              <div style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:10 }}>{s.label}</div>
              <div style={{ fontSize:30, fontWeight:800, color:s.color, lineHeight:1, marginBottom:6 }}>{s.value}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="g3" style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1.4fr", gap:14 }}>

          {/* Inventory health donut */}
          <div className="scard">
            <div style={{ fontSize:13, fontWeight:600, color:"#F1F0FF", marginBottom:4 }}>Inventory Health</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginBottom:20 }}>{available.length} vehicles · live</div>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
              <div style={{ position:"relative", width:100, height:100 }}>
                <svg viewBox="0 0 100 100" style={{ transform:"rotate(-90deg)" }}>
                  {(() => {
                    const total = available.length || 1
                    const segments = [
                      { value: fresh.length, color:"#10B981" },
                      { value: (aged30 as any[]).length, color:"#F59E0B" },
                      { value: aged60.length, color:"#EF4444" },
                    ]
                    let offset = 0
                    return segments.map((seg, i) => {
                      const pct = seg.value / total
                      const dash = pct * 251.2
                      const el = (
                        <circle key={i} cx="50" cy="50" r="40"
                          fill="none" stroke={seg.color} strokeWidth="12"
                          strokeDasharray={`${dash} ${251.2 - dash}`}
                          strokeDashoffset={-offset}
                          opacity={seg.value === 0 ? 0 : 1}
                        />
                      )
                      offset += dash
                      return el
                    })
                  })()}
                </svg>
                <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center" }}>
                  <div style={{ fontSize:22, fontWeight:800, color:"#F1F0FF", lineHeight:1 }}>{available.length}</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:2 }}>total</div>
                </div>
              </div>
            </div>
            {[
              { label:"Fresh (0–30d)",  count:fresh.length,            color:"#10B981" },
              { label:"Watch (31–60d)", count:(aged30 as any[]).length, color:"#F59E0B" },
              { label:"Aged (60d+)",    count:(aged60 as any[]).length, color:"#EF4444" },
            ].map(item => (
              <div key={item.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:12, marginBottom:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:item.color }}></div>
                  <span style={{ color:"rgba(255,255,255,0.45)" }}>{item.label}</span>
                </div>
                <span style={{ color:item.color, fontWeight:700 }}>{item.count}</span>
              </div>
            ))}
          </div>

          {/* Body type */}
          <div className="scard">
            <div style={{ fontSize:13, fontWeight:600, color:"#F1F0FF", marginBottom:4 }}>By Body Type</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginBottom:16 }}>Current stock mix</div>
            {bodyData.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 0", color:"rgba(255,255,255,0.2)", fontSize:12 }}>No stock yet</div>
            ) : bodyData.slice(0, 6).map(([name, count], i) => {
              const pct = available.length ? Math.round(count / available.length * 100) : 0
              return (
                <div key={name} style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:5 }}>
                    <span style={{ color:"rgba(255,255,255,0.55)" }}>{name}</span>
                    <span style={{ color:"rgba(255,255,255,0.35)" }}>{count}</span>
                  </div>
                  <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden" }}>
                    <div style={{ width:`${pct}%`, height:"100%", background:bodyColors[i % bodyColors.length], borderRadius:3 }}></div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Sales trend */}
          <div className="scard">
            <div style={{ fontSize:13, fontWeight:600, color:"#F1F0FF", marginBottom:4 }}>Sales Trend</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginBottom:16 }}>Last 6 months</div>
            <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:120, padding:"0 4px" }}>
              {trendData.map((t, i) => (
                <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:600 }}>{t.count > 0 ? t.count : ""}</div>
                  <div style={{
                    width:"100%", borderRadius:"4px 4px 0 0",
                    background: i === trendData.length - 1 ? "#7C3AED" : "rgba(124,58,237,0.35)",
                    height: `${Math.max((t.count / maxCount) * 80, t.count > 0 ? 8 : 4)}px`,
                    minHeight:4, transition:"height 0.5s ease",
                  }}></div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>{t.month}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Aged detail + Quick actions */}
        <div className="g2" style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr", gap:14 }}>
          <div className="scard">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:"#F1F0FF" }}>Stock Ageing Alert</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2 }}>Vehicles tying up your cash</div>
              </div>
              <Link href="/dashboard/stock">
                <button style={{ background:"rgba(232,160,32,0.1)", color:"#E8A020", border:"1px solid rgba(232,160,32,0.2)", borderRadius:6, padding:"6px 12px", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                  Run Strategy →
                </button>
              </Link>
            </div>
            {(() => {
              const agedVehicles = (available as any[])
                .map(v => ({ ...v, days: daysAgo(v.acquisition_date || v.created_at) }))
                .filter(v => v.days >= 30)
                .sort((a, b) => b.days - a.days)
                .slice(0, 6)
              if (agedVehicles.length === 0) return (
                <div style={{ textAlign:"center", padding:"28px 0", color:"rgba(255,255,255,0.2)", fontSize:12 }}>No aged stock — great work</div>
              )
              return (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {agedVehicles.map((v: any) => {
                    const isAged = v.days >= 60
                    const c = isAged ? "#EF4444" : "#F59E0B"
                    return (
                      <div key={v.id} style={{ background:`rgba(${isAged?"239,68,68":"245,158,11"},0.06)`, border:`1px solid rgba(${isAged?"239,68,68":"245,158,11"},0.18)`, borderRadius:10, padding:"12px 14px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                          <span style={{ fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:10, background:`rgba(${isAged?"239,68,68":"245,158,11"},0.15)`, color:c }}>
                            {isAged ? "60+ DAYS" : "30-60 DAYS"}
                          </span>
                          <span style={{ fontSize:12, fontWeight:800, color:c }}>{v.days}d</span>
                        </div>
                        <div style={{ fontSize:13, fontWeight:600, color:"#F1F0FF" }}>{v.year} {v.make} {v.model}</div>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{fmt(v.price || 0)}</div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>

          <div className="scard">
            <div style={{ fontSize:13, fontWeight:600, color:"#F1F0FF", marginBottom:16 }}>Quick Actions</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                { label:"Add Vehicle",        href:"/dashboard/stock",     icon:"🚗", c:"#7C3AED" },
                { label:"Record a Sale",      href:"/dashboard/sales",     icon:"💰", c:"#10B981" },
                { label:`Ask ${aiName}`,      href:"/dashboard/assistant", icon:"⚡", c:"#E8A020" },
                { label:"Compliance Forms",   href:"/dashboard/forms",     icon:"📋", c:"#3B82F6" },
                { label:"Market Intelligence",href:"/dashboard/intel",     icon:"📈", c:"#F59E0B" },
              ].map(a => (
                <Link key={a.label} href={a.href} className="qbtn">
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:`${a.c}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>{a.icon}</div>
                    <span style={{ fontSize:13, fontWeight:500, color:"rgba(255,255,255,0.65)" }}>{a.label}</span>
                  </div>
                  <span style={{ color:"rgba(255,255,255,0.2)" }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent stock + sales */}
        <div className="g2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <div className="scard">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#F1F0FF" }}>Recent Stock</div>
              <Link href="/dashboard/stock" style={{ fontSize:12, color:"#E8A020", textDecoration:"none" }}>All →</Link>
            </div>
            {available.length === 0 ? (
              <div style={{ textAlign:"center", padding:"32px 0" }}>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.25)" }}>No vehicles yet</div>
                <Link href="/dashboard/stock" style={{ fontSize:12, color:"#E8A020", textDecoration:"none", display:"block", marginTop:6 }}>Add your first vehicle →</Link>
              </div>
            ) : (available as any[]).slice(0, 5).map((v: any) => {
              const days = daysAgo(v.acquisition_date || v.created_at)
              const ageColor = days >= 60 ? "#EF4444" : days >= 30 ? "#F59E0B" : "#10B981"
              return (
                <div key={v.id} className="rrow">
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#F1F0FF" }}>{v.year} {v.make} {v.model}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{v.rego || "No rego"}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#F1F0FF" }}>{fmt(v.price || 0)}</div>
                    <div style={{ fontSize:11, color:ageColor, marginTop:2, fontWeight:600 }}>{days}d</div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="scard">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#F1F0FF" }}>Recent Sales</div>
              <Link href="/dashboard/sales" style={{ fontSize:12, color:"#E8A020", textDecoration:"none" }}>All →</Link>
            </div>
            {sales.length === 0 ? (
              <div style={{ textAlign:"center", padding:"32px 0" }}>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.25)" }}>No sales yet</div>
                <Link href="/dashboard/sales" style={{ fontSize:12, color:"#E8A020", textDecoration:"none", display:"block", marginTop:6 }}>Record your first sale →</Link>
              </div>
            ) : (sales as any[]).slice(0, 5).map((s: any) => (
              <div key={s.id} className="rrow">
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#F1F0FF" }}>{s.year} {s.make} {s.model}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2 }}>
                    {s.buyer_name || "Buyer"} · {s.sale_date}
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#F1F0FF" }}>{fmt(s.sale_price || 0)}</div>
                  <div style={{ fontSize:11, color:"#10B981", marginTop:2, fontWeight:600 }}>+{fmt(s.profit || 0)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
