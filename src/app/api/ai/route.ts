// src/app/api/ai/route.ts
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClientInstance } from '@/lib/supabase'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: Request) {
  // Auth check
  const supabase = createServerClientInstance()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Plan / rate limit check
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', session.user.id)
    .single()

  if (profile?.plan === 'free') {
    // Count today's AI messages
    const { data: count } = await supabase
      .rpc('count_ai_messages_today', { p_user_id: session.user.id })

    if ((count ?? 0) >= 5) {
      return NextResponse.json(
        { error: 'Daily AI limit reached. Upgrade to Pro for unlimited messages.' },
        { status: 429 }
      )
    }
  }

  const body = await request.json()
  const { messages, systemPrompt } = body

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    })

    // Log the message for rate limiting
    await supabase.from('ai_messages').insert({ user_id: session.user.id })

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')

    return NextResponse.json({ text })
  } catch (err) {
    console.error('Anthropic error:', err)
    return NextResponse.json({ error: 'AI service error' }, { status: 500 })
  }
}
