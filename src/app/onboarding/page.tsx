'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [homeName, setHomeName] = useState('')
  const [address, setAddress] = useState('')
  const [butlerName, setButlerName] = useState('Alfred')

  async function finish() {
    setLoading(true)
    setError('')
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      setError('Not logged in: ' + (userError?.message || 'no user'))
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ butler_name: butlerName })
      .eq('id', user.id)
    
    if (profileError) {
      setError('Profile error: ' + profileError.message)
      setLoading(false)
      return
    }

    const { data: property, error: propError } = await supabase
      .from('properties')
      .insert({ owner_id: user.id, name: homeName || 'My Home', address, type: 'Single family', emoji: '🏠' })
      .select()
      .single()

    if (propError || !property) {
      setError('Property error: ' + (propError?.message || 'no property'))
      setLoading(false)
      return
    }

    await supabase.from('property_members').insert({ property_id: property.id, user_id: user.id, role: 'owner' })
    await supabase.from('tasks').insert([
      { property_id: property.id, name: 'Replace HVAC filter', area: 'HVAC', due_date: addDays(90), recur: '3 months' },
      { property_id: property.id, name: 'Test smoke detectors', area: 'Safety', due_date: addDays(180), recur: '6 months' },
    ])

    router.push('/dashboard')
  }

  return (
    <div style={{minHeight:'100vh',background:'#faf7f2',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}}>
      <div style={{width:'100%',maxWidth:'480px'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{fontSize:'40px',marginBottom:'8px'}}>🏡</div>
          <div style={{fontFamily:'Georgia,serif',fontSize:'24px',fontWeight:'600',marginBottom:'4px'}}>Welcome to HomeButler</div>
        </div>

        {error && (
          <div style={{background:'#f5e8e8',border:'1px solid #d0a0a0',borderRadius:'8px',padding:'12px',marginBottom:'16px',fontSize:'12px',color:'#8b3a3a'}}>
            {error}
          </div>
        )}

        {step === 1 && (
          <div style={{background:'white',border:'1px solid #ece8e0',borderRadius:'13px',padding:'24px',marginBottom:'16px'}}>
            <div style={{fontFamily:'Georgia,serif',fontSize:'20px',fontWeight:'500',marginBottom:'16px'}}>Tell us about your home</div>
            <div style={{marginBottom:'12px'}}>
              <div style={{fontSize:'11px',fontWeight:'500',color:'#9a9488',textTransform:'uppercase',marginBottom:'4px'}}>Home name</div>
              <input value={homeName} onChange={e=>setHomeName(e.target.value)} placeholder="e.g. Our House" style={{width:'100%',padding:'9px 11px',border:'1px solid #ece8e0',borderRadius:'8px',fontSize:'13px',background:'#faf7f2',outline:'none'}}/>
            </div>
            <div style={{marginBottom:'16px'}}>
              <div style={{fontSize:'11px',fontWeight:'500',color:'#9a9488',textTransform:'uppercase',marginBottom:'4px'}}>Address</div>
              <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="123 Main St, City, State" style={{width:'100%',padding:'9px 11px',border:'1px solid #ece8e0',borderRadius:'8px',fontSize:'13px',background:'#faf7f2',outline:'none'}}/>
            </div>
            <button type="button" onClick={() => setStep(2)} style={{width:'100%',padding:'11px',border:'none',borderRadius:'8px',background:'#1a1a18',color:'white',fontSize:'13px',fontWeight:'600',cursor:'pointer'}}>
              Continue →
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{background:'white',border:'1px solid #ece8e0',borderRadius:'13px',padding:'24px',marginBottom:'16px'}}>
            <div style={{fontFamily:'Georgia,serif',fontSize:'20px',fontWeight:'500',marginBottom:'16px'}}>Name your butler</div>
            <div style={{marginBottom:'16px'}}>
              <div style={{fontSize:'11px',fontWeight:'500',color:'#9a9488',textTransform:'uppercase',marginBottom:'4px'}}>Butler name</div>
              <input value={butlerName} onChange={e=>setButlerName(e.target.value||'Alfred')} placeholder="e.g. Alfred" style={{width:'100%',padding:'9px 11px',border:'1px solid #ece8e0',borderRadius:'8px',fontSize:'13px',background:'#faf7f2',outline:'none'}}/>
            </div>
            {error && <div style={{color:'#8b3a3a',fontSize:'12px',marginBottom:'8px'}}>{error}</div>}
            <div style={{display:'flex',gap:'8px'}}>
              <button type="button" onClick={()=>setStep(1)} style={{flex:1,padding:'11px',border:'1px solid #ece8e0',borderRadius:'8px',background:'#faf7f2',color:'#1a1a18',fontSize:'13px',cursor:'pointer'}}>← Back</button>
              <button type="button" onClick={finish} disabled={loading} style={{flex:2,padding:'11px',border:'none',borderRadius:'8px',background:'#c9a84c',color:'#1a1a18',fontSize:'13px',fontWeight:'600',cursor:'pointer'}}>
                {loading ? 'Setting up…' : `Enter with ${butlerName} →`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function addDays(n: number): string {
  const dt = new Date()
  dt.setDate(dt.getDate() + n)
  return dt.toISOString().split('T')[0]
}