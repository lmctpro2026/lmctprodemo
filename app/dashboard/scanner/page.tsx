"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { lookupVehicleByRego, type VehicleLookupResult } from "@/lib/vehicle-lookup"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { ScanLine, Loader2, Plus, Check, Camera, Keyboard, RotateCcw } from "lucide-react"

interface ScannedVehicle {
  title: string
  year: number
  make: string
  model: string
  odometer: string
  price: number
  transmission: string
  fuel: string
  link?: string
}

type Mode = "plate" | "paste"

export default function ScannerPage() {
  const [mode, setMode] = useState<Mode>("plate")

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Scanner</h1>
          <p className="text-muted-foreground">
            Standing at auction or stuck at the desk — point a plate or paste a listing.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-border p-1 bg-muted/30">
          <ModeBtn active={mode === "plate"} onClick={() => setMode("plate")} icon={<Camera className="h-4 w-4" />}>
            Plate scan
          </ModeBtn>
          <ModeBtn active={mode === "paste"} onClick={() => setMode("paste")} icon={<ScanLine className="h-4 w-4" />}>
            Paste listings
          </ModeBtn>
        </div>
      </div>

      {mode === "plate" ? <PlateScanner /> : <PasteScanner />}
    </div>
  )
}

function ModeBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

// ─── Plate scanner ────────────────────────────────────────────────
type Screen = "scan" | "manual" | "lookup" | "result"

function PlateScanner() {
  const router = useRouter()
  const [screen, setScreen] = useState<Screen>("scan")
  const [plate, setPlate] = useState("")
  const [result, setResult] = useState<VehicleLookupResult | null>(null)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  // Attach the back camera stream when on the scan screen.
  useEffect(() => {
    if (screen !== "scan") {
      stopStream()
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraError("Camera not supported on this device.")
          return
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
      } catch (e) {
        setCameraError((e as Error).message || "Camera permission denied.")
      }
    })()
    return () => {
      cancelled = true
      stopStream()
    }
  }, [screen])

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  async function runLookup(rawPlate: string) {
    const cleaned = rawPlate.trim().toUpperCase().replace(/\s+/g, "")
    if (cleaned.length < 3) {
      toast.error("Plate looks too short — try again.")
      return
    }
    setPlate(cleaned)
    setScreen("lookup")
    // Demo cadence — real vendor call is sub-second; we hold 500ms so the
    // animation is legible.
    await new Promise((r) => setTimeout(r, 500))
    const data = await lookupVehicleByRego(cleaned)
    if (!data) {
      toast.error("No data found for that plate.")
      setScreen("scan")
      return
    }
    setResult(data)
    setScreen("result")
  }

  async function addToStock() {
    if (!result) return
    setAdding(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setAdding(false)
      toast.error("Not signed in.")
      return
    }
    const { error } = await supabase.from("vehicles").insert({
      user_id: user.id,
      make: result.make,
      model: result.model,
      year: result.year,
      variant: result.variant || "",
      body: result.body,
      transmission: result.transmission,
      fuel: result.fuel,
      colour: result.colour,
      odometer: result.odometer ?? 0,
      rego: result.rego,
      vin: result.vin || "",
      purchase_price: result.suggestedBuy ?? 0,
      price: result.suggestedSell ?? 0,
      recon_cost: 0,
      other_cost: 0,
      source: "Auction",
      acquisition_date: new Date().toISOString().split("T")[0],
      status: "Available",
      notes: `Scanner import (${result.source}). Plate: ${result.rego}. Rego expiry: ${result.regoExpiry ?? "n/a"}.`,
      features: [],
    })
    setAdding(false)
    if (error) {
      toast.error(`Add to stock failed: ${error.message}`)
      return
    }
    setAdded(true)
    toast.success(`Added ${result.year} ${result.make} ${result.model} to stock`)
  }

  function reset() {
    setResult(null)
    setPlate("")
    setAdded(false)
    setScreen("scan")
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {screen === "scan" && (
          <ScanScreen videoRef={videoRef} cameraError={cameraError} onCapture={runLookup} onManual={() => setScreen("manual")} />
        )}
        {screen === "manual" && <ManualScreen onLookup={runLookup} onBack={() => setScreen("scan")} />}
        {screen === "lookup" && <LookupScreen plate={plate} />}
        {screen === "result" && result && (
          <ResultScreen
            result={result}
            adding={adding}
            added={added}
            onAdd={addToStock}
            onScanAnother={reset}
            onViewStock={() => router.push("/dashboard/stock")}
          />
        )}
      </CardContent>
    </Card>
  )
}

const SCAN_BG = "#07080f"
const SCAN_GOLD = "#e8a228"
const SCAN_GREEN = "#00ff88"

function ScanScreen({
  videoRef,
  cameraError,
  onCapture,
  onManual,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>
  cameraError: string | null
  onCapture: (plate: string) => void
  onManual: () => void
}) {
  const [typed, setTyped] = useState("")
  return (
    <div style={{ background: SCAN_BG, color: "white", position: "relative", minHeight: 560, display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes scanSweep {
          0% { transform: translateY(0); opacity: 0.85; }
          50% { transform: translateY(220px); opacity: 1; }
          100% { transform: translateY(0); opacity: 0.85; }
        }
        @keyframes cornerPulse {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Top bar */}
      <div style={{ position: "absolute", top: 12, left: 12, right: 12, display: "flex", justifyContent: "space-between", zIndex: 3 }}>
        <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 10, color: "rgba(255,255,255,0.55)", letterSpacing: "0.16em" }}>
          PLATE SCANNER
        </span>
        <span
          style={{
            fontFamily: "var(--font-dm-mono), monospace",
            fontSize: 10,
            letterSpacing: "0.18em",
            color: SCAN_GOLD,
            padding: "3px 8px",
            border: `1px solid ${SCAN_GOLD}66`,
            borderRadius: 999,
          }}
        >
          AUTOGRAB DEMO
        </span>
      </div>

      {/* Camera viewport */}
      <div style={{ position: "relative", width: "100%", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {cameraError ? (
          <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.65)" }}>
            <Camera className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <div style={{ fontSize: 13, maxWidth: 320 }}>{cameraError}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
              Use the input below or tap “Type plate instead”.
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            style={{ width: "100%", maxHeight: 460, objectFit: "cover", background: "#000" }}
          />
        )}

        {/* Scanning frame overlay */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 280,
            height: 130,
            pointerEvents: "none",
          }}
        >
          {/* Corners */}
          {(
            [
              { t: 0, l: 0, bt: true, bl: true },
              { t: 0, r: 0, bt: true, br: true },
              { b: 0, l: 0, bb: true, bl: true },
              { b: 0, r: 0, bb: true, br: true },
            ] as { t?: number; l?: number; b?: number; r?: number; bt?: boolean; bb?: boolean; bl?: boolean; br?: boolean }[]
          ).map((c, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: c.t,
                left: c.l,
                bottom: c.b,
                right: c.r,
                width: 22,
                height: 22,
                borderTop: c.bt ? `2px solid ${SCAN_GOLD}` : undefined,
                borderBottom: c.bb ? `2px solid ${SCAN_GOLD}` : undefined,
                borderLeft: c.bl ? `2px solid ${SCAN_GOLD}` : undefined,
                borderRight: c.br ? `2px solid ${SCAN_GOLD}` : undefined,
                animation: "cornerPulse 2s ease-in-out infinite",
              }}
            />
          ))}
          {/* Sweep line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 10,
              right: 10,
              height: 2,
              background: `linear-gradient(90deg, transparent, ${SCAN_GOLD}, transparent)`,
              animation: "scanSweep 2.4s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      {/* Bottom controls */}
      <div style={{ padding: 16, background: "rgba(7,8,15,0.95)", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 11, color: "rgba(255,255,255,0.55)", textAlign: "center", letterSpacing: "0.1em" }}>
          POINT AT LICENCE PLATE
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value.toUpperCase())}
            placeholder="Type the plate you see"
            style={{
              flex: 1,
              background: "#12141f",
              color: "white",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: "12px 14px",
              borderRadius: 8,
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: 15,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") onCapture(typed)
            }}
          />
          <button
            type="button"
            onClick={() => onCapture(typed)}
            disabled={!typed.trim()}
            style={{
              background: SCAN_GOLD,
              color: SCAN_BG,
              border: 0,
              padding: "12px 18px",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13,
              cursor: typed.trim() ? "pointer" : "not-allowed",
              opacity: typed.trim() ? 1 : 0.5,
            }}
          >
            Capture & lookup
          </button>
        </div>
        <button
          type="button"
          onClick={onManual}
          style={{ background: "transparent", border: 0, color: "rgba(255,255,255,0.55)", padding: 8, cursor: "pointer", fontSize: 12 }}
        >
          <Keyboard className="h-3 w-3 inline-block mr-1" />
          Type plate full-screen instead
        </button>
      </div>
    </div>
  )
}

function ManualScreen({ onLookup, onBack }: { onLookup: (plate: string) => void; onBack: () => void }) {
  const [typed, setTyped] = useState("")
  return (
    <div style={{ background: SCAN_BG, color: "white", minHeight: 560, padding: 40, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 24 }}>
      <div style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 10, letterSpacing: "0.16em", color: "rgba(255,255,255,0.55)" }}>
        MANUAL ENTRY · VIC
      </div>
      <input
        autoFocus
        value={typed}
        onChange={(e) => setTyped(e.target.value.toUpperCase())}
        placeholder="1AB 2CD"
        style={{
          background: "transparent",
          border: 0,
          borderBottom: `2px solid ${SCAN_GOLD}66`,
          color: "white",
          fontFamily: "var(--font-fraunces), Georgia, serif",
          fontSize: 56,
          fontWeight: 800,
          letterSpacing: "0.08em",
          textAlign: "center",
          padding: "8px 18px",
          width: 360,
          maxWidth: "100%",
          outline: "none",
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") onLookup(typed)
        }}
      />
      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="button"
          onClick={onBack}
          style={{ background: "transparent", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.15)", padding: "12px 22px", borderRadius: 999, cursor: "pointer", fontSize: 14 }}
        >
          Back to camera
        </button>
        <button
          type="button"
          onClick={() => onLookup(typed)}
          disabled={!typed.trim()}
          style={{
            background: SCAN_GOLD,
            color: SCAN_BG,
            border: 0,
            padding: "12px 26px",
            borderRadius: 999,
            cursor: typed.trim() ? "pointer" : "not-allowed",
            fontWeight: 700,
            fontSize: 14,
            opacity: typed.trim() ? 1 : 0.5,
          }}
        >
          Look up
        </button>
      </div>
    </div>
  )
}

function LookupScreen({ plate }: { plate: string }) {
  return (
    <div style={{ background: SCAN_BG, color: "white", minHeight: 560, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
      <style>{`
        @keyframes dotBounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }
      `}</style>
      <div style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 64, fontWeight: 800, letterSpacing: "0.08em" }}>{plate}</div>
      <div style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "0.18em" }}>VICTORIA</div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background: SCAN_GOLD,
              animation: "dotBounce 1.2s ease-in-out infinite",
              animationDelay: `${i * 150}ms`,
            }}
          />
        ))}
      </div>
      <div style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 12, color: SCAN_GOLD, letterSpacing: "0.12em" }}>
        FETCHING VEHICLE DATA…
      </div>
    </div>
  )
}

function ResultScreen({
  result,
  adding,
  added,
  onAdd,
  onScanAnother,
  onViewStock,
}: {
  result: VehicleLookupResult
  adding: boolean
  added: boolean
  onAdd: () => void
  onScanAnother: () => void
  onViewStock: () => void
}) {
  const title = `${result.year} ${result.make} ${result.model}`
  return (
    <div style={{ background: SCAN_BG, color: "white", minHeight: 560, padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 10, color: SCAN_GOLD, letterSpacing: "0.18em" }}>
          {result.rego} · {result.regoExpiry ?? "—"}
        </span>
        <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.14em" }}>
          SOURCE · {result.source.toUpperCase()}
        </span>
      </div>
      <h2 style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 36, fontWeight: 700, letterSpacing: "-0.012em", lineHeight: 1.05 }}>
        {title}
      </h2>
      {/* Info grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <InfoCell k="Body" v={result.body} />
        <InfoCell k="Colour" v={result.colour} />
        <InfoCell k="Fuel" v={result.fuel} />
        <InfoCell k="Transmission" v={result.transmission} />
        <InfoCell k="Odometer" v={result.odometer != null ? `${result.odometer.toLocaleString()} km` : "—"} />
        <InfoCell k="Year" v={String(result.year)} />
      </div>
      {/* Price boxes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <PriceBox label="Buy at" value={result.suggestedBuy} sub="Estimated market buy" color={SCAN_GOLD} />
        <PriceBox label="Sell for" value={result.suggestedSell} sub="Suggested retail" color={SCAN_GREEN} />
      </div>
      {/* Profit */}
      <div
        style={{
          background: "#12141f",
          border: `1px solid ${SCAN_GREEN}33`,
          borderRadius: 12,
          padding: "16px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 10, letterSpacing: "0.16em", color: "rgba(255,255,255,0.55)" }}>
          ESTIMATED PROFIT
        </span>
        <span style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 28, fontWeight: 800, color: SCAN_GREEN }}>
          {result.estimatedProfit != null ? `+${formatCurrency(result.estimatedProfit)}` : "—"}
        </span>
      </div>
      {/* AI note */}
      {result.aiNote && (
        <div style={{ background: "rgba(232,162,40,0.06)", border: `1px solid ${SCAN_GOLD}33`, borderRadius: 12, padding: 14 }}>
          <div style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 10, color: SCAN_GOLD, letterSpacing: "0.16em", marginBottom: 4 }}>
            MAX SAYS
          </div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>{result.aiNote}</div>
        </div>
      )}
      {/* Actions */}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button
          type="button"
          onClick={onAdd}
          disabled={adding || added}
          style={{
            flex: 1,
            background: added ? "rgba(0,255,136,0.15)" : SCAN_GOLD,
            color: added ? SCAN_GREEN : SCAN_BG,
            border: added ? `1px solid ${SCAN_GREEN}55` : 0,
            padding: "14px 22px",
            borderRadius: 999,
            cursor: adding || added ? "default" : "pointer",
            fontWeight: 700,
            fontSize: 14,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {adding ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Adding…
            </>
          ) : added ? (
            <>
              <Check className="h-4 w-4" /> Added to stock
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" /> Add to Stock
            </>
          )}
        </button>
        {added ? (
          <button
            type="button"
            onClick={onViewStock}
            style={{ padding: "14px 18px", borderRadius: 999, background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.18)", cursor: "pointer", fontSize: 14 }}
          >
            View stock →
          </button>
        ) : (
          <button
            type="button"
            onClick={onScanAnother}
            style={{ padding: "14px 18px", borderRadius: 999, background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.18)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14 }}
          >
            <RotateCcw className="h-4 w-4" /> Scan another
          </button>
        )}
      </div>
    </div>
  )
}

function InfoCell({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ background: "#12141f", borderRadius: 10, padding: "10px 12px" }}>
      <div style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>
        {k}
      </div>
      <div style={{ fontSize: 14, color: "white" }}>{v}</div>
    </div>
  )
}

function PriceBox({ label, value, sub, color }: { label: string; value: number | null; sub: string; color: string }) {
  return (
    <div style={{ background: "#12141f", borderRadius: 12, padding: 16, border: `1px solid ${color}22` }}>
      <div style={{ fontFamily: "var(--font-dm-mono), monospace", fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.16em" }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontSize: 32, fontWeight: 800, color, lineHeight: 1, marginTop: 6 }}>
        {value != null ? formatCurrency(value) : "—"}
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>{sub}</div>
    </div>
  )
}

// ─── Paste scanner (preserved from prior version) ─────────────────
function PasteScanner() {
  const router = useRouter()
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ScannedVehicle[]>([])
  const [added, setAdded] = useState<Record<number, boolean>>({})
  const [adding, setAdding] = useState<Record<number, boolean>>({})

  async function handleScan() {
    if (!input.trim()) return
    setLoading(true)
    const lines = input.split("\n").filter((l) => l.trim())
    const vehicles: ScannedVehicle[] = []
    let cur: Partial<ScannedVehicle> = {}
    for (const line of lines) {
      const lowerLine = line.toLowerCase()
      const yearMatch = line.match(/\b(20\d{2}|19\d{2})\b/)
      if (yearMatch) {
        if (cur.title) vehicles.push(cur as ScannedVehicle)
        cur = { title: line.trim(), year: parseInt(yearMatch[1]) }
        const afterYear = line.substring(line.indexOf(yearMatch[1]) + 4).trim()
        const parts = afterYear.split(/\s+/)
        if (parts.length >= 1) cur.make = parts[0]
        if (parts.length >= 2) cur.model = parts.slice(1).join(" ")
      }
      const kmMatch = line.match(/(\d{1,3}[,\s]?\d{3})\s*(km|kms|kilometres)/i)
      if (kmMatch && cur.title) cur.odometer = kmMatch[1].replace(/[,\s]/g, "") + " km"
      const priceMatch = line.match(/\$\s*(\d{1,3}[,\s]?\d{3})/i)
      if (priceMatch && cur.title) cur.price = parseInt(priceMatch[1].replace(/[,\s]/g, ""))
      if (lowerLine.includes("automatic") || lowerLine.includes("auto")) cur.transmission = "Automatic"
      else if (lowerLine.includes("manual")) cur.transmission = "Manual"
      if (lowerLine.includes("petrol")) cur.fuel = "Petrol"
      else if (lowerLine.includes("diesel")) cur.fuel = "Diesel"
      else if (lowerLine.includes("hybrid")) cur.fuel = "Hybrid"
      else if (lowerLine.includes("electric")) cur.fuel = "Electric"
    }
    if (cur.title) vehicles.push(cur as ScannedVehicle)
    setResults(vehicles)
    setAdded({})
    setLoading(false)
  }

  async function addToStock(idx: number, v: ScannedVehicle) {
    setAdding((prev) => ({ ...prev, [idx]: true }))
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setAdding((prev) => ({ ...prev, [idx]: false }))
      toast.error("Not signed in")
      return
    }
    const odo = parseInt((v.odometer || "").replace(/[^\d]/g, "")) || 0
    const { error } = await supabase.from("vehicles").insert({
      user_id: user.id,
      make: v.make || "",
      model: v.model || "",
      year: v.year || new Date().getFullYear(),
      variant: "",
      body: "Sedan",
      transmission: v.transmission || "Automatic",
      fuel: v.fuel || "Petrol",
      colour: "",
      odometer: odo,
      rego: "",
      vin: "",
      purchase_price: v.price || 0,
      recon_cost: 0,
      other_cost: 0,
      source: "Auction",
      acquisition_date: new Date().toISOString().split("T")[0],
      price: v.price ? Math.round(v.price * 1.15) : 0,
      status: "Available",
      notes: "Scanner import (paste).",
      features: [],
    })
    setAdding((prev) => ({ ...prev, [idx]: false }))
    if (error) {
      toast.error(`Add to stock failed: ${error.message}`)
      return
    }
    setAdded((prev) => ({ ...prev, [idx]: true }))
    toast.success(`Added ${v.year} ${v.make} ${v.model} to stock`)
    router.refresh()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5" />
            Paste listings
          </CardTitle>
          <CardDescription>Copy text from an auction or listing site — Scanner pulls year, make, model, km, price, fuel, transmission.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`2020 Toyota Camry SL\n45,000 km\nAutomatic, Petrol\n$28,500`}
            className="min-h-[280px] font-mono text-sm"
          />
          <Button onClick={handleScan} disabled={loading || !input.trim()} className="w-full">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scanning…</> : <><ScanLine className="w-4 h-4 mr-2" />Scan listings</>}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analysis · {results.length} vehicle{results.length === 1 ? "" : "s"}</CardTitle>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ScanLine className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No vehicles scanned yet</p>
              <p className="text-sm">Paste listing text and click Scan.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((vehicle, index) => {
                const estimatedRetail = vehicle.price ? Math.round(vehicle.price * 1.15) : 0
                const potentialProfit = vehicle.price ? estimatedRetail - vehicle.price : 0
                return (
                  <div key={index} className="p-4 rounded-lg border border-border bg-muted/30">
                    <h3 className="font-semibold mb-2">{vehicle.title}</h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {vehicle.odometer && <Badge variant="outline">{vehicle.odometer}</Badge>}
                      {vehicle.transmission && <Badge variant="outline">{vehicle.transmission}</Badge>}
                      {vehicle.fuel && <Badge variant="outline">{vehicle.fuel}</Badge>}
                    </div>
                    {vehicle.price && (
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Auction</p>
                          <p className="font-medium">{formatCurrency(vehicle.price)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Est. retail</p>
                          <p className="font-medium">{formatCurrency(estimatedRetail)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Potential</p>
                          <p className="font-medium text-primary">+{formatCurrency(potentialProfit)}</p>
                        </div>
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-border">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => addToStock(index, vehicle)}
                        disabled={added[index] || adding[index]}
                      >
                        {adding[index] ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding…</>
                        ) : added[index] ? (
                          <><Check className="w-4 h-4 mr-2" />Added to stock</>
                        ) : (
                          <><Plus className="w-4 h-4 mr-2" />Add to Stock</>
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
