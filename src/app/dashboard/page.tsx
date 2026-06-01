'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Property {
  id: string
  name: string
  address: string
  emoji: string
  purchase_date: string
  purchase_price: number
  year_built: string
}

interface Task {
  id: string
  name: string
  area: string
  due_date: string
  recur: string
  done: boolean
}

interface Profile {
  name: string
  butler_name: string
  butler_trait: string
  plan: string
}

const AVATARS: Record<string, string> = {
  formal: '🎩', friendly: '😊', concise: '⚡', witty: '😄'
}

function tod() {
  const h = new Date().getHours()
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
}

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - new Date().setHours(0,0,0,0)) / 864e5)
}

function fD(date: string) {
  if (!date) return '—'
  const [y, m, d] = date.split('-')
  return `${m}/${d}/${y}`
}

function cur(n: number) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0 })
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [property, setProperty] = useState<Property | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const { data: prof } = await supabase.from('profiles').select('name, butler_name, butler_trait, plan').eq('id', user.id).single()
    setProfile(prof)
    const { data: props } = await supabase.from('properties').select('*').eq('owner_id', user.id).limit(1)
    if (props && props.length > 0) {
      setProperty(props[0])
      const { data: taskData } = await supabase.from('tasks').select('*').eq('property_id', props[0].id).eq('done', false).order('due_date', { ascending: true })
      setTasks(taskData || [])
    }
    setLoading(false)
  }

  async function completeTask(taskId: string) {
    await supabase.from('tasks').update({ done: true }).eq('id', taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex gap-1.5">
        <div className="loading-dot dot-1" />
        <div className="loading-dot dot-2" />
        <div className="loading-dot dot-3" />
      </div>
    </div>
  )

  if (!property) return (
    <div className="text-center py-16">
      <div className="text-4xl mb-4">🏡</div>
      <h2 className="font-serif text-xl font-medium mb-2">No property found</h2>
      <p className="text-muted mb-4">Let's set up your home.</p>
      <button onClick={() => router.push('/onboarding')} className="btn btn-gold">Set up my home →</button>
    </div>
  )

  const bname = profile?.butler_name || 'Alfred'
  const btrait = profile?.butler_trait || 'formal'
  const bav = AVATARS[btrait]
  const overdue = tasks.filter(t => daysUntil(t.due_date) < 0)
  const upcoming = tasks.filter(t => daysUntil(t.due_date) >= 0 && daysUntil(t.due_date) <= 30)

  const greetings: Record<string, string> = {
    formal:   `Good ${tod()}. ${overdue.length > 0 ? `You have ${overdue.length} task${overdue.length !== 1 ? 's' : ''} requiring attention.` : 'Your home is in excellent order.'}`,
    friendly: `Hey! 👋 ${overdue.length > 0 ? `You've got ${overdue.length} task${overdue.length !== 1 ? 's' : ''} coming up!` : 'Everything looks great! 🎉'}`,
    concise:  `${overdue.length > 0 ? `${overdue.length} task${overdue.length !== 1 ? 's' : ''} due.` : 'All clear.'}`,
    witty:    `Good ${tod()}! ${overdue.length > 0 ? `${overdue.length} task${overdue.length !== 1 ? 's' : ''} that won't fix themselves.` : 'Suspiciously well-maintained. Enjoy it.'}`,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{property.emoji}</div>
          <div>
            <h1 className="font-serif text-xl font-medium">{property.name}</h1>
            <div className="text-sm text-muted">
              {property.address}
              {property.purchase_date && ` · Bought ${fD(property.purchase_date)}`}
              {property.purchase_price && ` for ${cur(property.purchase_price)}`}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-purple-light border border-[#d0b8f0] rounded-card p-4 mb-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-purple flex items-center justify-center text-base flex-shrink-0">{bav}</div>
        <div>
          <div className="text-[11px] font-medium text-purple mb-1">{bname}</div>
          <div className="text-sm text-purple leading-relaxed">{greetings[btrait]}</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          [overdue.length, 'Overdue', overdue.length > 0 ? 'text-amber' : 'text-green'],
          [upcoming.length, 'Due soon', 'text-dark'],
          [tasks.length, 'Total tasks', 'text-dark'],
          [profile?.plan === 'pro' ? 'Pro ⭐' : 'Free', 'Plan', 'text-gold'],
        ].map(([val, label, color]) => (
          <div key={label as string} className="card text-center">
            <div className={`font-serif text-2xl font-semibold ${color}`}>{val}</div>
            <div className="text-[10px] text-muted uppercase tracking-wide mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="card">
          <h3 className="font-serif text-sm font-medium mb-3">⚠️ Needs Attention</h3>
          {overdue.length === 0
            ? <p className="text-muted text-sm">All clear! 🎉</p>
            : overdue.slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center gap-2 py-2 border-b border-border last:border-0">
                <button onClick={() => completeTask(t.id)} className="w-4 h-4 rounded border-2 border-border flex-shrink-0 hover:border-gold transition-colors" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium truncate">{t.name}</div>
                  <div className="text-[10px] text-muted">{Math.abs(daysUntil(t.due_date))}d overdue</div>
                </div>
              </div>
            ))
          }
        </div>

        <div className="card">
          <h3 className="font-serif text-sm font-medium mb-3">📅 Next 30 days</h3>
          {upcoming.length === 0
            ? <p className="text-muted text-sm">Nothing scheduled</p>
            : upcoming.slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center gap-2 py-2 border-b border-border last:border-0">
                <button onClick={() => completeTask(t.id)} className="w-4 h-4 rounded border-2 border-border flex-shrink-0 hover:border-gold transition-colors" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium truncate">{t.name}</div>
                  <div className="text-[10px] text-muted">in {daysUntil(t.due_date)}d</div>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card" style={{background:'#fffbf0', borderColor:'#e8d5a3'}}>
          <h3 className="font-serif text-sm font-medium mb-2" style={{color:'#a0620a'}}>🗄️ Document Vault</h3>
          <p className="text-[11px] mb-3 leading-relaxed" style={{color:'#a0620a', opacity:0.8}}>Store warranties, manuals, insurance policies and more.</p>
          <a href="/dashboard/vault" className="btn btn-sm" style={{background:'#e8d5a3', color:'#a0620a'}}>Open vault →</a>
        </div>
        <div className="card" style={{background:'#f0fff4', borderColor:'#a8d8b8'}}>
          <h3 className="font-serif text-sm font-medium mb-2 text-green">🔑 Home Sale</h3>
          <p className="text-[11px] text-green mb-3 leading-relaxed" style={{opacity:0.8}}>Transfer your complete home record to the new owner.</p>
          <a href="/dashboard/sale" className="btn btn-green btn-sm">Prepare →</a>
        </div>
        <div className="card" style={{background:'#f0e8f8', borderColor:'#d0b8f0'}}>
          <h3 className="font-serif text-sm font-medium mb-2 text-purple">✨ Ask {bname}</h3>
          <p className="text-[11px] text-purple mb-3 leading-relaxed" style={{opacity:0.8}}>Describe any home problem for instant guidance.</p>
          <a href="/dashboard/ai" className="btn btn-purple btn-sm">Open →</a>
        </div>
      </div>
    </div>
  )
}
