"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

/* ─────────────────────────────────────────────────────────────────────
   LMCT PRO — landing page.
   Single self-contained file. One <style> block. No utility classes,
   no helper components imported. IntersectionObserver for reveals.
   Hero 55/45 with ambient gold glow + boundary-breaking badges.
   Diagonal clip-path transitions between cream + ink sections.
   Auto-cycling product showcase. Bento grid. Dark MAX moment.
   Staggered testimonials with ghost quote-mark containers.
   ───────────────────────────────────────────────────────────────────── */

const TABS = [
  { key: "stock",  label: "Live stock"      },
  { key: "add",    label: "Add a vehicle"   },
  { key: "form",   label: "Compliance form" },
  { key: "max",    label: "Ask MAX"         },
] as const

type TabKey = (typeof TABS)[number]["key"]

export default function HomePage() {
  const [tab, setTab] = useState<TabKey>("stock")
  const [paused, setPaused] = useState(false)

  // Auto-cycle the showcase. 3 seconds per tab, pauses on user override.
  useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => {
      setTab((cur) => {
        const i = TABS.findIndex((t) => t.key === cur)
        return TABS[(i + 1) % TABS.length].key
      })
    }, 3000)
    return () => window.clearInterval(id)
  }, [paused])

  // IntersectionObserver — anything with .lp-reveal animates in once visible.
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible")
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -60px 0px" }
    )
    document.querySelectorAll(".lp-reveal").forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  function pick(k: TabKey) {
    setPaused(true)
    setTab(k)
  }

  return (
    <div>
      <style>{`
        :root {
          --ink:        #0d1117;
          --ink-2:      #1d2533;
          --ink-muted:  #5a6478;
          --ink-faint:  #9aa3ae;
          --cream:      #f5f0e8;
          --cream-2:    #ece4d2;
          --cream-3:    #ffffff;
          --gold:       #c8a96e;
          --gold-soft:  rgba(200, 169, 110, 0.14);
          --green-rev:  #4ade80;
          --amber:      #f5a623;
          --rule:       rgba(13, 17, 23, 0.08);
          --rule-2:     rgba(13, 17, 23, 0.16);
          --shadow-sm:  0 2px 12px rgba(13, 17, 23, 0.07);
          --shadow-md:  0 12px 36px -12px rgba(13, 17, 23, 0.18);
          --shadow-lg:  0 40px 80px -20px rgba(13, 17, 23, 0.35);
          --ease:       cubic-bezier(.2, .8, .3, 1);
        }

        * { box-sizing: border-box; }
        html, body { background: var(--cream); }

        .lp {
          background: var(--cream);
          color: var(--ink);
          font-family: var(--font-jakarta), -apple-system, system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
          font-feature-settings: "ss01", "cv01";
          line-height: 1.5;
        }
        .lp-serif { font-family: var(--font-fraunces), Georgia, serif; }
        .lp-mono  { font-family: var(--font-dm-mono),  ui-monospace, monospace; }

        /* Reveal-on-scroll */
        .lp-reveal {
          opacity: 0;
          transform: translateY(18px);
          transition: opacity 800ms var(--ease), transform 800ms var(--ease);
        }
        .lp-reveal.is-visible { opacity: 1; transform: none; }

        /* ─── Nav ────────────────────────────────────────────────────── */
        .lp-nav {
          position: sticky; top: 0; z-index: 50;
          background: rgba(245, 240, 232, 0.78);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--rule);
        }
        .lp-nav-row {
          max-width: 1240px; margin: 0 auto;
          height: 64px; padding: 0 28px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .lp-brand {
          display: inline-flex; align-items: center; gap: 10px;
          color: var(--ink); text-decoration: none;
        }
        .lp-mark {
          width: 30px; height: 30px;
          border-radius: 8px;
          background: var(--ink);
          display: inline-flex; align-items: center; justify-content: center;
        }
        .lp-brand-name {
          font-family: var(--font-fraunces), Georgia, serif;
          font-weight: 700; font-size: 18px; letter-spacing: -0.012em;
        }
        .lp-nav-links { display: none; gap: 28px; }
        @media (min-width: 860px) { .lp-nav-links { display: flex; } }
        .lp-nav-link {
          color: var(--ink-muted);
          font-size: 14px; font-weight: 500;
          text-decoration: none;
          transition: color 200ms var(--ease);
        }
        .lp-nav-link:hover { color: var(--ink); }
        .lp-nav-cta { display: flex; align-items: center; gap: 14px; }

        .lp-btn-primary {
          background: var(--ink);
          color: var(--cream);
          padding: 10px 18px;
          border-radius: 999px;
          font-weight: 600; font-size: 14px;
          text-decoration: none;
          display: inline-flex; align-items: center; gap: 6px;
          transition: transform 200ms var(--ease), box-shadow 200ms var(--ease);
          border: 0;
          cursor: pointer;
        }
        .lp-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 30px -10px rgba(13, 17, 23, 0.45);
        }
        .lp-btn-ghost {
          color: var(--ink-muted);
          font-weight: 600; font-size: 14px;
          background: transparent;
          padding: 10px 0;
          text-decoration: none;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .lp-btn-ghost:hover { color: var(--ink); }
        .lp-btn-cream-on-dark {
          background: var(--cream);
          color: var(--ink);
          padding: 14px 24px;
          border-radius: 999px;
          font-weight: 600; font-size: 15px;
          text-decoration: none;
          display: inline-flex; align-items: center; gap: 8px;
          transition: transform 200ms var(--ease);
        }
        .lp-btn-cream-on-dark:hover { transform: translateY(-1px); }
        .lp-btn-green-outline {
          color: var(--green-rev);
          border: 1px solid rgba(74, 222, 128, 0.45);
          padding: 14px 24px;
          border-radius: 999px;
          font-weight: 600; font-size: 15px;
          text-decoration: none;
          background: transparent;
          display: inline-flex; align-items: center; gap: 8px;
          transition: background 200ms var(--ease), border-color 200ms var(--ease);
        }
        .lp-btn-green-outline:hover {
          background: rgba(74, 222, 128, 0.08);
          border-color: var(--green-rev);
        }

        /* ─── HERO ────────────────────────────────────────────────────── */
        .lp-hero {
          position: relative;
          background: var(--cream);
          background-image: radial-gradient(rgba(13, 17, 23, 0.06) 1px, transparent 1px);
          background-size: 24px 24px;
          padding: 80px 0 160px;
          overflow: hidden;
          clip-path: polygon(0 0, 100% 0, 100% calc(100% - 70px), 0 100%);
        }
        .lp-hero-inner {
          position: relative; z-index: 2;
          max-width: 1240px; margin: 0 auto;
          padding: 0 28px;
          display: grid;
          grid-template-columns: 55fr 45fr;
          gap: 64px;
          align-items: center;
        }
        @media (max-width: 960px) {
          .lp-hero-inner { grid-template-columns: 1fr; gap: 56px; }
          .lp-hero { padding: 56px 0 120px; }
        }

        /* Hero ambient blob — soft organic gold splash top-right */
        .lp-hero-blob {
          position: absolute;
          top: -200px; right: -180px;
          width: 720px; height: 720px;
          pointer-events: none;
          opacity: 0.65;
          z-index: 1;
        }

        .lp-eyebrow {
          font-family: var(--font-dm-mono), ui-monospace, monospace;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--gold);
          margin: 0 0 22px;
        }
        .lp-h1 {
          font-family: var(--font-fraunces), Georgia, serif;
          font-weight: 900;
          font-size: clamp(44px, 7vw, 72px);
          line-height: 1.0;
          letter-spacing: -0.028em;
          color: var(--ink);
          margin: 0;
        }
        .lp-h1 em {
          font-style: italic;
          font-weight: 400;
          color: var(--gold);
        }
        .lp-sub {
          margin: 24px 0 36px;
          font-size: 17px;
          line-height: 1.55;
          color: var(--ink-muted);
          max-width: 50ch;
        }
        .lp-cta-row {
          display: flex; flex-wrap: wrap; align-items: center; gap: 18px;
        }
        .lp-trust {
          margin: 22px 0 0;
          font-family: var(--font-dm-mono), monospace;
          font-size: 11px;
          letter-spacing: 0.05em;
          color: var(--ink-faint);
        }

        /* Hero right — the dashboard card moment */
        .lp-hero-stage {
          position: relative;
          height: 460px;
        }
        @media (max-width: 960px) { .lp-hero-stage { height: 420px; } }
        .lp-hero-glow {
          position: absolute;
          top: 50%; left: 50%;
          width: 540px; height: 360px;
          transform: translate(-50%, -45%);
          background: radial-gradient(ellipse, rgba(200, 169, 110, 0.32) 0%, transparent 70%);
          filter: blur(60px);
          z-index: 0;
          pointer-events: none;
        }
        .lp-hero-card {
          position: relative; z-index: 2;
          background: var(--ink);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
          box-shadow: var(--shadow-lg);
          transform: perspective(1200px) rotateY(-8deg) rotateX(4deg);
          transform-style: preserve-3d;
          overflow: hidden;
          width: 100%;
          transition: transform 700ms var(--ease);
        }
        .lp-hero-card:hover { transform: perspective(1200px) rotateY(-4deg) rotateX(2deg); }

        /* Card chrome */
        .lp-hero-chrome {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .lp-hero-dots { display: flex; gap: 5px; }
        .lp-hero-dots span {
          width: 7px; height: 7px; border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
        }
        .lp-hero-url {
          font-family: var(--font-dm-mono), monospace;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.4);
          letter-spacing: 0.06em;
        }
        .lp-hero-max {
          font-family: var(--font-dm-mono), monospace;
          font-size: 10px;
          color: var(--green-rev);
          letter-spacing: 0.12em;
          display: inline-flex; align-items: center; gap: 5px;
        }
        .lp-pulse {
          width: 5px; height: 5px; border-radius: 999px;
          background: var(--green-rev);
          box-shadow: 0 0 8px var(--green-rev);
          animation: lp-pulse 2s ease-in-out infinite;
        }
        @keyframes lp-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }

        /* Card body — stock table */
        .lp-hero-body { padding: 18px; }
        .lp-hero-tile {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 14px;
        }
        .lp-tile {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 8px;
          padding: 10px;
        }
        .lp-tile-label {
          font-family: var(--font-dm-mono), monospace;
          font-size: 8px;
          color: rgba(255, 255, 255, 0.4);
          letter-spacing: 0.1em;
        }
        .lp-tile-val {
          font-family: var(--font-dm-mono), monospace;
          font-size: 15px;
          font-weight: 500;
          color: #f1f0ff;
          margin-top: 4px;
          line-height: 1;
        }
        .lp-tile-val.is-money { color: var(--green-rev); }

        .lp-hero-table {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 8px;
          overflow: hidden;
        }
        .lp-hero-row {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .lp-hero-row:last-child { border-bottom: 0; }
        .lp-hero-rego {
          font-family: var(--font-dm-mono), monospace;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.4);
          width: 56px;
        }
        .lp-hero-car {
          font-size: 12px;
          color: #f1f0ff;
          flex: 1;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .lp-hero-days {
          font-family: var(--font-dm-mono), monospace;
          font-size: 11px;
          width: 30px;
          text-align: right;
        }
        .lp-hero-price {
          font-family: var(--font-dm-mono), monospace;
          font-size: 12px;
          color: #f1f0ff;
          font-weight: 500;
          width: 64px;
          text-align: right;
        }
        .lp-c-green  { color: var(--green-rev); }
        .lp-c-amber  { color: #fbbf24; }
        .lp-c-red    { color: #fca5a5; }

        /* Floating badges — break the card boundary */
        .lp-badge {
          position: absolute;
          z-index: 3;
          background: rgba(245, 240, 232, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 999px;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 600;
          color: var(--ink);
          display: inline-flex; align-items: center; gap: 8px;
          box-shadow: var(--shadow-md);
          transform: rotate(-2deg);
        }
        .lp-badge-2 { transform: rotate(3deg); }
        .lp-badge-dot {
          width: 7px; height: 7px; border-radius: 999px;
        }

        /* ─── DARK FLIP — Section: The platform on stage ──────────────── */
        .lp-stage {
          position: relative;
          background: var(--ink);
          padding: 96px 0 96px;
          margin-top: -70px;
          color: #f1f0ff;
          overflow: hidden;
        }
        .lp-stage-bg {
          position: absolute; inset: 0;
          background-image:
            radial-gradient(ellipse 90% 60% at 50% 0%, rgba(200, 169, 110, 0.10) 0%, transparent 60%),
            radial-gradient(circle at 12% 30%, rgba(74, 222, 128, 0.04), transparent 45%);
          pointer-events: none;
        }
        .lp-stage-inner {
          position: relative;
          max-width: 920px; margin: 0 auto;
          padding: 0 28px;
          text-align: center;
        }
        .lp-stage-eyebrow {
          font-family: var(--font-dm-mono), monospace;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--gold);
          margin: 0 0 16px;
        }
        .lp-h2 {
          font-family: var(--font-fraunces), Georgia, serif;
          font-weight: 700;
          font-size: clamp(32px, 4.5vw, 46px);
          line-height: 1.02;
          letter-spacing: -0.022em;
          color: #f1f0ff;
          margin: 0;
        }
        .lp-h2 em {
          font-style: italic;
          font-weight: 400;
          color: var(--gold);
        }
        .lp-stage-sub {
          margin: 18px auto 0;
          max-width: 56ch;
          font-size: 16px;
          color: rgba(241, 240, 255, 0.65);
        }

        /* Tab pills */
        .lp-tabs {
          display: flex; flex-wrap: wrap; justify-content: center;
          gap: 10px;
          margin: 36px 0 28px;
        }
        .lp-tab {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.7);
          padding: 9px 16px;
          border-radius: 999px;
          font-size: 13px; font-weight: 500;
          font-family: var(--font-jakarta), sans-serif;
          border: 1px solid transparent;
          cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px;
          transition: all 220ms var(--ease);
        }
        .lp-tab:hover { color: #f1f0ff; }
        .lp-tab.is-active {
          background: rgba(200, 169, 110, 0.15);
          border-color: rgba(200, 169, 110, 0.45);
          color: var(--gold);
        }
        .lp-tab-dot {
          width: 5px; height: 5px; border-radius: 999px;
          background: currentColor;
          opacity: 0.5;
        }
        .lp-tab.is-active .lp-tab-dot {
          background: var(--green-rev);
          opacity: 1;
          box-shadow: 0 0 8px var(--green-rev);
        }

        /* Stage screenshot */
        .lp-stage-screen {
          position: relative;
          min-height: 380px;
          margin: 0 auto;
          max-width: 880px;
          background: linear-gradient(180deg, #161a23 0%, #0d1117 100%);
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }
        .lp-stage-screen-pad { padding: 28px; min-height: 380px; }
        .lp-stage-pane {
          position: absolute; inset: 28px;
          opacity: 0; transition: opacity 360ms var(--ease);
          pointer-events: none;
        }
        .lp-stage-pane.is-active { opacity: 1; pointer-events: auto; }

        /* Pane: stock */
        .lp-stock-kpis {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 10px; margin-bottom: 18px;
        }
        .lp-stock-rows {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          overflow: hidden;
        }
        .lp-stock-row {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .lp-stock-row:last-child { border-bottom: 0; }
        .lp-stock-row-stock {
          font-family: var(--font-dm-mono), monospace;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          width: 56px;
        }
        .lp-stock-row-car {
          font-size: 13px;
          color: #f1f0ff;
          flex: 1;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          text-align: left;
        }
        .lp-stock-row-body, .lp-stock-row-days, .lp-stock-row-price {
          font-family: var(--font-dm-mono), monospace;
          font-size: 12px;
        }
        .lp-stock-row-body { width: 48px; color: rgba(255, 255, 255, 0.4); }
        .lp-stock-row-days { width: 36px; text-align: right; }
        .lp-stock-row-price { width: 80px; text-align: right; color: #f1f0ff; font-weight: 500; }

        /* Pane: add vehicle */
        .lp-add-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .lp-add-field {
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          padding: 10px 12px;
          opacity: 0; transform: translateY(8px);
          text-align: left;
        }
        .lp-stage-pane.is-active.lp-pane-add .lp-add-field {
          animation: lp-fade-up 0.5s var(--ease) forwards;
        }
        @keyframes lp-fade-up { to { opacity: 1; transform: none; } }
        .lp-add-label {
          display: block;
          font-family: var(--font-dm-mono), monospace;
          font-size: 9px;
          color: rgba(255, 255, 255, 0.4);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .lp-add-val {
          display: block;
          font-size: 13px;
          color: #f1f0ff;
          font-weight: 500;
        }
        .lp-add-done {
          margin-top: 14px;
          display: inline-flex; align-items: center; gap: 10px;
          padding: 10px 14px;
          background: rgba(74, 222, 128, 0.10);
          border: 1px solid rgba(74, 222, 128, 0.30);
          border-radius: 10px;
          color: var(--green-rev);
          font-size: 13px; font-weight: 500;
          opacity: 0;
        }
        .lp-stage-pane.is-active.lp-pane-add .lp-add-done {
          animation: lp-fade-up 0.6s var(--ease) 3.4s forwards;
        }

        /* Pane: compliance */
        .lp-form-head {
          display: flex; flex-direction: column; gap: 6px;
          margin-bottom: 18px; text-align: left;
        }
        .lp-form-kicker {
          font-family: var(--font-dm-mono), monospace;
          font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--gold);
        }
        .lp-form-title {
          font-family: var(--font-fraunces), Georgia, serif;
          font-size: 22px; font-weight: 700; color: #f1f0ff;
        }
        .lp-form-meta {
          font-family: var(--font-dm-mono), monospace;
          font-size: 11px; color: rgba(255, 255, 255, 0.4);
        }
        .lp-form-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
          text-align: left;
        }
        .lp-formrow {
          opacity: 0; transform: translateY(6px);
        }
        .lp-stage-pane.is-active.lp-pane-form .lp-formrow {
          animation: lp-fade-up 0.5s var(--ease) forwards;
        }
        .lp-form-k {
          display: block;
          font-family: var(--font-dm-mono), monospace;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.4);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 3px;
        }
        .lp-form-v {
          display: block;
          font-size: 14px; color: #f1f0ff; font-weight: 500;
        }
        .lp-form-docs {
          margin-top: 18px;
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
        }
        .lp-form-docpill {
          text-align: center;
          padding: 10px;
          border-radius: 8px;
          background: rgba(200, 169, 110, 0.12);
          border: 1px solid rgba(200, 169, 110, 0.30);
          color: var(--gold);
          font-family: var(--font-dm-mono), monospace;
          font-size: 11px;
          letter-spacing: 0.06em;
          opacity: 0; transform: translateY(8px);
        }
        .lp-stage-pane.is-active.lp-pane-form .lp-form-docpill {
          animation: lp-fade-up 0.45s var(--ease) forwards;
        }

        /* Pane: MAX */
        .lp-chat {
          display: flex; flex-direction: column; gap: 10px;
          text-align: left;
        }
        .lp-bubble {
          max-width: 78%;
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 13px; line-height: 1.5;
          color: #f1f0ff;
          opacity: 0; transform: translateY(8px);
        }
        .lp-stage-pane.is-active.lp-pane-max .lp-bubble {
          animation: lp-fade-up 0.45s var(--ease) forwards;
        }
        .lp-bubble-user {
          align-self: flex-end;
          background: rgba(200, 169, 110, 0.16);
          border: 1px solid rgba(200, 169, 110, 0.30);
          border-bottom-right-radius: 4px;
        }
        .lp-bubble-max {
          align-self: flex-start;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-bottom-left-radius: 4px;
        }
        .lp-bubble-max.is-muted { color: rgba(241, 240, 255, 0.78); }
        .lp-bubble-max .lp-c-gold { color: var(--gold); }
        .lp-bubble-max .lp-c-green-bold { color: var(--green-rev); font-weight: 600; }
        .lp-typing {
          align-self: flex-start;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 16px; border-bottom-left-radius: 4px;
          display: inline-flex; gap: 4px;
          opacity: 0;
        }
        .lp-stage-pane.is-active.lp-pane-max .lp-typing {
          animation: lp-fade-up 0.4s var(--ease) 1.0s forwards;
        }
        .lp-typing span {
          width: 5px; height: 5px; border-radius: 999px;
          background: rgba(255, 255, 255, 0.5);
          animation: lp-bounce 1s ease-in-out infinite;
        }
        .lp-typing span:nth-child(2) { animation-delay: 0.15s; }
        .lp-typing span:nth-child(3) { animation-delay: 0.30s; }
        @keyframes lp-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-3px); opacity: 1; }
        }
        .lp-tools {
          margin-top: 14px;
          display: flex; flex-wrap: wrap; gap: 6px;
        }
        .lp-tool {
          font-family: var(--font-dm-mono), monospace;
          font-size: 10px;
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(200, 169, 110, 0.10);
          color: var(--gold);
          border: 1px solid rgba(200, 169, 110, 0.20);
          letter-spacing: 0.04em;
        }

        /* ─── BENTO — Four pillars ───────────────────────────────────── */
        .lp-bento {
          position: relative;
          background: var(--cream);
          padding: 140px 0 120px;
          margin-top: -70px;
          clip-path: polygon(0 70px, 100% 0, 100% 100%, 0 100%);
        }
        .lp-bento-inner {
          max-width: 1240px; margin: 0 auto;
          padding: 0 28px;
        }
        .lp-bento-head {
          max-width: 720px;
          margin: 0 0 56px;
        }
        .lp-bento-grid {
          display: grid;
          grid-template-columns: 65fr 35fr;
          grid-auto-rows: minmax(320px, auto);
          gap: 20px;
        }
        @media (max-width: 860px) {
          .lp-bento-grid { grid-template-columns: 1fr; grid-auto-rows: minmax(260px, auto); }
        }
        .lp-bento-grid > *:nth-child(3) { grid-column: 1; }
        .lp-bento-grid > *:nth-child(4) { grid-column: 2; }
        @media (max-width: 860px) {
          .lp-bento-grid > *:nth-child(3),
          .lp-bento-grid > *:nth-child(4) { grid-column: 1; }
        }
        /* Swap row 2: narrow then wide */
        @media (min-width: 861px) {
          .lp-bento-grid > *:nth-child(3) { grid-column: 1; }
          .lp-bento-grid > *:nth-child(4) { grid-column: 2; }
        }

        .lp-card {
          position: relative;
          background: var(--cream-3);
          border-radius: 18px;
          box-shadow: var(--shadow-sm);
          overflow: hidden;
          padding: 32px;
          display: flex; flex-direction: column;
          transition: transform 360ms var(--ease), box-shadow 360ms var(--ease);
        }
        .lp-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
        }
        .lp-card-kicker {
          font-family: var(--font-dm-mono), monospace;
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--gold);
          margin: 0 0 10px;
        }
        .lp-card-title {
          font-family: var(--font-fraunces), Georgia, serif;
          font-weight: 700;
          font-size: 28px;
          line-height: 1.08;
          letter-spacing: -0.018em;
          color: var(--ink);
          margin: 0 0 12px;
        }
        .lp-card-body {
          font-size: 15px;
          color: var(--ink-muted);
          line-height: 1.55;
          margin: 0;
          max-width: 42ch;
        }

        /* Card variants */
        .lp-card-vp151 {
          position: absolute;
          bottom: -10px; right: -40px;
          width: 70%;
          background: var(--cream);
          border: 1px solid var(--rule-2);
          border-radius: 12px;
          padding: 16px;
          transform: rotate(2deg);
          box-shadow: var(--shadow-md);
        }
        .lp-vp151-kicker {
          font-family: var(--font-dm-mono), monospace;
          font-size: 9px; letter-spacing: 0.14em;
          color: var(--gold);
          text-transform: uppercase;
          margin: 0 0 6px;
        }
        .lp-vp151-title {
          font-family: var(--font-fraunces), Georgia, serif;
          font-size: 14px; font-weight: 700; color: var(--ink);
          margin: 0 0 12px;
        }
        .lp-vp151-row {
          display: flex; justify-content: space-between;
          font-size: 11px; padding: 4px 0;
          border-bottom: 1px solid var(--rule);
        }
        .lp-vp151-row span:first-child {
          font-family: var(--font-dm-mono), monospace;
          color: var(--ink-faint);
          letter-spacing: 0.08em;
          font-size: 9px;
          text-transform: uppercase;
        }
        .lp-vp151-row span:last-child {
          color: var(--ink); font-weight: 500;
        }

        .lp-stat-num {
          font-family: var(--font-fraunces), Georgia, serif;
          font-weight: 900;
          font-size: clamp(72px, 9vw, 96px);
          line-height: 0.85;
          letter-spacing: -0.035em;
          color: var(--ink);
          margin: 22px 0 6px;
        }
        .lp-stat-unit { color: var(--gold); font-style: italic; font-weight: 400; }
        .lp-stat-sub {
          font-family: var(--font-dm-mono), monospace;
          font-size: 11px; letter-spacing: 0.1em;
          color: var(--ink-faint);
          text-transform: uppercase;
        }
        .lp-stat-bg {
          position: absolute;
          inset: 0;
          opacity: 0.06;
          pointer-events: none;
        }

        /* Phone mockup (mobile-first card) */
        .lp-phone-wrap {
          position: absolute;
          right: -40px; bottom: -10px;
          width: 200px; height: 360px;
          transform: perspective(900px) rotateY(-22deg) rotateX(6deg) rotate(2deg);
          transform-style: preserve-3d;
        }
        .lp-phone {
          width: 100%; height: 100%;
          background: var(--ink);
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 12px 10px;
          box-shadow: 0 30px 60px -20px rgba(13, 17, 23, 0.45);
        }
        .lp-phone-screen {
          background: linear-gradient(180deg, #161a23 0%, #0d1117 100%);
          border-radius: 22px;
          height: 100%;
          padding: 18px 14px;
          color: #f1f0ff;
          display: flex; flex-direction: column;
        }
        .lp-phone-kicker {
          font-family: var(--font-dm-mono), monospace;
          font-size: 9px;
          letter-spacing: 0.16em;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
        }
        .lp-phone-rego {
          font-family: var(--font-dm-mono), monospace;
          font-size: 28px;
          color: var(--gold);
          letter-spacing: 0.05em;
          margin: 16px 0 4px;
          font-weight: 500;
        }
        .lp-phone-meta {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.78);
          line-height: 1.4;
        }
        .lp-phone-actions {
          margin-top: auto;
          padding-top: 14px;
          display: grid; gap: 6px;
        }
        .lp-phone-btn {
          font-family: var(--font-dm-mono), monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          background: rgba(200, 169, 110, 0.16);
          color: var(--gold);
          padding: 7px 0;
          border-radius: 999px;
          text-align: center;
          border: 1px solid rgba(200, 169, 110, 0.3);
        }

        /* Mini MAX card */
        .lp-mini-chat { display: flex; flex-direction: column; gap: 8px; margin-top: auto; }
        .lp-mini-bubble {
          padding: 9px 12px;
          border-radius: 14px;
          font-size: 12px;
          line-height: 1.5;
          max-width: 88%;
        }
        .lp-mini-bubble.is-user {
          align-self: flex-end;
          background: var(--ink);
          color: var(--cream);
          border-bottom-right-radius: 3px;
        }
        .lp-mini-bubble.is-max {
          align-self: flex-start;
          background: var(--cream-2);
          color: var(--ink);
          border-bottom-left-radius: 3px;
        }
        .lp-mini-bubble .lp-c-green-bold { color: #047857; font-weight: 700; }

        /* ─── MAX SECTION (dark again) ───────────────────────────────── */
        .lp-max {
          position: relative;
          background: var(--ink);
          padding: 140px 0 120px;
          margin-top: -70px;
          color: #f1f0ff;
          clip-path: polygon(0 0, 100% 70px, 100% 100%, 0 100%);
          overflow: hidden;
        }
        .lp-max-bg {
          position: absolute; inset: 0;
          background-image:
            radial-gradient(ellipse 80% 50% at 30% 0%, rgba(74, 222, 128, 0.10) 0%, transparent 60%),
            radial-gradient(circle at 95% 90%, rgba(200, 169, 110, 0.10), transparent 50%);
          pointer-events: none;
        }
        .lp-max-inner {
          position: relative;
          max-width: 1240px; margin: 0 auto;
          padding: 0 28px;
          display: grid;
          grid-template-columns: 5fr 6fr;
          gap: 64px;
          align-items: center;
        }
        @media (max-width: 960px) { .lp-max-inner { grid-template-columns: 1fr; gap: 48px; } }
        .lp-max-eyebrow {
          font-family: var(--font-dm-mono), monospace;
          font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--gold);
          margin: 0 0 16px;
        }
        .lp-max-h2 {
          font-family: var(--font-fraunces), Georgia, serif;
          font-weight: 700;
          font-size: clamp(40px, 5.4vw, 56px);
          line-height: 1.02;
          letter-spacing: -0.022em;
          color: #f1f0ff;
          margin: 0;
        }
        .lp-max-h2 em {
          font-style: italic;
          font-weight: 400;
          color: var(--green-rev);
        }
        .lp-max-body {
          margin: 22px 0 0;
          max-width: 52ch;
          font-size: 17px;
          line-height: 1.55;
          color: rgba(241, 240, 255, 0.72);
        }
        .lp-max-fineprint {
          margin: 18px 0 0;
          font-family: var(--font-dm-mono), monospace;
          font-size: 11px;
          letter-spacing: 0.04em;
          color: rgba(241, 240, 255, 0.45);
        }
        .lp-max-cta { margin-top: 36px; }

        /* MAX chat card */
        .lp-max-card {
          background: linear-gradient(180deg, #161a23 0%, #0d1117 100%);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 30px 80px -28px rgba(74, 222, 128, 0.25);
        }
        .lp-max-card-head {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 18px;
          font-family: var(--font-dm-mono), monospace;
          font-size: 11px;
          letter-spacing: 0.16em;
          color: var(--green-rev);
        }
        .lp-max-card-vehicle {
          font-family: var(--font-fraunces), Georgia, serif;
          color: var(--gold);
          font-weight: 700;
        }
        .lp-max-profit {
          font-family: var(--font-fraunces), Georgia, serif;
          color: var(--green-rev);
          font-weight: 700;
          font-size: 17px;
        }
        .lp-action-chips {
          margin-top: 14px;
          display: flex; flex-wrap: wrap; gap: 6px;
        }
        .lp-action-chip {
          font-family: var(--font-dm-mono), monospace;
          font-size: 10px;
          letter-spacing: 0.04em;
          padding: 5px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        /* ─── TESTIMONIALS ───────────────────────────────────────────── */
        .lp-voices {
          position: relative;
          background: var(--cream);
          padding: 160px 0 140px;
          margin-top: -70px;
          clip-path: polygon(0 70px, 100% 0, 100% 100%, 0 100%);
        }
        .lp-voices-inner {
          max-width: 1240px; margin: 0 auto;
          padding: 0 28px;
        }
        .lp-voices-head { margin: 0 0 80px; }
        .lp-voices-stack {
          display: flex; flex-direction: column;
          gap: 64px;
        }
        .lp-voice {
          position: relative;
          padding: 28px 36px 24px 64px;
          max-width: 580px;
        }
        .lp-voice::before {
          content: "\\201C";
          position: absolute;
          left: -8px; top: -42px;
          font-family: var(--font-fraunces), Georgia, serif;
          font-weight: 900;
          font-size: 180px;
          line-height: 1;
          color: rgba(200, 169, 110, 0.18);
          pointer-events: none;
          z-index: 0;
        }
        .lp-voice-1 { align-self: flex-start; }
        .lp-voice-2 { align-self: flex-end; margin-top: -32px; }
        .lp-voice-3 { align-self: center; margin-top: -32px; }
        @media (max-width: 720px) {
          .lp-voice-1, .lp-voice-2, .lp-voice-3 { align-self: stretch; margin-top: 0; max-width: 100%; }
        }
        .lp-voice-body {
          position: relative; z-index: 1;
          font-family: var(--font-fraunces), Georgia, serif;
          font-weight: 500;
          font-size: 20px;
          line-height: 1.4;
          color: var(--ink);
        }
        .lp-voice-foot {
          position: relative; z-index: 1;
          margin-top: 20px;
          display: flex; align-items: center; gap: 12px;
        }
        .lp-voice-avatar {
          width: 36px; height: 36px;
          border-radius: 999px;
          background: var(--ink);
          color: var(--cream);
          display: inline-flex; align-items: center; justify-content: center;
          font-family: var(--font-dm-mono), monospace;
          font-size: 12px;
          font-weight: 500;
        }
        .lp-voice-who {
          font-size: 14px;
          color: var(--ink);
          font-weight: 600;
        }
        .lp-voice-where {
          font-family: var(--font-dm-mono), monospace;
          font-size: 11px;
          color: var(--ink-muted);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .lp-voice-plan {
          font-family: var(--font-dm-mono), monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          padding: 3px 10px;
          border-radius: 999px;
          background: var(--gold-soft);
          color: var(--gold);
          margin-left: 6px;
        }

        /* ─── PRICING ────────────────────────────────────────────────── */
        .lp-pricing {
          background: var(--cream);
          padding: 80px 0 120px;
        }
        .lp-pricing-inner {
          max-width: 1240px; margin: 0 auto;
          padding: 0 28px;
        }
        .lp-pricing-head { margin: 0 auto 56px; max-width: 720px; text-align: center; }
        .lp-prices {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          align-items: start;
        }
        @media (max-width: 860px) {
          .lp-prices { grid-template-columns: 1fr; }
        }
        .lp-price {
          background: var(--cream-3);
          border: 1px solid var(--rule-2);
          border-radius: 22px;
          padding: 36px 32px 32px;
          display: flex; flex-direction: column;
          transition: transform 280ms var(--ease), box-shadow 280ms var(--ease);
        }
        .lp-price:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .lp-price-featured {
          background: var(--ink);
          color: var(--cream);
          border-color: var(--ink);
          margin-top: -24px;
          padding-top: 60px;
          padding-bottom: 56px;
        }
        @media (max-width: 860px) { .lp-price-featured { margin-top: 0; padding-top: 36px; } }
        .lp-price-kicker {
          font-family: var(--font-dm-mono), monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--gold);
          margin: 0 0 18px;
        }
        .lp-price-title {
          font-family: var(--font-fraunces), Georgia, serif;
          font-weight: 700;
          font-size: 26px;
          letter-spacing: -0.012em;
          margin: 0 0 14px;
          color: inherit;
        }
        .lp-price-num {
          font-family: var(--font-fraunces), Georgia, serif;
          font-weight: 900;
          font-size: 52px;
          line-height: 1;
          letter-spacing: -0.022em;
          color: inherit;
        }
        .lp-price-num-let { font-style: italic; font-weight: 400; }
        .lp-price-per {
          font-family: var(--font-dm-mono), monospace;
          font-size: 14px;
          color: inherit; opacity: 0.55;
          margin-left: 6px;
        }
        .lp-price-desc {
          margin: 22px 0 0;
          font-size: 15px;
          line-height: 1.55;
          color: inherit;
          opacity: 0.78;
        }
        .lp-price-features {
          list-style: none;
          padding: 0;
          margin: 22px 0 0;
          display: flex; flex-direction: column;
          gap: 9px;
          flex: 1;
        }
        .lp-price-features li {
          display: flex; align-items: flex-start; gap: 10px;
          font-size: 14px;
          line-height: 1.5;
          opacity: 0.88;
        }
        .lp-price-features svg { flex-shrink: 0; margin-top: 4px; }
        .lp-price-cta {
          margin-top: 32px;
          display: inline-flex; align-items: center; justify-content: space-between; gap: 8px;
          padding: 12px 18px;
          border-radius: 999px;
          font-size: 14px; font-weight: 600;
          text-decoration: none;
          transition: transform 200ms var(--ease);
        }
        .lp-price-cta:hover { transform: translateY(-1px); }
        .lp-price .lp-price-cta {
          background: var(--ink); color: var(--cream);
        }
        .lp-price-featured .lp-price-cta {
          background: var(--gold); color: var(--ink);
        }

        /* ─── Final CTA + Footer ─────────────────────────────────────── */
        .lp-final {
          background: var(--ink);
          color: var(--cream);
          padding: 100px 28px;
          text-align: center;
        }
        .lp-final-inner { max-width: 720px; margin: 0 auto; }
        .lp-final-h {
          font-family: var(--font-fraunces), Georgia, serif;
          font-weight: 700;
          font-size: clamp(40px, 5vw, 56px);
          line-height: 1.0;
          letter-spacing: -0.022em;
          margin: 0;
        }
        .lp-final-h em { font-style: italic; font-weight: 400; color: var(--gold); }
        .lp-final-sub {
          margin: 24px auto 0;
          max-width: 52ch;
          color: rgba(245, 240, 232, 0.72);
          font-size: 16px;
          line-height: 1.6;
        }
        .lp-final-cta {
          margin-top: 36px;
          display: flex; flex-wrap: wrap; justify-content: center; gap: 12px;
        }
        .lp-footer {
          background: var(--ink);
          color: rgba(245, 240, 232, 0.5);
          padding: 28px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .lp-footer-inner {
          max-width: 1240px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 16px;
        }
        .lp-footer-mono {
          font-family: var(--font-dm-mono), monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
        }
        .lp-footer-links { display: flex; gap: 22px; }
        .lp-footer-links a {
          color: rgba(245, 240, 232, 0.5);
          font-size: 13px;
          text-decoration: none;
          transition: color 200ms var(--ease);
        }
        .lp-footer-links a:hover { color: var(--cream); }
      `}</style>

      <main className="lp">

        {/* ─── Nav ───────────────────────────────────────────────────── */}
        <header className="lp-nav">
          <div className="lp-nav-row">
            <Link href="/" className="lp-brand" aria-label="LMCT PRO home">
              <span className="lp-mark" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5f0e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 17V9a2 2 0 0 1 2-2h2l2-3h6l2 3h2a2 2 0 0 1 2 2v8" />
                  <circle cx="7.5" cy="17.5" r="2.5" />
                  <circle cx="16.5" cy="17.5" r="2.5" />
                </svg>
              </span>
              <span className="lp-brand-name">LMCT PRO</span>
            </Link>
            <nav className="lp-nav-links" aria-label="Primary">
              <a className="lp-nav-link" href="#platform">Platform</a>
              <a className="lp-nav-link" href="#bento">Why dealers switch</a>
              <a className="lp-nav-link" href="#max">MAX</a>
              <a className="lp-nav-link" href="#pricing">Pricing</a>
            </nav>
            <div className="lp-nav-cta">
              <Link href="/auth/login" className="lp-nav-link" style={{ display: "inline" }}>Sign in</Link>
              <Link href="/demo" className="lp-btn-primary">
                Book a demo <ArrowRight />
              </Link>
            </div>
          </div>
        </header>

        {/* ─── HERO — Moment 1: ambient glow + boundary-breaking badges ─ */}
        <section className="lp-hero">
          {/* Organic gold blob top-right */}
          <svg className="lp-hero-blob" viewBox="0 0 600 600" aria-hidden="true">
            <defs>
              <radialGradient id="lp-blob-grad" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#c8a96e" stopOpacity="0.28" />
                <stop offset="60%" stopColor="#c8a96e" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#c8a96e" stopOpacity="0" />
              </radialGradient>
            </defs>
            <path
              d="M412,90 C500,140 560,220 540,320 C520,420 430,500 320,520 C220,540 120,490 80,400 C40,310 80,200 170,140 C260,80 340,50 412,90 Z"
              fill="url(#lp-blob-grad)"
            />
          </svg>

          <div className="lp-hero-inner">
            <div className="lp-reveal">
              <p className="lp-eyebrow">For Australian LMCT dealers</p>
              <h1 className="lp-h1">
                Run a <em>tighter</em> yard.<br />Sell with conviction.
              </h1>
              <p className="lp-sub">
                LMCT PRO is the dealer management platform built for the way Australian
                car traders actually work — auction Monday, recon Tuesday, listings live
                by Wednesday. One screen for your stock, your sales, your compliance, and
                an AI assistant trained on your inventory.
              </p>
              <div className="lp-cta-row">
                <Link href="/demo" className="lp-btn-primary" style={{ padding: "14px 22px", fontSize: 15 }}>
                  Book a demo <ArrowRight />
                </Link>
                <Link href="/auth/sign-up" className="lp-btn-ghost">
                  Or start a 14-day trial
                </Link>
              </div>
              <p className="lp-trust">30-minute onboarding · No credit card · No lock-in.</p>
            </div>

            <div className="lp-hero-stage lp-reveal" aria-hidden="true">
              <div className="lp-hero-glow" />
              <HeroCard />
              <span className="lp-badge" style={{ top: -10, left: -28 }}>
                <span className="lp-badge-dot" style={{ background: "var(--green-rev)" }} />
                VP151 auto-filled · 12 sec
              </span>
              <span className="lp-badge lp-badge-2" style={{ bottom: 10, right: -36 }}>
                <span className="lp-badge-dot" style={{ background: "var(--amber)" }} />
                Camry sold · $4,200 profit
              </span>
            </div>
          </div>
        </section>

        {/* ─── DARK FLIP — Moment 2: auto-cycling showcase ──────────────── */}
        <section id="platform" className="lp-stage">
          <div className="lp-stage-bg" />
          <div className="lp-stage-inner">
            <p className="lp-stage-eyebrow lp-reveal">The platform</p>
            <h2 className="lp-h2 lp-reveal">
              The platform, <em>on stage.</em>
            </h2>
            <p className="lp-stage-sub lp-reveal">
              Live stock, a vehicle being added in twelve seconds, a VP151 forming itself, and
              MAX answering a real dealer question. Tap a tab — it&rsquo;ll keep cycling on its own.
            </p>

            <div className="lp-tabs lp-reveal" role="tablist">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  role="tab"
                  type="button"
                  aria-selected={tab === t.key}
                  onClick={() => pick(t.key)}
                  className={`lp-tab${tab === t.key ? " is-active" : ""}`}
                >
                  <span className="lp-tab-dot" />
                  {t.label}
                </button>
              ))}
            </div>

            <div className="lp-stage-screen lp-reveal">
              <div className="lp-stage-screen-pad">
                <PaneStock  active={tab === "stock"} />
                <PaneAdd    active={tab === "add"}   />
                <PaneForm   active={tab === "form"}  />
                <PaneMax    active={tab === "max"}   />
              </div>
            </div>
          </div>
        </section>

        {/* ─── BENTO — Moment 3: four pillars in different sizes ────────── */}
        <section id="bento" className="lp-bento">
          <div className="lp-bento-inner">
            <div className="lp-bento-head lp-reveal">
              <p className="lp-eyebrow">Why dealers switch</p>
              <h2 style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontWeight: 700,
                fontSize: "clamp(34px, 5vw, 50px)",
                lineHeight: 1.02,
                letterSpacing: "-0.022em",
                margin: 0,
                color: "var(--ink)",
              }}>
                The yard, <em style={{ color: "var(--gold)", fontStyle: "italic", fontWeight: 400 }}>made navigable.</em>
              </h2>
            </div>

            <div className="lp-bento-grid">
              {/* Wide 1 — LMCT Compliance */}
              <article className="lp-card lp-reveal" style={{ minHeight: 380 }}>
                <p className="lp-card-kicker">LMCT compliance</p>
                <h3 className="lp-card-title">VP151. Dealings register. Statutory warranty.</h3>
                <p className="lp-card-body">
                  Forms generated from the sale, filed quarterly, and printed when you need
                  them. The paper that used to sit on your desk now lives where it should.
                </p>
                <div className="lp-card-vp151" aria-hidden="true">
                  <p className="lp-vp151-kicker">VicRoads VP151</p>
                  <p className="lp-vp151-title">2018 Mercedes-Benz C300</p>
                  <div className="lp-vp151-row"><span>Buyer</span><span>Emma S.</span></div>
                  <div className="lp-vp151-row"><span>Licence</span><span>VIC · 09421003</span></div>
                  <div className="lp-vp151-row"><span>Sale date</span><span>27 May 2026</span></div>
                  <div className="lp-vp151-row"><span>Price</span><span>$32,500</span></div>
                  <div className="lp-vp151-row"><span>Warranty</span><span>Statutory · 3 mo / 5,000km</span></div>
                </div>
              </article>

              {/* Narrow 1 — Australian-built */}
              <article className="lp-card lp-reveal" style={{ minHeight: 380, overflow: "hidden" }}>
                <svg className="lp-stat-bg" viewBox="0 0 200 200" aria-hidden="true">
                  {/* Suburb-map ghost texture */}
                  <g stroke="#0d1117" strokeWidth="0.5" fill="none">
                    <circle cx="40" cy="60" r="14" />
                    <circle cx="120" cy="40" r="22" />
                    <circle cx="160" cy="120" r="18" />
                    <circle cx="80" cy="130" r="11" />
                    <circle cx="50" cy="170" r="8" />
                    <path d="M40,60 L80,130 L160,120 M120,40 L80,130 L50,170" strokeDasharray="2,3" />
                  </g>
                </svg>
                <p className="lp-card-kicker">Australian built</p>
                <h3 className="lp-card-title">Made in Melbourne.</h3>
                <p className="lp-stat-num">100<span className="lp-stat-unit">%</span></p>
                <p className="lp-stat-sub">Compliant with VIC LMCT rules</p>
                <p className="lp-card-body" style={{ marginTop: "auto" }}>
                  Designed around VicRoads forms and the Australian Consumer Law.
                </p>
              </article>

              {/* Narrow 2 — Your AI */}
              <article className="lp-card lp-reveal" style={{ minHeight: 380 }}>
                <p className="lp-card-kicker">Your AI</p>
                <h3 className="lp-card-title">A colleague, not a chatbot.</h3>
                <p className="lp-card-body">
                  MAX lives inside your data. Specific answers in your dealership&rsquo;s
                  voice. The full feature tour lives behind the demo.
                </p>
                <div className="lp-mini-chat">
                  <div className="lp-mini-bubble is-user">What did the Tiguan land at?</div>
                  <div className="lp-mini-bubble is-max">
                    Sold yesterday — <span className="lp-c-green-bold">$3,400 profit</span>.
                  </div>
                </div>
              </article>

              {/* Wide 2 — Mobile-first */}
              <article className="lp-card lp-reveal" style={{ minHeight: 380, overflow: "hidden" }}>
                <p className="lp-card-kicker">Mobile first</p>
                <h3 className="lp-card-title">Auction floor → listing in twelve seconds.</h3>
                <p className="lp-card-body">
                  Scan a plate from your phone, watch the year-make-model-variant resolve
                  itself, print a tax invoice from the carpark. PWA-installable.
                </p>
                <div className="lp-phone-wrap" aria-hidden="true">
                  <div className="lp-phone">
                    <div className="lp-phone-screen">
                      <p className="lp-phone-kicker">Scanner · live</p>
                      <p className="lp-phone-rego">DPR76M</p>
                      <p className="lp-phone-meta">2017 VW Tiguan 132TSI<br />Pure White · 84,250 km</p>
                      <div className="lp-phone-actions">
                        <span className="lp-phone-btn">Add to stock</span>
                        <span className="lp-phone-btn">Auto-list</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ─── MAX — Moment 4: "Not a chatbot." in green ────────────────── */}
        <section id="max" className="lp-max">
          <div className="lp-max-bg" />
          <div className="lp-max-inner">
            <div className="lp-reveal">
              <p className="lp-max-eyebrow">Your AI · Hired</p>
              <h2 className="lp-max-h2">
                You hire a colleague.<br /><em>Not a chatbot.</em>
              </h2>
              <p className="lp-max-body">
                MAX answers questions about your business with your data.
                Specific. In your dealership&rsquo;s tone of voice. Knows what&rsquo;s
                aged out, what&rsquo;s margin-thin, what a buyer paid last December.
                Drafts listings, prices aged stock, flags risk. Trained on you, not
                a million strangers.
              </p>
              <p className="lp-max-fineprint">
                Built on Claude. Prompt-cached. Tool-using. The clever bits stay behind the demo.
              </p>
              <div className="lp-max-cta">
                <Link href="/demo" className="lp-btn-green-outline">
                  See MAX on your stock <ArrowRight />
                </Link>
              </div>
            </div>

            <MaxChatCard />
          </div>
        </section>

        {/* ─── TESTIMONIALS — Moment 5: ghost quote-mark containers ─────── */}
        <section className="lp-voices">
          <div className="lp-voices-inner">
            <div className="lp-voices-head lp-reveal">
              <p className="lp-eyebrow">Dealers on LMCT PRO</p>
              <h2 style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontWeight: 700,
                fontSize: "clamp(34px, 5vw, 50px)",
                lineHeight: 1.02,
                letterSpacing: "-0.022em",
                color: "var(--ink)",
                margin: 0,
                maxWidth: "16ch",
              }}>
                Built around the way a real yard runs.
              </h2>
            </div>

            <div className="lp-voices-stack">
              <Voice
                cls="lp-voice-1 lp-reveal"
                body="We were paying a bookkeeper to chase the dealings register every quarter. Now it prints itself. The aged-stock alert pings me before I notice the car&rsquo;s gone stale."
                initials="JW"
                who="James W."
                where="Geelong"
                plan="Software + AI"
              />
              <Voice
                cls="lp-voice-2 lp-reveal"
                body="The listing builder gives me Facebook, Carsales and Gumtree copy in one click. Saturday morning is for selling cars again, not typing."
                initials="AN"
                who="Anh N."
                where="Bankstown"
                plan="Done For You"
              />
              <Voice
                cls="lp-voice-3 lp-reveal"
                body="MAX knows my stock. I asked what to do with a 2018 Ranger sitting at 84 days. It gave me the comparables and a price. Sold it that week."
                initials="MD"
                who="Marco D."
                where="Brunswick"
                plan="Software + AI"
              />
            </div>
          </div>
        </section>

        {/* ─── PRICING ──────────────────────────────────────────────────── */}
        <section id="pricing" className="lp-pricing">
          <div className="lp-pricing-inner">
            <div className="lp-pricing-head lp-reveal">
              <p className="lp-eyebrow">Pricing</p>
              <h2 style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontWeight: 700,
                fontSize: "clamp(34px, 5vw, 50px)",
                lineHeight: 1.02,
                letterSpacing: "-0.022em",
                color: "var(--ink)",
                margin: 0,
              }}>
                Three ways to run <em style={{ color: "var(--gold)", fontStyle: "italic", fontWeight: 400 }}>your yard.</em>
              </h2>
            </div>

            <div className="lp-prices">
              <Price
                kicker="Software"
                title="Software + AI"
                amount={<>$249<span className="lp-price-per">/ month</span></>}
                description="The full platform, on your phone and your laptop, with the assistant trained on your stock."
                features={[
                  "Unlimited vehicles, sales and customers",
                  "All compliance reports + PDF + CSV",
                  "MAX, your AI assistant",
                  "Resend buyer receipts",
                  "PWA-installable",
                ]}
                cta="Start free trial"
                href="/auth/sign-up"
              />
              <Price
                featured
                kicker="Most chosen"
                title="Done For You"
                amount={<>$799<span className="lp-price-per">/ month</span></>}
                description="We take the listings, the photo retouching, the buyer follow-up. You focus on buying and closing."
                features={[
                  "Everything in Software + AI",
                  "Listings written and posted for you",
                  "Photo cleanup and watermarking",
                  "Buyer enquiry triage",
                  "Quarterly compliance audit",
                ]}
                cta="Book a demo"
                href="/demo"
              />
              <Price
                kicker="Growth"
                title="Growth"
                amount={<><span className="lp-price-num-let">Let&rsquo;s talk</span></>}
                description="Multi-yard operators, finance brokers, and dealer groups that need bespoke integration."
                features={[
                  "Everything in Done For You",
                  "Multi-yard consolidation",
                  "Custom Carsales / AutoGrab integration",
                  "Dedicated specialist",
                  "Service-level agreement",
                ]}
                cta="Contact us for pricing"
                href="/demo"
              />
            </div>
          </div>
        </section>

        {/* ─── Final CTA ────────────────────────────────────────────────── */}
        <section className="lp-final">
          <div className="lp-final-inner lp-reveal">
            <p className="lp-eyebrow" style={{ color: "var(--gold)", marginBottom: 22 }}>Start today</p>
            <h2 className="lp-final-h">
              Fourteen days. <em>No credit card.</em>
            </h2>
            <p className="lp-final-sub">
              Bring your stock. Book a demo, run a sale through the platform, and decide
              if LMCT PRO becomes the easiest software your dealership has ever used.
            </p>
            <div className="lp-final-cta">
              <Link href="/demo" className="lp-btn-cream-on-dark">
                Book a demo <ArrowRight />
              </Link>
              <Link
                href="/auth/sign-up"
                className="lp-btn-cream-on-dark"
                style={{ background: "transparent", color: "var(--cream)", border: "1px solid rgba(245,240,232,0.25)" }}
              >
                Or start the trial
              </Link>
            </div>
          </div>
        </section>

        <footer className="lp-footer">
          <div className="lp-footer-inner">
            <span className="lp-footer-mono">© {new Date().getFullYear()} LMCT PRO PTY LTD · MELBOURNE</span>
            <div className="lp-footer-links">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="mailto:hello@lmctpro.com.au">Contact</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

/* ─── Small inline pieces ─────────────────────────────────────────────── */

function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" /><path d="M13 5l7 7-7 7" />
    </svg>
  )
}

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function HeroCard() {
  return (
    <div className="lp-hero-card">
      <div className="lp-hero-chrome">
        <div className="lp-hero-dots"><span /><span /><span /></div>
        <span className="lp-hero-url">lmctpro.com.au / dashboard</span>
        <span className="lp-hero-max"><span className="lp-pulse" /> MAX</span>
      </div>
      <div className="lp-hero-body">
        <div className="lp-hero-tile">
          <Tile label="IN STOCK" value="42" />
          <Tile label="SOLD MTD" value="11" money />
          <Tile label="REVENUE"  value="$284K" />
          <Tile label="PROFIT"   value="$48K" money />
        </div>
        <div className="lp-hero-table">
          <HeroRow rego="DPR76M" car="2017 VW Tiguan 132TSI"     days={15} price="$18,999"  tone="green" />
          <HeroRow rego="VMDMR"  car="2022 Lamborghini Urus"     days={67} price="$369,000" tone="amber" />
          <HeroRow rego="2CY1PF" car="2018 Mercedes C300"        days={92} price="$32,500"  tone="red"   />
          <HeroRow rego="QRT332" car="2021 Toyota RAV4 Cruiser"  days={6}  price="$41,750"  tone="green" />
        </div>
      </div>
    </div>
  )
}

function Tile({ label, value, money }: { label: string; value: string; money?: boolean }) {
  return (
    <div className="lp-tile">
      <div className="lp-tile-label">{label}</div>
      <div className={`lp-tile-val${money ? " is-money" : ""}`}>{value}</div>
    </div>
  )
}

function HeroRow({ rego, car, days, price, tone }: { rego: string; car: string; days: number; price: string; tone: "green" | "amber" | "red" }) {
  const cls = tone === "red" ? "lp-c-red" : tone === "amber" ? "lp-c-amber" : "lp-c-green"
  return (
    <div className="lp-hero-row">
      <span className="lp-hero-rego">{rego}</span>
      <span className="lp-hero-car">{car}</span>
      <span className={`lp-hero-days ${cls}`}>{days}d</span>
      <span className="lp-hero-price">{price}</span>
    </div>
  )
}

/* ─── Stage panes ─────────────────────────────────────────────────────── */

function PaneStock({ active }: { active: boolean }) {
  return (
    <div className={`lp-stage-pane lp-pane-stock${active ? " is-active" : ""}`}>
      <div className="lp-stock-kpis">
        <StockKpi label="IN STOCK" value="42" />
        <StockKpi label="SOLD MTD" value="11" money />
        <StockKpi label="REVENUE" value="$284K" />
        <StockKpi label="PROFIT" value="$48K" money />
      </div>
      <div className="lp-stock-rows">
        <StockRow stock="S-104" car="2021 Toyota RAV4 Cruiser" body="SUV"   days={6}  price="$41,750" tone="green" />
        <StockRow stock="S-097" car="2017 VW Tiguan 132TSI"    body="SUV"   days={15} price="$18,999" tone="green" />
        <StockRow stock="S-088" car="2022 Mazda CX-5 Akera"    body="SUV"   days={41} price="$46,900" tone="amber" />
        <StockRow stock="S-073" car="2018 Mercedes C300"        body="Sedan" days={92} price="$32,500" tone="red"   />
      </div>
    </div>
  )
}

function StockKpi({ label, value, money }: { label: string; value: string; money?: boolean }) {
  return (
    <div className="lp-tile">
      <div className="lp-tile-label">{label}</div>
      <div className={`lp-tile-val${money ? " is-money" : ""}`}>{value}</div>
    </div>
  )
}

function StockRow({ stock, car, body, days, price, tone }: { stock: string; car: string; body: string; days: number; price: string; tone: "green" | "amber" | "red" }) {
  const cls = tone === "red" ? "lp-c-red" : tone === "amber" ? "lp-c-amber" : "lp-c-green"
  return (
    <div className="lp-stock-row">
      <span className="lp-stock-row-stock">{stock}</span>
      <span className="lp-stock-row-car">{car}</span>
      <span className="lp-stock-row-body">{body}</span>
      <span className={`lp-stock-row-days ${cls}`}>{days}d</span>
      <span className="lp-stock-row-price">{price}</span>
    </div>
  )
}

function PaneAdd({ active }: { active: boolean }) {
  const fields: { label: string; value: string }[] = [
    { label: "Rego",      value: "DPR76M" },
    { label: "Year",      value: "2017" },
    { label: "Make",      value: "Volkswagen" },
    { label: "Model",     value: "Tiguan 132TSI" },
    { label: "Odometer",  value: "84,250 km" },
    { label: "Colour",    value: "Pure White" },
    { label: "Purchase",  value: "$14,500" },
    { label: "Ask price", value: "$18,999" },
  ]
  return (
    <div className={`lp-stage-pane lp-pane-add${active ? " is-active" : ""}`}>
      <div className="lp-add-grid">
        {fields.map((f, i) => (
          <div key={f.label} className="lp-add-field" style={{ animationDelay: `${i * 0.32}s` }}>
            <span className="lp-add-label">{f.label}</span>
            <span className="lp-add-val">{f.value}</span>
          </div>
        ))}
      </div>
      <div className="lp-add-done">
        <Check />
        <span>Added to stock · S-097 · 12 seconds</span>
      </div>
    </div>
  )
}

function PaneForm({ active }: { active: boolean }) {
  const rows: { k: string; v: string }[] = [
    { k: "Buyer",       v: "Emma S." },
    { k: "Licence",     v: "VIC · 09421003" },
    { k: "Address",     v: "42 Park Road, Hawthorn" },
    { k: "Phone",       v: "0413 552 081" },
    { k: "Sale date",   v: "27 May 2026" },
    { k: "Sale price",  v: "$32,500" },
  ]
  return (
    <div className={`lp-stage-pane lp-pane-form${active ? " is-active" : ""}`}>
      <div className="lp-form-head">
        <span className="lp-form-kicker">VicRoads VP151 — Transfer of Registration</span>
        <span className="lp-form-title">2018 Mercedes-Benz C300</span>
        <span className="lp-form-meta">STOCK S-073 · REGO 2CY1PF</span>
      </div>
      <div className="lp-form-grid">
        {rows.map((r, i) => (
          <div key={r.k} className="lp-formrow" style={{ animationDelay: `${0.1 + i * 0.32}s` }}>
            <span className="lp-form-k">{r.k}</span>
            <span className="lp-form-v">{r.v}</span>
          </div>
        ))}
      </div>
      <div className="lp-form-docs">
        {["Tax invoice", "Transfer form", "Buyer receipt"].map((label, i) => (
          <span key={label} className="lp-form-docpill" style={{ animationDelay: `${2.4 + i * 0.25}s` }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

function PaneMax({ active }: { active: boolean }) {
  return (
    <div className={`lp-stage-pane lp-pane-max${active ? " is-active" : ""}`}>
      <div className="lp-chat">
        <div className="lp-bubble lp-bubble-user" style={{ animationDelay: "0s" }}>
          What should I do with the white Tiguan?
        </div>
        <div className="lp-typing">
          <span /><span /><span />
        </div>
        <div className="lp-bubble lp-bubble-max" style={{ animationDelay: "1.8s" }}>
          The <span className="lp-c-gold">2017 Tiguan 132TSI (DPR76M)</span> has been on the lot 15 days at $18,999.
        </div>
        <div className="lp-bubble lp-bubble-max is-muted" style={{ animationDelay: "2.6s" }}>
          Comparables in your last 90 days sold around $18.2K–$19.4K, average 22 days held.
          Hold for now — revisit at 30 days and consider <span className="lp-c-green-bold">$17,990</span> if no enquiries.
        </div>
      </div>
      <div className="lp-tools">
        {["lookup_vehicle_by_rego", "top_makes_last_n_days", "aged_stock_action_plan"].map((t) => (
          <span key={t} className="lp-tool">{t}()</span>
        ))}
      </div>
    </div>
  )
}

function MaxChatCard() {
  return (
    <div className="lp-max-card lp-reveal">
      <div className="lp-max-card-head">
        <span className="lp-pulse" />
        MAX · ONLINE
      </div>
      <div className="lp-chat">
        <div className="lp-bubble lp-bubble-user" style={{ opacity: 1, transform: "none" }}>
          What did we sell the white Tiguan for?
        </div>
        <div className="lp-bubble lp-bubble-max" style={{ opacity: 1, transform: "none" }}>
          The <span className="lp-max-card-vehicle">2017 VW Tiguan 132TSI (DPR76M)</span> sold yesterday
          to Marcus L. for <span className="lp-mono">$19,250</span>.
        </div>
        <div className="lp-bubble lp-bubble-max is-muted" style={{ opacity: 1, transform: "none" }}>
          <span>Profit: </span><span className="lp-max-profit">$3,420</span> · 16.4% margin · 17 days held.
        </div>
      </div>
      <div className="lp-action-chips">
        <span className="lp-action-chip">View vehicle</span>
        <span className="lp-action-chip">Drop price</span>
        <span className="lp-action-chip">Ask more</span>
      </div>
    </div>
  )
}

function Voice({ cls, body, initials, who, where, plan }: { cls: string; body: string; initials: string; who: string; where: string; plan: string }) {
  return (
    <figure className={`lp-voice ${cls}`}>
      <blockquote className="lp-voice-body">{body}</blockquote>
      <figcaption className="lp-voice-foot">
        <span className="lp-voice-avatar">{initials}</span>
        <span className="lp-voice-who">{who}</span>
        <span className="lp-voice-where">· {where}</span>
        <span className="lp-voice-plan">{plan}</span>
      </figcaption>
    </figure>
  )
}

function Price({
  kicker, title, amount, description, features, cta, href, featured,
}: {
  kicker: string
  title: string
  amount: React.ReactNode
  description: string
  features: string[]
  cta: string
  href: string
  featured?: boolean
}) {
  return (
    <div className={`lp-price${featured ? " lp-price-featured" : ""} lp-reveal`}>
      <p className="lp-price-kicker" style={featured ? { color: "var(--gold)" } : undefined}>{kicker}</p>
      <h3 className="lp-price-title">{title}</h3>
      <div className="lp-price-num">{amount}</div>
      <p className="lp-price-desc">{description}</p>
      <ul className="lp-price-features">
        {features.map((f) => (
          <li key={f}>
            <Check />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Link href={href} className="lp-price-cta">
        {cta} <ArrowRight />
      </Link>
    </div>
  )
}
