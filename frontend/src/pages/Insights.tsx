import { Bot, Send, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Card, DataBadge, PageHeader, Spinner } from '../components/ui'
import type { AssistantAnswer } from '../services/api'
import { useStore } from '../services/store'

const SUGGEST = ['What is changing in this region?', 'Explain the temperature trend in this region.', 'Is this increase statistically significant?', 'Which region is changing the fastest?', 'How does this region compare with another region?', 'Why is this trend important?', 'What environmental variables should I investigate next?']

function Answer({ a }: { a: AssistantAnswer }) {
  const Sec = ({ t, items }: { t: string; items: string[] }) => items.length ? <div className="mt-3"><div className="label mb-1">{t}</div><ul className="list-disc space-y-1 pl-5 text-sm text-ink/90">{items.map((x, i) => <li key={i}>{x}</li>)}</ul></div> : null
  return (<div><div className="font-display text-base font-semibold">{a.short_answer}</div>
    <Sec t="Key evidence" items={a.key_evidence} /><Sec t="Statistical context" items={a.statistical_context} /><Sec t="Limitations" items={a.limitations} /><Sec t="Suggested next investigation" items={a.next_steps} />
    <div className="mt-3 text-[10px] uppercase tracking-wider text-neutral">Engine: {a.engine}</div></div>)
}

export default function Insights() {
  const { chat, ask, asking, clearChat, analysis } = useStore()
  const [q, setQ] = useState('')
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }) }, [chat.length, asking])
  const submit = (t: string) => { if (!t.trim() || asking) return; setQ(''); ask(t) }
  return (
    <div>
      <PageHeader title="GEO-FLEX Intelligence" subtitle="Ask about your analysis. Answers are generated from the statistics actually computed — no invented findings, and no paid API required."
        actions={chat.length > 0 ? <button className="btn-ghost" onClick={clearChat}><Trash2 className="h-4 w-4" />Clear</button> : undefined} />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="flex h-[620px] flex-col" pad={false}>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {chat.length === 0 && <div className="flex h-full flex-col items-center justify-center text-center text-neutral"><Bot className="mb-3 h-9 w-9 text-cyan" /><p className="max-w-sm text-sm">{analysis ? 'Ask a question about the current analysis, or pick a suggestion.' : 'No analysis is loaded yet. Run one first — otherwise answers can only be general.'}</p></div>}
              {chat.map((m) => (
                <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : ''}>
                  <div className={`max-w-[92%] rounded-2xl px-4 py-3 ${m.role === 'user' ? 'bg-cyan text-bg' : 'border border-line bg-white/[0.03]'}`}>{m.role === 'user' ? <span className="text-sm font-medium">{m.text}</span> : m.answer ? <Answer a={m.answer} /> : <span className="text-sm text-neg">{m.text}</span>}</div>
                </div>))}
              {asking && <div className="flex items-center gap-2 text-sm text-neutral"><Spinner />Reading the computed statistics…</div>}
              <div ref={end} />
            </div>
            <form className="flex gap-2 border-t border-line p-3" onSubmit={(e) => { e.preventDefault(); submit(q) }}>
              <input className="input" placeholder="Ask about this trend…" value={q} maxLength={500} onChange={(e) => setQ(e.target.value)} aria-label="Question" />
              <button className="btn-primary" type="submit" disabled={asking || !q.trim()} aria-label="Send"><Send className="h-4 w-4" /></button>
            </form>
          </Card>
        </div>
        <div className="space-y-4">
          <Card><div className="label mb-2">Context</div>
            {analysis ? <><div className="text-sm font-medium">{analysis.variable.name} · {analysis.region}</div><div className="text-xs text-neutral">{analysis.period.start} → {analysis.period.end} · {analysis.classification.label}</div><div className="mt-2"><DataBadge status={analysis.provenance.status} compact /></div></> : <div className="text-sm text-neutral">None loaded.</div>}</Card>
          <Card><div className="label mb-2">Suggested questions</div><div className="flex flex-col gap-2">{SUGGEST.map((s) => <button key={s} onClick={() => submit(s)} disabled={asking} className="rounded-xl border border-line px-3 py-2 text-left text-sm text-ink/90 hover:border-cyan/50 hover:bg-white/[0.04] disabled:opacity-50">{s}</button>)}</div></Card>
        </div>
      </div>
    </div>
  )
}
