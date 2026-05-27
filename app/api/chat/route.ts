import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { tools, executeTool } from "@/lib/ai/tools"
import { buildSystemPrompt } from "@/lib/ai/system-prompt"
import type { Profile, Vehicle, Sale } from "@/lib/types"

const MODEL = "claude-haiku-4-5"
const MAX_TOOL_ROUNDTRIPS = 4
const MAX_TOKENS = 1024

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "AI is not configured yet. Drop ANTHROPIC_API_KEY into .env.local and reload.",
      },
      { status: 503 }
    )
  }

  let payload: { messages?: ChatMessage[] }
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const incoming = Array.isArray(payload.messages) ? payload.messages : []
  if (!incoming.length) {
    return NextResponse.json({ error: "messages required" }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  }

  // Pull dealer context for the prompt-cached system block. Market intel is
  // best-effort — table may not exist yet (006 SQL not applied), in which
  // case we just skip the section.
  const [{ data: profile }, { data: stock }, { data: recent }, { data: intel }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("vehicles")
      .select("make, model, year, rego, price, status, acquisition_date")
      .eq("user_id", user.id)
      .order("acquisition_date", { ascending: false })
      .limit(50),
    supabase
      .from("sales")
      .select("make, model, year, sale_price, profit, margin, sale_date")
      .eq("user_id", user.id)
      .eq("status", "Completed")
      .gte(
        "sale_date",
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0]
      )
      .order("sale_date", { ascending: false }),
    supabase
      .from("market_intelligence_cache")
      .select("*")
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const systemText = buildSystemPrompt({
    profile: (profile as Profile | null) ?? null,
    stockSnapshot: (stock as Vehicle[] | null) ?? [],
    recentSales: (recent as Sale[] | null) ?? [],
    marketIntel: (intel as Parameters<typeof buildSystemPrompt>[0]["marketIntel"]) ?? null,
  })

  const client = new Anthropic({ apiKey })

  // Build the conversation. The Anthropic SDK accepts user/assistant text
  // messages directly; we don't carry tool_use/tool_result blocks across
  // requests — each request rebuilds the tool loop from scratch using the
  // textual transcript. This is cheaper to reason about and avoids losing
  // tool state if the user reloads. Persisted history is text-only too.
  const conversation: Anthropic.Messages.MessageParam[] = incoming.map((m) => ({
    role: m.role,
    content: m.content,
  }))

  try {
    let lastText = ""
    for (let round = 0; round < MAX_TOOL_ROUNDTRIPS; round++) {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: [
          {
            type: "text",
            text: systemText,
            cache_control: { type: "ephemeral" },
          },
        ],
        tools: tools as unknown as Anthropic.Messages.Tool[],
        messages: conversation,
      })

      // Collect any text and any tool_use blocks from the response.
      const toolUses: Anthropic.Messages.ToolUseBlock[] = []
      const textParts: string[] = []
      for (const block of response.content) {
        if (block.type === "text") textParts.push(block.text)
        else if (block.type === "tool_use") toolUses.push(block)
      }
      if (textParts.length) lastText = textParts.join("\n").trim()

      if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
        break
      }

      // Execute the tools server-side under the dealer's auth, then push the
      // assistant turn + tool_result turn back into the conversation and loop.
      conversation.push({ role: "assistant", content: response.content })
      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = []
      for (const tu of toolUses) {
        const out = await executeTool(
          tu.name,
          (tu.input as Record<string, unknown>) ?? {},
          supabase,
          user.id
        )
        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: JSON.stringify(out),
        })
      }
      conversation.push({ role: "user", content: toolResults })
    }

    if (!lastText) {
      lastText =
        "I had a think but didn't have anything useful to say. Could you rephrase?"
    }

    // Persist user message + assistant reply to chat_history (best-effort).
    const lastUser = incoming[incoming.length - 1]
    if (lastUser?.role === "user") {
      await supabase.from("chat_history").insert([
        { user_id: user.id, role: "user", content: lastUser.content },
        { user_id: user.id, role: "assistant", content: lastText },
      ])
    }

    return NextResponse.json({ content: lastText })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown AI error"
    return NextResponse.json(
      { error: `AI error: ${message}` },
      { status: 500 }
    )
  }
}
