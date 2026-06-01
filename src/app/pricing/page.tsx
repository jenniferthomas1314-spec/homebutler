// src/app/pricing/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'

const FREE_FEATURES = [
  '1 property',
  'Up to 10 documents in vault',
  'Up to 20 tasks',
  '5 AI butler messages/day',
  'Fix It wizard (all 12 guides)',
  'Parts finder with affiliate links',
  'Seasonal checklists',
  'Cost tracker',
]

const PRO_FEATURES = [
  'Unlimited properties',
  'Unlimited documents',
  'Unlimited tasks',
  'Unlimited AI butler messages',
  '🔑 Home sale transfer package',
  'Real file uploads (PDFs, photos)',
  'Multi-user household sharing',
  'Priority support',
  'Early access to new features',
]

export default function PricingPage() {
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly')
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl">

        <div className="text-center mb-10">
          <Link href="/dashboard" className="text-muted text-sm hover:text-dark">← Back to app</Link>
          <h1 className="font-serif text-3xl font-semibold mt-4 mb-2">Simple, honest pricing</h1>
          <p className="text-muted">14-day free trial on Pro. No credit card required to start.</p>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className={`text-sm ${plan === 'monthly' ? 'text-dark font-medium' : 'text-muted'}`}>Monthly</span>
          <button
            onClick={() => setPlan(p => p === 'monthly' ? 'yearly' : 'monthly')}
            className={`relative w-12 h-6 rounded-full transition-colors ${plan === 'yearly' ? 'bg-green' : 'bg-border'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${plan === 'yearly' ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
          <span className={`text-sm ${plan === 'yearly' ? 'text-dark font-medium' : 'text-muted'}`}>
            Yearly <span className="text-green text-xs font-semibold">Save 32%</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Free */}
          <div className="card">
            <div className="mb-6">
              <h2 className="font-serif text-xl font-medium mb-1">Free</h2>
              <div className="text-3xl font-serif font-semibold">$0</div>
              <div className="text-muted text-sm">Forever free</div>
            </div>
            <ul className="space-y-2.5 mb-6">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm">
                  <Check size={14} className="text-green flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/auth/login" className="btn btn-ghost w-full justify-center">
              Get started free
            </Link>
          </div>

          {/* Pro */}
          <div className="card border-2 border-gold relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-dark text-xs font-semibold px-3 py-1 rounded-pill">
              Most popular
            </div>
            <div className="mb-6">
              <h2 className="font-serif text-xl font-medium mb-1">Pro</h2>
              <div className="text-3xl font-serif font-semibold">
                {plan === 'yearly' ? '$49' : '$6'}
              </div>
              <div className="text-muted text-sm">
                {plan === 'yearly' ? 'per year (~$4.08/mo)' : 'per month'}
              </div>
            </div>
            <ul className="space-y-2.5 mb-6">
              <li className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Everything in Free, plus:</li>
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm">
                  <Check size={14} className="text-green flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="btn btn-gold btn-lg w-full justify-center"
            >
              {loading ? '…' : 'Start 14-day free trial →'}
            </button>
            <p className="text-center text-xs text-muted mt-2">No credit card required · Cancel anytime</p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 max-w-2xl mx-auto">
          <h3 className="font-serif text-xl font-medium mb-6 text-center">Common questions</h3>
          <div className="space-y-4">
            {[
              ['Can I switch plans?', 'Yes — upgrade or downgrade any time. If you downgrade from Pro to Free, your data is preserved but features are limited.'],
              ['What happens to my data if I cancel?', 'Your data stays safe for 90 days after cancellation. You can export it all anytime from the Home Sale Transfer page.'],
              ['Is there a family plan?', 'Pro supports unlimited household members on all your properties, so one Pro subscription covers everyone.'],
              ['Do you offer refunds?', 'Yes — full refund within 30 days, no questions asked.'],
            ].map(([q, a]) => (
              <details key={q as string} className="card cursor-pointer group">
                <summary className="font-medium text-sm list-none flex items-center justify-between">
                  {q}
                  <span className="text-muted group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="text-muted text-sm mt-3 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
