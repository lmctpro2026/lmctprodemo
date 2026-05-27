"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2, Bot, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Message {
  role: "user" | "assistant"
  content: string
}

const MEMORY_KEY = "lmct_ai_convo"
const MEMORY_MAX = 20

const SUGGESTED = [
  "What's my profit this month?",
  "Which cars should I reprice?",
  "What should I buy next?",
  "Which car made me the most money?",
  "Find aged stock 60+ days",
]

function loadMemory(): Message[] | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(MEMORY_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed.filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string").slice(-MEMORY_MAX)
  } catch {
    return null
  }
}

function saveMemory(messages: Message[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(MEMORY_KEY, JSON.stringify(messages.slice(-MEMORY_MAX)))
  } catch {
    // localStorage may be unavailable (private mode, quota); silently skip.
  }
}

export default function AssistantPage() {
  const [aiName, setAiName] = useState("MAX")
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [hydrated, setHydrated] = useState(false)

  // On mount: rehydrate conversation from localStorage, fetch ai_name.
  useEffect(() => {
    const remembered = loadMemory()
    if (remembered && remembered.length > 0) {
      setMessages(remembered)
    }
    setHydrated(true)

    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from("profiles")
        .select("ai_name")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          const name = (data as { ai_name?: string | null } | null)?.ai_name?.trim()
          if (name) setAiName(name)
        })
    })
  }, [])

  // Seed greeting once hydration + name are settled and no prior messages exist.
  useEffect(() => {
    if (!hydrated) return
    if (messages.length > 0) return
    setMessages([
      {
        role: "assistant",
        content: `Hey, I'm ${aiName}. Ask me anything about your stock, your sales, or what to do next.`,
      },
    ])
  }, [hydrated, aiName, messages.length])

  // Persist to localStorage on every change after hydration.
  useEffect(() => {
    if (!hydrated) return
    saveMemory(messages)
  }, [messages, hydrated])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  async function send(userMessage: string) {
    if (!userMessage.trim() || loading) return
    const next: Message[] = [...messages, { role: "user", content: userMessage.trim() }]
    setMessages(next)
    setLoading(true)
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      })
      const data = await response.json()
      if (!response.ok) {
        const detail = typeof data?.error === "string" ? data.error : "Failed to get response"
        setMessages((prev) => [...prev, { role: "assistant", content: detail }])
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.content }])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network error reaching the AI service. Try again." },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const v = input
    setInput("")
    send(v)
  }

  function clearConversation() {
    setMessages([
      {
        role: "assistant",
        content: `Hey, I'm ${aiName}. Ask me anything about your stock, your sales, or what to do next.`,
      },
    ])
    if (typeof window !== "undefined") window.localStorage.removeItem(MEMORY_KEY)
  }

  // Show suggested chips only when the conversation is just the greeting.
  const showSuggestions = messages.length <= 1

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <style>{`
        @keyframes lmctTypingDot {
          0%, 60%, 100% { opacity: 0.25; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{aiName}</h1>
          <p className="text-muted-foreground">Your dealership assistant — knows your stock, your sales, your numbers</p>
        </div>
        {messages.length > 1 && (
          <Button type="button" variant="ghost" size="sm" onClick={clearConversation}>
            Clear conversation
          </Button>
        )}
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            {aiName}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === "user" ? "bg-primary" : "bg-muted"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="h-4 w-4 text-primary-foreground" />
                  ) : (
                    <Bot className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div
                  className={`rounded-lg p-3 max-w-[80%] ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="bg-muted rounded-lg p-3 flex items-center gap-1">
                  <Dot delay={0} />
                  <Dot delay={150} />
                  <Dot delay={300} />
                </div>
              </div>
            )}
            {showSuggestions && (
              <div className="flex flex-wrap gap-2 pt-2">
                {SUGGESTED.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    disabled={loading}
                    className="text-xs rounded-full border border-border bg-background hover:bg-muted px-3 py-1.5 transition-colors disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>

        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${aiName} anything…`}
              className="min-h-[60px] max-h-[120px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
            <Button type="submit" disabled={loading || !input.trim()} size="icon" className="h-[60px] w-[60px]">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/60"
      style={{
        animation: "lmctTypingDot 1.2s ease-in-out infinite",
        animationDelay: `${delay}ms`,
      }}
    />
  )
}
