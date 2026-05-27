import Link from "next/link"
import { DemoForm } from "@/components/marketing/demo-form"
import { Logo } from "@/components/brand/logo"

export const metadata = {
  title: "Book a demo · LMCT PRO",
  description: "Fifteen minutes on a screenshare. Bring your stock — we'll show you how LMCT PRO runs it.",
}

export default function DemoPage() {
  return (
    <div className="dp-root">
      <style>{`
        :root {
          --cream: #fdf8f0;
          --cream-2: #f6efe1;
          --ink: #0a1628;
          --ink-2: #1d2a3f;
          --ink-3: #4a5567;
          --gold: #d4921a;
          --gold-2: #b87a12;
          --money: #10b981;
          --rule: rgba(10, 22, 40, 0.10);
          --rule-2: rgba(10, 22, 40, 0.18);
        }
        .dp-root {
          background: var(--cream);
          color: var(--ink);
          font-family: var(--font-jakarta), -apple-system, system-ui, sans-serif;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
        }
        .dp-nav {
          backdrop-filter: blur(10px);
          background: rgba(253, 248, 240, 0.78);
          border-bottom: 1px solid var(--rule);
          position: sticky; top: 0; z-index: 40;
        }
        .dp-nav-row {
          max-width: 1240px; margin: 0 auto; padding: 0 28px;
          height: 64px; display: flex; align-items: center; justify-content: space-between;
        }
        .dp-brand {
          font-family: var(--font-fraunces), Georgia, serif;
          font-weight: 700; font-size: 19px; letter-spacing: -0.01em; color: var(--ink);
          display: flex; align-items: center; gap: 10px; text-decoration: none;
        }
        .dp-mark {
          width: 32px; height: 32px; border-radius: 8px;
          background: var(--ink); display: inline-flex; align-items: center; justify-content: center;
        }
        .dp-back { color: var(--ink-2); font-size: 14px; text-decoration: none; }
        .dp-back:hover { color: var(--ink); }

        .dp-wrap { max-width: 1240px; margin: 0 auto; padding: 64px 28px; }
        @media (max-width: 768px) { .dp-wrap { padding: 40px 20px; } }

        .dp-grid { display: grid; grid-template-columns: 1.05fr 1fr; gap: 80px; align-items: start; }
        @media (max-width: 980px) { .dp-grid { grid-template-columns: 1fr; gap: 48px; } }

        .dp-kicker {
          font-family: var(--font-dm-mono), monospace;
          font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold-2);
          margin-bottom: 18px;
        }
        .dp-title {
          font-family: var(--font-fraunces), Georgia, serif;
          font-weight: 700; line-height: 0.98; letter-spacing: -0.022em;
          font-size: clamp(40px, 6vw, 64px); color: var(--ink); margin: 0;
        }
        .dp-title em { font-style: italic; font-weight: 400; color: var(--gold); }
        .dp-lede { color: var(--ink-3); font-size: 18px; line-height: 1.55; max-width: 50ch; margin-top: 22px; }

        .dp-expect { margin-top: 40px; display: grid; gap: 16px; }
        .dp-expect-item {
          display: grid; grid-template-columns: 32px 1fr; gap: 14px; align-items: start;
          padding: 14px 0; border-top: 1px solid var(--rule);
        }
        .dp-expect-item:first-child { border-top: 0; padding-top: 0; }
        .dp-expect-num {
          font-family: var(--font-dm-mono), monospace; font-size: 12px;
          color: var(--gold-2); letter-spacing: 0.1em;
        }
        .dp-expect-body { font-size: 15px; line-height: 1.5; color: var(--ink-2); }

        .dp-card {
          background: var(--cream-2);
          border: 1px solid var(--rule);
          border-radius: 22px;
          padding: 36px;
        }
        @media (max-width: 480px) { .dp-card { padding: 24px; border-radius: 18px; } }

        .df-form { display: flex; flex-direction: column; gap: 24px; }
        .df-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 540px) { .df-grid { grid-template-columns: 1fr; } }
        .df-row.is-full { grid-column: 1 / -1; }
        .df-label {
          font-family: var(--font-dm-mono), monospace;
          font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--ink-3); display: block; margin-bottom: 6px;
        }
        .df-req { color: var(--gold-2); margin-left: 2px; }
        .df-input {
          width: 100%; box-sizing: border-box;
          background: var(--cream);
          border: 1px solid var(--rule-2);
          border-radius: 10px;
          padding: 12px 14px;
          font-size: 15px; color: var(--ink);
          font-family: var(--font-jakarta), sans-serif;
          transition: border-color 180ms cubic-bezier(.2,.8,.3,1), box-shadow 180ms cubic-bezier(.2,.8,.3,1);
        }
        .df-input:focus {
          outline: none;
          border-color: var(--ink);
          box-shadow: 0 0 0 4px rgba(10, 22, 40, 0.08);
        }
        .df-input::placeholder { color: var(--ink-3); opacity: 0.6; }
        .df-textarea { resize: vertical; min-height: 96px; line-height: 1.45; }
        .df-submit {
          background: var(--ink);
          color: var(--cream);
          padding: 14px 22px; border-radius: 999px;
          font-weight: 600; font-size: 15px;
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          border: 0; cursor: pointer;
          transition: transform 200ms cubic-bezier(.2,.8,.3,1), box-shadow 200ms cubic-bezier(.2,.8,.3,1);
        }
        .df-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 14px 30px -10px rgba(10,22,40,0.4);
        }
        .df-submit:disabled { opacity: 0.6; cursor: progress; }
        .df-fineprint { color: var(--ink-3); font-size: 13px; line-height: 1.5; }

        .df-done { text-align: center; padding: 20px 0; }
        .df-done svg { color: var(--money); margin-bottom: 18px; }
        .df-done-title {
          font-family: var(--font-fraunces), Georgia, serif;
          font-weight: 700; font-size: 32px; letter-spacing: -0.018em; margin: 0;
        }
        .df-done-body { color: var(--ink-3); font-size: 16px; line-height: 1.55; margin-top: 14px; }
        .df-done-foot { color: var(--ink-3); font-size: 13px; margin-top: 22px; }
        .df-mono { font-family: var(--font-dm-mono), monospace; color: var(--ink); }
      `}</style>

      <header className="dp-nav">
        <div className="dp-nav-row">
          <Link href="/" className="dp-brand" aria-label="LMCT PRO home">
            <Logo size={32} tone="ink" />
          </Link>
          <Link href="/" className="dp-back">← Back to home</Link>
        </div>
      </header>

      <main className="dp-wrap">
        <div className="dp-grid">
          <div>
            <p className="dp-kicker">Book a demo</p>
            <h1 className="dp-title">See LMCT PRO <em>run your yard.</em></h1>
            <p className="dp-lede">
              Fifteen minutes on a screenshare. Bring three or four cars from your
              own stock — we&rsquo;ll add them in front of you, draft a listing,
              and walk through the VP151 transfer end to end.
            </p>

            <div className="dp-expect">
              <Expect n="01" body="One of the team, not a sales rep. We screenshare from a real dealership account." />
              <Expect n="02" body="Bring your toughest car. Aged stock, missing rego, picky buyer — let's see what LMCT PRO does with it." />
              <Expect n="03" body="You'll leave with a trial workspace, your data loaded in if you want, and zero pressure." />
            </div>
          </div>

          <div className="dp-card">
            <DemoForm />
          </div>
        </div>
      </main>
    </div>
  )
}

function Expect({ n, body }: { n: string; body: string }) {
  return (
    <div className="dp-expect-item">
      <span className="dp-expect-num">{n}</span>
      <span className="dp-expect-body">{body}</span>
    </div>
  )
}
