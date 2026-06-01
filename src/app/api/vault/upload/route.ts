// src/app/api/vault/upload/route.ts
import { NextResponse } from 'next/server'
import { createServerClientInstance } from '@/lib/supabase'

export async function POST(request: Request) {
  const supabase = createServerClientInstance()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const propertyId = formData.get('propertyId') as string | null

  if (!file || !propertyId) {
    return NextResponse.json({ error: 'Missing file or propertyId' }, { status: 400 })
  }

  // Verify user is a member of this property
  const { data: member } = await supabase
    .from('property_members')
    .select('role')
    .eq('property_id', propertyId)
    .eq('user_id', session.user.id)
    .single()

  if (!member || member.role === 'viewer') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Upload to Supabase Storage
  const filePath = `${session.user.id}/${propertyId}/${Date.now()}-${file.name}`
  const { data, error } = await supabase.storage
    .from('vault-documents')
    .upload(filePath, file, { cacheControl: '3600', upsert: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get signed URL (valid for 1 year — docs don't expire often)
  const { data: urlData } = await supabase.storage
    .from('vault-documents')
    .createSignedUrl(filePath, 60 * 60 * 24 * 365)

  return NextResponse.json({
    path: filePath,
    url: urlData?.signedUrl,
    fileName: file.name,
    fileSize: file.size,
  })
}
