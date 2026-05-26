"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const AUS_STATES = ["VIC","NSW","QLD","SA","WA","TAS","NT","ACT"]

export default function SignUpPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    dealership_name: "",
    lmct_number: "",
    abn: "",
    state: "",
    suburb: "",
    phone: "",
    email: "",
    password: "",
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (step === 1) { setStep(2); return }
    setLoading(true)
    setError("")
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        // Keys here must match what the on_auth_user_created trigger reads
        // (scripts/001_create_schema.sql:196) — currently only `dealer_name`
        // is copied into profiles. The other fields stay in user_metadata
        // for now; backfill to profiles via Settings on first login, or add
        // them to the trigger in a follow-up migration.
        data: {
          dealer_name: form.dealership_name,
          lmct: form.lmct_number,
          abn: form.abn,
          state: form.state,
          suburb: form.suburb,
          phone: form.phone,
        }
      }
    })
    if (error) { setError(error.message); setLoading(false); return }
    router.push("/dashboard")
  }

  return (
    <div style={{ minHeight:"100vh", background:"#07090F", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px", position:"relative", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        .ff{font-family:'Fraunces',serif}
        .fj{font-family:'Plus Jakarta Sans',sans-serif}
        @keyframes orb1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(30px,-20px) scale(1.1)}}
        @keyframes orb2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-20px,30px) scale(0.95)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .inp{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:12px 16px;font-size:14px;color:#F1F0FF;font-family:'Plus Jakarta Sans',sans-serif;outline:none;transition:all 0.2s}
        .inp:focus{border-color:rgba(232,160,32,0.5);background:rgba(255,255,255,0.06);box-shadow:0 0 0 3px rgba(232,160,32,0.08)}
        .inp::placeholder{color:rgba(255,255,255,0.2)}
        select.inp option{background:#0D1421;color:#F1F0FF}
        .label{font-size:11px;font-weight:600;color:rgba(255,255,255,0.4);letter-spacing:0.8px;text-transform:uppercase;margin-bottom:6px;font-family:'Plus Jakarta Sans',sans-serif}
        .field{display:flex;flex-direction:column;gap:0}
        .btn{width:100%;padding:14px;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;border:none;font-family:'Plus Jakarta Sans',sans-serif;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:8px}
        .btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 12px 40px rgba(232,160,32,0.3)}
        .btn:disabled{opacity:0.6;cursor:not-allowed}
        .card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:10px 14px;display:flex;align-items:center;gap:10px}
        .step-dot{width:8px;height:8px;border-radius:50%;transition:all 0.3s}
        .grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
      `}</style>

      {/* Background orbs */}
      <div style={{ position:"absolute",width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(232,160,32,0.06),transparent 65%)",top:-200,right:-100,animation:"orb1 8s ease-in-out infinite",pointerEvents:"none" }}></div>
      <div style={{ position:"absolute",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,0.08),transparent 65%)",bottom:-150,left:-100,animation:"orb2 10s ease-in-out infinite",pointerEvents:"none" }}></div>

      {/* Grid pattern */}
      <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)",backgroundSize:"60px 60px",pointerEvents:"none" }}></div>

      <div style={{ width:"100%",maxWidth:480,position:"relative",zIndex:1,animation:"fadeUp 0.5s ease" }}>

        {/* Logo */}
        <div style={{ textAlign:"center",marginBottom:32 }}>
          <Link href="/" style={{ textDecoration:"none" }}>
            <span className="ff" style={{ fontSize:28,fontWeight:900,color:"#F1F0FF" }}>
              LMCT<span style={{ color:"#E8A020" }}>PRO</span>
            </span>
          </Link>
          <div style={{ fontSize:13,color:"rgba(255,255,255,0.3)",marginTop:6,fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
            Dealer Management System
          </div>
        </div>

        {/* Card */}
        <div style={{
          background:"rgba(255,255,255,0.03)",
          border:"1px solid rgba(255,255,255,0.08)",
          borderRadius:20,
          padding:"32px 28px",
          backdropFilter:"blur(20px)",
          boxShadow:"0 40px 120px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}>

          {/* Step indicator */}
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28 }}>
            <div>
              <div className="ff" style={{ fontSize:22,fontWeight:700,color:"#F1F0FF",letterSpacing:"-0.5px" }}>
                {step === 1 ? "Your dealership" : "Your account"}
              </div>
              <div style={{ fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:3,fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                {step === 1 ? "Step 1 of 2 — Business details" : "Step 2 of 2 — Login credentials"}
              </div>
            </div>
            <div style={{ display:"flex",gap:6 }}>
              <div className="step-dot" style={{ background:step >= 1 ? "#E8A020" : "rgba(255,255,255,0.1)",width:step===1?24:8 }}></div>
              <div className="step-dot" style={{ background:step >= 2 ? "#E8A020" : "rgba(255,255,255,0.1)",width:step===2?24:8 }}></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display:"flex",flexDirection:"column",gap:16 }}>

            {step === 1 && (
              <>
                <div className="field">
                  <div className="label">Dealership name</div>
                  <input className="inp" placeholder="e.g. MDMR Motors Pty Ltd" value={form.dealership_name} onChange={e => set("dealership_name",e.target.value)} required />
                </div>

                <div className="grid2">
                  <div className="field">
                    <div className="label">LMCT number</div>
                    <input className="inp" placeholder="LMCT 12345" value={form.lmct_number} onChange={e => set("lmct_number",e.target.value)} required />
                  </div>
                  <div className="field">
                    <div className="label">ABN</div>
                    <input className="inp" placeholder="12 345 678 901" value={form.abn} onChange={e => set("abn",e.target.value)} />
                  </div>
                </div>

                <div className="grid2">
                  <div className="field">
                    <div className="label">State</div>
                    <select className="inp" value={form.state} onChange={e => set("state",e.target.value)} required>
                      <option value="">Select state</option>
                      {AUS_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <div className="label">Suburb</div>
                    <input className="inp" placeholder="e.g. Dandenong" value={form.suburb} onChange={e => set("suburb",e.target.value)} required />
                  </div>
                </div>

                <div className="field">
                  <div className="label">Phone</div>
                  <input className="inp" type="tel" placeholder="0400 000 000" value={form.phone} onChange={e => set("phone",e.target.value)} required />
                </div>

                {/* Trust badges */}
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:4 }}>
                  {[
                    { icon:"🔒", text:"Bank-level security" },
                    { icon:"✓",  text:"LMCT compliant" },
                  ].map(b => (
                    <div key={b.text} className="card">
                      <span style={{ fontSize:14 }}>{b.icon}</span>
                      <span style={{ fontSize:11,color:"rgba(255,255,255,0.4)",fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{b.text}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="field">
                  <div className="label">Email address</div>
                  <input className="inp" type="email" placeholder="you@yourdealership.com.au" value={form.email} onChange={e => set("email",e.target.value)} required />
                </div>

                <div className="field">
                  <div className="label">Password</div>
                  <input className="inp" type="password" placeholder="Create a strong password" value={form.password} onChange={e => set("password",e.target.value)} required minLength={6} />
                  <div style={{ fontSize:11,color:"rgba(255,255,255,0.2)",marginTop:5,fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    Minimum 6 characters
                  </div>
                </div>

                {/* Account summary */}
                <div style={{ background:"rgba(232,160,32,0.06)",border:"1px solid rgba(232,160,32,0.15)",borderRadius:10,padding:"12px 14px" }}>
                  <div style={{ fontSize:11,color:"#E8A020",fontWeight:600,letterSpacing:"0.5px",marginBottom:8,fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    ACCOUNT SUMMARY
                  </div>
                  <div style={{ fontSize:12,color:"rgba(255,255,255,0.5)",fontFamily:"'Plus Jakarta Sans',sans-serif",lineHeight:1.8 }}>
                    {form.dealership_name && <div>{form.dealership_name}</div>}
                    {form.lmct_number && <div>LMCT {form.lmct_number}</div>}
                    {form.suburb && form.state && <div>{form.suburb}, {form.state}</div>}
                  </div>
                </div>
              </>
            )}

            {error && (
              <div style={{ background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#EF4444",fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                {error}
              </div>
            )}

            <button className="btn" type="submit" disabled={loading} style={{ background:"linear-gradient(135deg,#E8A020,#C8850A)",color:"#0D1F3C",marginTop:4 }}>
              {loading ? (
                <div style={{ width:18,height:18,border:"2px solid rgba(13,31,60,0.3)",borderTopColor:"#0D1F3C",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}></div>
              ) : step === 1 ? (
                <><span>Continue</span><span>→</span></>
              ) : (
                <><span>Create My Account</span><span>→</span></>
              )}
            </button>

            {step === 2 && (
              <button type="button" onClick={() => setStep(1)} style={{ background:"transparent",color:"rgba(255,255,255,0.3)",border:"none",fontSize:13,cursor:"pointer",fontFamily:"'Plus Jakarta Sans',sans-serif",padding:"4px 0" }}>
                ← Back to dealership details
              </button>
            )}
          </form>
        </div>

        {/* Footer */}
        <div style={{ textAlign:"center",marginTop:20,fontSize:12,color:"rgba(255,255,255,0.25)",fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
          Already have an account?{" "}
          <Link href="/auth/login" style={{ color:"#E8A020",textDecoration:"none",fontWeight:600 }}>Sign in</Link>
          <div style={{ marginTop:8 }}>
            By signing up you agree to our{" "}
            <span style={{ color:"rgba(255,255,255,0.4)" }}>Terms of Service</span>
          </div>
        </div>
      </div>
    </div>
  )
}