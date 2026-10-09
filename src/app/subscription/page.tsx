'use client'

// src/app/subscription/page.tsx
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Crown, ShieldCheck, Sparkles } from 'lucide-react'

const plans = [
  { name: 'Monthly', price: 'Coming soon', period: 'per month', hook: 'Start anytime. No commitment.', features: ['Full practice modes', 'Performance analytics', 'Personalized preparation'], featured: false },
  { name: 'Quarterly', price: 'Coming soon', period: 'per 3 months', hook: 'Serious preparation. Better value.', features: ['Everything in Monthly', 'Longer preparation runway', 'Progress tracking'], featured: true },
  { name: 'Yearly', price: 'Coming soon', period: 'per year', hook: 'Full exam cycle. Best value.', features: ['Everything in Quarterly', 'Full-cycle preparation', 'One plan for the long run'], featured: false },
]
export default function SubscriptionPage() {
  const router = useRouter()
  return <main style={{ minHeight: '100svh', background: '#071426', color: '#E8F0F7', padding: '24px 16px calc(40px + env(safe-area-inset-bottom))' }}>
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      <button onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 0', color: '#8FA2B7', fontSize: 12 }}><ArrowLeft size={15}/> Back</button>
      <header style={{ marginTop: 18, marginBottom: 23 }}>
        <p style={{ margin: 0, color: '#A78BFA', fontSize: 10, fontWeight: 800, letterSpacing: '.13em' }}>YOUR PREPARATION PLAN</p>
        <h1 style={{ margin: '7px 0 0', fontSize: 30, lineHeight: 1.1, letterSpacing: '-.045em' }}>Subscription</h1>
        <p style={{ margin: '10px 0 0', maxWidth: 390, color: '#8FA2B7', fontSize: 13, lineHeight: 1.6 }}>One clear place to understand your plan and choose how you want to prepare.</p>
      </header>

      <section style={{ padding: 17, borderRadius: 16, border: '1px solid rgba(167,139,250,.23)', background: 'linear-gradient(135deg,rgba(167,139,250,.12),#0D1B2E 70%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 12, background: 'rgba(167,139,250,.15)', color: '#C4B5FD' }}><Crown size={20}/></span>
          <div style={{ flex: 1 }}><p style={{ margin: 0, color: '#A78BFA', fontSize: 10, fontWeight: 800, letterSpacing: '.08em' }}>CURRENT PLAN</p><h2 style={{ margin: '4px 0 0', fontSize: 17 }}>Free plan</h2></div>
          <span style={{ padding: '5px 8px', borderRadius: 7, background: 'rgba(37,214,162,.1)', color: '#25D6A2', fontSize: 10, fontWeight: 750 }}>ACTIVE</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginTop: 17, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.07)' }}>
          <div><p style={{ margin: 0, color: '#8FA2B7', fontSize: 10 }}>Plan started</p><p style={{ margin: '5px 0 0', fontSize: 12, fontWeight: 700 }}>Current account</p></div>
          <div><p style={{ margin: 0, color: '#8FA2B7', fontSize: 10 }}>Billing status</p><p style={{ margin: '5px 0 0', fontSize: 12, fontWeight: 700 }}>No active billing</p></div>
        </div>
      </section>

      <section style={{ marginTop: 26 }}>
        <div style={{ marginBottom: 13 }}><h2 style={{ margin: 0, fontSize: 18, letterSpacing: '-.025em' }}>Choose your plan</h2><p style={{ margin: '5px 0 0', color: '#8FA2B7', fontSize: 11 }}>Pricing will appear here when plans are ready to purchase.</p></div>
        <div style={{ display: 'grid', gap: 11 }}>
          {plans.map(plan => <article key={plan.name} style={{ padding: 16, borderRadius: 15, border: '1px solid ' + (plan.featured ? 'rgba(167,139,250,.4)' : 'rgba(255,255,255,.08)'), background: plan.featured ? 'linear-gradient(145deg,rgba(167,139,250,.09),#0D1B2E 60%)' : '#0D1B2E' }}>
            <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 12 }}>
              <div><h3 style={{ margin: 0, fontSize: 15 }}>{plan.name}</h3><p style={{ margin: '5px 0 0', color: '#8FA2B7', fontSize: 11 }}>{plan.hook}</p></div>
              {plan.featured && <span style={{ padding: '5px 7px', borderRadius: 6, background: 'rgba(167,139,250,.14)', color: '#C4B5FD', fontSize: 9, fontWeight: 800 }}>POPULAR</span>}
            </div>
            <p style={{ margin: '17px 0 2px', fontSize: 18, fontWeight: 800 }}>{plan.price}</p><p style={{ margin: 0, color: '#718399', fontSize: 10 }}>{plan.period}</p>
            <div style={{ display: 'grid', gap: 9, marginTop: 16 }}>
              {plan.features.map(feature => <div key={feature} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#B5C3D1', fontSize: 11 }}><Check size={14} color="#25D6A2"/>{feature}</div>)}
            </div>
            <button disabled style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 7, marginTop: 17, padding: 12, borderRadius: 10, background: plan.featured ? '#A78BFA' : '#162538', color: plan.featured ? '#0B1020' : '#8FA2B7', fontSize: 12, fontWeight: 750, opacity: .8 }}>Coming soon <ArrowRight size={14}/></button>
          </article>)}
        </div>
      </section>
      <p style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 22, color: '#718399', fontSize: 10 }}><ShieldCheck size={13}/> No payment is taken from this screen.</p>
    </div>
  </main>
}
