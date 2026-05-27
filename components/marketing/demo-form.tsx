"use client"

import { useState } from "react"
import { toast } from "sonner"

interface Field {
  name: string
  label: string
  type?: "text" | "tel" | "email" | "textarea"
  placeholder?: string
  required?: boolean
  half?: boolean
}

const fields: Field[] = [
  { name: "dealer_name",    label: "Dealership name",    placeholder: "Westside Motors",         required: true,  half: true },
  { name: "your_name",      label: "Your name",          placeholder: "Sam Cohen",               required: true,  half: true },
  { name: "phone",          label: "Mobile",             placeholder: "0413 552 081",            required: true,  half: true, type: "tel"   },
  { name: "email",          label: "Email",              placeholder: "sam@westsidemotors.com.au", required: true, half: true, type: "email" },
  { name: "lmct",           label: "LMCT number (optional)", placeholder: "LMCT 12345",          half: true },
  { name: "suburb",         label: "Suburb",             placeholder: "Geelong",                 required: true, half: true },
  { name: "current_setup",  label: "How do you run your stock today?",
    placeholder: "Spreadsheet, EasyCars, on paper — anything is fine. Tell us where you are.",
    type: "textarea", required: true },
]

export function DemoForm() {
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (sending) return
    setSending(true)

    const form = e.currentTarget
    const data: Record<string, string> = {}
    for (const f of fields) {
      const el = form.elements.namedItem(f.name)
      if (el && "value" in el) data[f.name] = String(el.value).trim()
    }

    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body?.error || "Couldn't book your demo. Try again, or email hello@lmctpro.com.au.")
        setSending(false)
        return
      }
      setDone(true)
    } catch {
      toast.error("Network error. Try again, or email hello@lmctpro.com.au.")
      setSending(false)
    }
  }

  if (done) {
    return (
      <div className="df-done">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4 12 14.01l-3-3" />
        </svg>
        <h2 className="df-done-title">You&rsquo;re in.</h2>
        <p className="df-done-body">
          We&rsquo;ll be in touch inside a business day to set a time that suits.
          Most demos run for 15 minutes on a screenshare with your stock open.
        </p>
        <p className="df-done-foot">If it&rsquo;s urgent, ring us on <span className="df-mono">0405 050 050</span>.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="df-form" noValidate>
      <div className="df-grid">
        {fields.map((f) => {
          const isFull = !f.half || f.type === "textarea"
          return (
            <div key={f.name} className={`df-row ${isFull ? "is-full" : ""}`}>
              <label htmlFor={f.name} className="df-label">{f.label}{f.required && <span aria-hidden="true" className="df-req">*</span>}</label>
              {f.type === "textarea" ? (
                <textarea
                  id={f.name}
                  name={f.name}
                  required={f.required}
                  placeholder={f.placeholder}
                  rows={4}
                  className="df-input df-textarea"
                />
              ) : (
                <input
                  id={f.name}
                  name={f.name}
                  type={f.type || "text"}
                  required={f.required}
                  placeholder={f.placeholder}
                  className="df-input"
                  autoComplete={
                    f.type === "email" ? "email" :
                    f.type === "tel"   ? "tel"   :
                    f.name === "your_name" ? "name" :
                    "off"
                  }
                />
              )}
            </div>
          )
        })}
      </div>
      <button type="submit" disabled={sending} className="df-submit">
        {sending ? "Sending…" : "Book my demo"}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14" /><path d="M13 5l7 7-7 7" />
        </svg>
      </button>
      <p className="df-fineprint">No sales pitch. We screenshare, walk through your live stock, answer your questions, and leave you with a trial account.</p>
    </form>
  )
}
