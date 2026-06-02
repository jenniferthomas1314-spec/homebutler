'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const TRAITS = [
  { id: 'formal',   e: '🎩', name: 'Formal',   desc: 'Proper, dignified, precise' },
  { id: 'friendly', e: '😊', name: 'Friendly', desc: 'Warm, casual, encouraging' },
  { id: 'concise',  e: '⚡', name: 'Concise',  desc: 'Brief, direct, no fluff' },
  { id: 'witty',    e: '😄', name: 'Witty',    desc: 'Clever, light humor' },
]
const BUTLER_NAMES = ['Alfred', 'Reginald', 'Winston', 'Chester', 'Maxim', 'Jasper', 'Edmund', 'Vivienne', 'Estelle', 'Clive']
const AVATAR = { formal: '🎩', friendly: '😊', concise: '⚡', witty: '😄' }

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [butlerName, setButlerName] = useState('Alfred')
  const [butlerTrait, setButlerTrait] = useState('formal')
  const [userName, setUserName] = useState('')
  const [plan, setPlan] = useState('free')
  const [amazonTag, setAmazonTag] = useState('')
  const [hdTag, setHdTag] = useState('')
  const [walmartTag, setWalmartTag] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, butler_name, butler_trait, plan, affiliate_tags')
      .eq('id', user.id)
      .single()
    if (profile) {
      setButlerName(profile.butler_name || 'Alfred')
      setButlerTrait(profile.butler_trait || 'formal')
      setUserName(profile.name || '')
      setPlan(profile.plan || 'free')
      const tags = profile.affiliate_tags || {}
      setAmazonTag(tags.amazon || '')
      setHdTag(tags.homedepot || '')
      setWalmartTag(tags.walmart || '')
    }
    setLoading(false)
  }

  async function saveSettings() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({
      name: userName,
      butler_name: butlerName,
      butler_trait: butlerTrait,
      affiliate_tags: { amazon: amazonTag, homedepot: hdTag, walmart: walmartTag },
    }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200}}>
      <div>Loading…</div>
    </div>
  )

  return (
    <div style={{maxWidth:600, margin:'0 auto'}}>
      <div style={{fontFamily:'Georgia,serif', fontSize:24, fontWeight:500, marginBottom:24}}>Settings</div>

      <div style={{background:'#f0e8f8', border:'1.5px solid #d0b8f0', borderRadius:13, padding:20, marginBottom:16, display:'flex', alignItems:'center', gap:16}}>
        <div style={{width:52, height:52, borderRadius:'50%', background:'#4a2a6a', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0}}>
          {AVATAR[butlerTrait as keyof typeof AVATAR]}
        </div>
        <div>
          <div style={{fontFamily:'Georgia,serif', fontSize:20, fontWeight:500, color:'#4a2a6a'}}>{butlerName}</div>
          <div style={{fontSize:12, color:'#4a2a6a', opacity:.7, marginTop:2}}>{TRAITS.find(t => t.id === butlerTrait)?.name} · Your home butler</div>
        </div>
      </div>

      <div style={{background:'white', border:'1px solid #ece8e0', borderRadius:13, padding:20, marginBottom:16}}>
        <div style={{fontFamily:'Georgia,serif', fontSize:16, fontWeight:500, marginBottom:16}}>Your Info</div>
        <div style={{marginBottom:8}}>
          <div style={{fontSize:10, fontWeight:500, color:'#9a9488', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4}}>Your name</div>
          <input value={userName} onChange={e => setUserName(e.target.value)} placeholder="e.g. Jennifer" style={{width:'100%', padding:'8px 10px', border:'1px solid #ece8e0', borderRadius:7, fontSize:13, background:'#faf7f2', outline:'none'}}/>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:8, marginTop:12}}>
          <span style={{fontSize:13, color:'#9a9488'}}>Plan:</span>
          <span style={{background:plan==='pro'?'#fff3cd':'#ece8e0', color:plan==='pro'?'#856404':'#9a9488', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600}}>{plan==='pro'?'⭐ Pro':'Free'}</span>
          {plan === 'free' && <a href="/pricing" style={{fontSize:11, color:'#c9a84c', fontWeight:500, textDecoration:'underline'}}>Upgrade to Pro →</a>}
        </div>
      </div>

      <div style={{background:'white', border:'1px solid #ece8e0', borderRadius:13, padding:20, marginBottom:16}}>
        <div style={{fontFamily:'Georgia,serif', fontSize:16, fontWeight:500, marginBottom:16}}>Butler Name</div>
        <input value={butlerName} onChange={e => setButlerName(e.target.value || 'Alfred')} placeholder="Name your butler" maxLength={20} style={{width:'100%', padding:'10px 14px', border:'2px solid #ece8e0', borderRadius:10, fontFamily:'Georgia,serif', fontSize:18, textAlign:'center', background:'#faf7f2', outline:'none', marginBottom:10}}/>
        <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
          {BUTLER_NAMES.map(n => (
            <button key={n} type="button" onClick={() => setButlerName(n)} style={{padding:'4px 11px', borderRadius:20, border:`1.5px solid ${butlerName===n?'#1a1a18':'#ece8e0'}`, background:butlerName===n?'#1a1a18':'white', color:butlerName===n?'white':'#1a1a18', fontSize:11, fontWeight:500, cursor:'pointer'}}>{n}</button>
          ))}
        </div>
      </div>

      <div style={{background:'white', border:'1px solid #ece8e0', borderRadius:13, padding:20, marginBottom:16}}>
        <div style={{fontFamily:'Georgia,serif', fontSize:16, fontWeight:500, marginBottom:16}}>Personality</div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
          {TRAITS.map(t => (
            <button key={t.id} type="button" onClick={() => setButlerTrait(t.id)} style={{border:`1.5px solid ${butlerTrait===t.id?'#1a1a18':'#ece8e0'}`, borderRadius:11, padding:12, textAlign:'left', background:butlerTrait===t.id?'white':'#faf7f2', cursor:'pointer', boxShadow:butlerTrait===t.id?'0 0 0 1px #1a1a18':'none'}}>
              <div style={{fontSize:18, marginBottom:3}}>{t.e}</div>
              <div style={{fontSize:12, fontWeight:500}}>{t.name}</div>
              <div style={{fontSize:10, color:'#9a9488', marginTop:2}}>{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <button type="button" onClick={saveSettings} disabled={saving} style={{width:'100%', padding:12, border:'none', borderRadius:9, background:saved?'#2d5a3d':'#c9a84c', color:saved?'white':'#1a1a18', fontSize:14, fontWeight:600, cursor:'pointer', marginBottom:12, transition:'all .2s'}}>
        {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save settings'}
      </button>

      <button type="button" onClick={handleSignOut} style={{width:'100%', padding:10, border:'1px solid #ece8e0', borderRadius:9, background:'white', color:'#9a9488', fontSize:12, fontWeight:500, cursor:'pointer'}}>
        Sign out
      </button>
    </div>
  )
}
