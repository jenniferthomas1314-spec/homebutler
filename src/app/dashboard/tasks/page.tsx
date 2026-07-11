'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Task {
  id: string
  name: string
  area: string
  due_date: string
  recur: string
  done: boolean
  notes: string
}

interface Property {
  id: string
  name: string
}

const AREAS = ['HVAC', 'Plumbing', 'Electrical', 'Exterior', 'Safety', 'Appliance', 'General', 'Other']
const RECUR_OPTIONS = ['One-time', '1 month', '3 months', '6 months', '12 months']

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - new Date().setHours(0,0,0,0)) / 864e5)
}

function fD(date: string) {
  if (!date) return '—'
  const [y, m, d] = date.split('-')
  return `${m}/${d}/${y}`
}

function addDays(n: number): string {
  const dt = new Date()
  dt.setDate(dt.getDate() + n)
  return dt.toISOString().split('T')[0]
}

function addDaysFromDate(date: string, n: number): string {
  const dt = new Date(date)
  dt.setDate(dt.getDate() + n)
  return dt.toISOString().split('T')[0]
}

const RECUR_DAYS: Record<string, number> = {
  '1 month': 30, '3 months': 90, '6 months': 180, '12 months': 365
}

export default function TasksPage() {
  const router = useRouter()
  const supabase = createClient()
  const [tasks, setTasks] = useState<Task[]>([])
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [taskName, setTaskName] = useState('')
  const [taskArea, setTaskArea] = useState('General')
  const [taskDue, setTaskDue] = useState(addDays(30))
  const [taskRecur, setTaskRecur] = useState('One-time')
  const [taskNotes, setTaskNotes] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    const { data: props } = await supabase.from('properties').select('id, name').eq('owner_id', user.id).limit(1)
    if (props && props.length > 0) {
      setProperty(props[0])
      const { data: taskData } = await supabase.from('tasks').select('*').eq('property_id', props[0].id).order('due_date', { ascending: true })
      setTasks(taskData || [])
    }
    setLoading(false)
  }

  async function completeTask(task: Task) {
    const recurDays = RECUR_DAYS[task.recur]
    if (recurDays) {
      const newDue = addDaysFromDate(task.due_date, recurDays)
      await supabase.from('tasks').update({ due_date: newDue }).eq('id', task.id)
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, due_date: newDue } : t))
    } else {
      await supabase.from('tasks').update({ done: true }).eq('id', task.id)
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: true } : t))
    }
  }

  async function deleteTask(taskId: string) {
    await supabase.from('tasks').delete().eq('id', taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  async function addTask() {
    if (!taskName.trim() || !property) return
    setSaving(true)
    const { data } = await supabase.from('tasks').insert({
      property_id: property.id,
      name: taskName.trim(),
      area: taskArea,
      due_date: taskDue,
      recur: taskRecur === 'One-time' ? '' : taskRecur,
      done: false,
      notes: taskNotes,
    }).select().single()
    if (data) setTasks(prev => [...prev, data])
    setTaskName(''); setTaskArea('General'); setTaskDue(addDays(30)); setTaskRecur('One-time'); setTaskNotes('')
    setShowForm(false)
    setSaving(false)
  }

  let filtered = tasks
  if (filter === 'pending') filtered = tasks.filter(t => !t.done && daysUntil(t.due_date) >= 0)
  else if (filter === 'overdue') filtered = tasks.filter(t => !t.done && daysUntil(t.due_date) < 0)
  else if (filter === 'done') filtered = tasks.filter(t => t.done)

  if (loading) return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:200}}>
      <div>Loading…</div>
    </div>
  )

  return (
    <div style={{maxWidth:700, margin:'0 auto'}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10}}>
        <div style={{fontFamily:'Georgia,serif', fontSize:24, fontWeight:500}}>✓ Maintenance Tasks</div>
        <button type="button" onClick={() => setShowForm(!showForm)} style={{padding:'8px 16px', border:'none', borderRadius:9, background:'#c9a84c', color:'#1a1a18', fontSize:13, fontWeight:600, cursor:'pointer'}}>
          {showForm ? '✕ Cancel' : '+ Add Task'}
        </button>
      </div>

      {/* Add task form */}
      {showForm && (
        <div style={{background:'white', border:'1px solid #ece8e0', borderRadius:13, padding:20, marginBottom:16}}>
          <div style={{fontFamily:'Georgia,serif', fontSize:16, fontWeight:500, marginBottom:14}}>New Task</div>
          <div style={{marginBottom:10}}>
            <div style={{fontSize:10, fontWeight:500, color:'#9a9488', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4}}>Task name</div>
            <input value={taskName} onChange={e => setTaskName(e.target.value)} placeholder="e.g. Replace HVAC filter" style={{width:'100%', padding:'8px 10px', border:'1px solid #ece8e0', borderRadius:7, fontSize:13, background:'#faf7f2', outline:'none'}}/>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10}}>
            <div>
              <div style={{fontSize:10, fontWeight:500, color:'#9a9488', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4}}>Area</div>
              <select value={taskArea} onChange={e => setTaskArea(e.target.value)} style={{width:'100%', padding:'8px 10px', border:'1px solid #ece8e0', borderRadius:7, fontSize:13, background:'#faf7f2', outline:'none'}}>
                {AREAS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:10, fontWeight:500, color:'#9a9488', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4}}>Due date</div>
              <input type="date" value={taskDue} onChange={e => setTaskDue(e.target.value)} style={{width:'100%', padding:'8px 10px', border:'1px solid #ece8e0', borderRadius:7, fontSize:13, background:'#faf7f2', outline:'none'}}/>
            </div>
          </div>
          <div style={{marginBottom:10}}>
            <div style={{fontSize:10, fontWeight:500, color:'#9a9488', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4}}>Recurrence</div>
            <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
              {RECUR_OPTIONS.map(r => (
                <button key={r} type="button" onClick={() => setTaskRecur(r)} style={{padding:'5px 12px', borderRadius:20, border:`1.5px solid ${taskRecur===r?'#1a1a18':'#ece8e0'}`, background:taskRecur===r?'#1a1a18':'white', color:taskRecur===r?'white':'#1a1a18', fontSize:11, fontWeight:500, cursor:'pointer'}}>{r}</button>
              ))}
            </div>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10, fontWeight:500, color:'#9a9488', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:4}}>Notes (optional)</div>
            <input value={taskNotes} onChange={e => setTaskNotes(e.target.value)} placeholder="Any notes…" style={{width:'100%', padding:'8px 10px', border:'1px solid #ece8e0', borderRadius:7, fontSize:13, background:'#faf7f2', outline:'none'}}/>
          </div>
          <button type="button" onClick={addTask} disabled={saving || !taskName.trim()} style={{width:'100%', padding:'10px', border:'none', borderRadius:8, background:'#1a1a18', color:'white', fontSize:13, fontWeight:600, cursor:'pointer', opacity:!taskName.trim()?0.5:1}}>
            {saving ? 'Adding…' : 'Add Task'}
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16}}>
        {[
          [tasks.filter(t => !t.done && daysUntil(t.due_date) < 0).length, 'Overdue', '#a0620a'],
          [tasks.filter(t => !t.done && daysUntil(t.due_date) >= 0 && daysUntil(t.due_date) <= 30).length, 'Due soon', '#1a1a18'],
          [tasks.filter(t => !t.done).length, 'Pending', '#1a1a18'],
          [tasks.filter(t => t.done).length, 'Done', '#2d5a3d'],
        ].map(([val, label, color]) => (
          <div key={label as string} style={{background:'white', border:'1px solid #ece8e0', borderRadius:10, padding:'10px 12px', textAlign:'center'}}>
            <div style={{fontFamily:'Georgia,serif', fontSize:22, fontWeight:600, color:color as string}}>{val as number}</div>
            <div style={{fontSize:10, color:'#9a9488', textTransform:'uppercase', letterSpacing:'.04em', marginTop:2}}>{label as string}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{display:'flex', gap:6, marginBottom:14, flexWrap:'wrap'}}>
        {[['all','All'], ['pending','Pending'], ['overdue','Overdue'], ['done','Done']].map(([f, label]) => (
          <button key={f} type="button" onClick={() => setFilter(f)} style={{padding:'5px 14px', borderRadius:20, border:`1.5px solid ${filter===f?'#1a1a18':'#ece8e0'}`, background:filter===f?'#1a1a18':'white', color:filter===f?'white':'#1a1a18', fontSize:12, fontWeight:500, cursor:'pointer'}}>{label}</button>
        ))}
      </div>

      {/* Task list */}
      <div style={{background:'white', border:'1px solid #ece8e0', borderRadius:13, overflow:'hidden'}}>
        {filtered.length === 0 ? (
          <div style={{padding:32, textAlign:'center', color:'#9a9488'}}>
            <div style={{fontSize:32, marginBottom:8}}>✅</div>
            <div style={{fontFamily:'Georgia,serif', fontSize:16}}>No tasks here!</div>
          </div>
        ) : filtered.map((task, i) => {
          const d = daysUntil(task.due_date)
          const overdue = !task.done && d < 0
          const soon = !task.done && d >= 0 && d <= 7
          return (
            <div key={task.id} style={{display:'flex', alignItems:'flex-start', gap:12, padding:'12px 16px', borderBottom: i < filtered.length-1 ? '1px solid #ece8e0' : 'none', background:overdue?'#fffbf5':'white'}}>
              {/* Checkbox */}
              <button type="button" onClick={() => !task.done && completeTask(task)} style={{width:20, height:20, borderRadius:5, border:`2px solid ${task.done?'#2d5a3d':overdue?'#a0620a':'#ece8e0'}`, background:task.done?'#2d5a3d':'white', color:'white', fontSize:11, fontWeight:700, cursor:task.done?'default':'pointer', flexShrink:0, marginTop:2, display:'flex', alignItems:'center', justifyContent:'center'}}>
                {task.done ? '✓' : ''}
              </button>
              {/* Content */}
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:13, fontWeight:500, textDecoration:task.done?'line-through':'none', color:task.done?'#9a9488':'#1a1a18', marginBottom:3}}>{task.name}</div>
                <div style={{display:'flex', alignItems:'center', gap:6, flexWrap:'wrap'}}>
                  <span style={{fontSize:10, color:'#9a9488'}}>{task.area}</span>
                  <span style={{fontSize:10, color:'#9a9488'}}>·</span>
                  <span style={{fontSize:10, color: overdue?'#a0620a': soon?'#a0620a':'#9a9488', fontWeight: overdue||soon?600:400}}>
                    {task.done ? 'Completed' : overdue ? `${Math.abs(d)}d overdue` : d === 0 ? 'Due today' : `Due ${fD(task.due_date)}`}
                  </span>
                  {task.recur && <span style={{background:'#f0e8f8', color:'#4a2a6a', padding:'1px 6px', borderRadius:20, fontSize:9, fontWeight:500}}>🔄 {task.recur}</span>}
                </div>
                {task.notes && <div style={{fontSize:11, color:'#9a9488', marginTop:3, fontStyle:'italic'}}>{task.notes}</div>}
              </div>
              {/* Delete */}
              <button type="button" onClick={() => deleteTask(task.id)} style={{background:'#f5e8e8', border:'none', color:'#8b3a3a', borderRadius:6, padding:'3px 8px', fontSize:10, cursor:'pointer', flexShrink:0}}>✕</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
