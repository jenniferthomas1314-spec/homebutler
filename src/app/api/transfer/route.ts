// src/app/api/transfer/route.ts
import { NextResponse } from 'next/server'
import { createServerClientInstance } from '@/lib/supabase'

// GET: look up a property by transfer code
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

  const supabase = createServerClientInstance()
  const { data: property } = await supabase
    .from('properties')
    .select(`
      id, name, address, type, emoji, purchase_date, purchase_price, year_built,
      tasks(name, area, due_date, recur, notes),
      appliances(name, brand, model, purchased, warranty, notes),
      contractors(name, trade, phone, rating, notes),
      costs(description, category, amount, cost_date),
      vault_documents(type, name, issuer, appliance, room, date_added, expiry_date, amount, notes, file_name),
      timeline_events(type, title, event_date, notes, amount)
    `)
    .eq('transfer_code', code.toUpperCase())
    .single()

  if (!property) {
    return NextResponse.json({ error: 'Transfer code not found' }, { status: 404 })
  }

  return NextResponse.json({ property })
}

// POST: generate a fresh transfer code for a property
export async function POST(request: Request) {
  const supabase = createServerClientInstance()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { propertyId } = await request.json()

  // Verify ownership
  const { data: member } = await supabase
    .from('property_members')
    .select('role')
    .eq('property_id', propertyId)
    .eq('user_id', session.user.id)
    .single()

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const code = [
    Math.random().toString(36).slice(2, 8).toUpperCase(),
    Math.random().toString(36).slice(2, 8).toUpperCase(),
  ].join('-')

  await supabase
    .from('properties')
    .update({ transfer_code: code })
    .eq('id', propertyId)

  return NextResponse.json({ code })
}
