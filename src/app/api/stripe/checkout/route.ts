// src/app/api/stripe/checkout/route.ts
import { NextResponse } from 'next/server'
import { createServerClientInstance } from '@/lib/supabase'
import { createCheckoutSession } from '@/lib/stripe'

export async function POST(request: Request) {
  const supabase = createServerClientInstance()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { plan } = await request.json()
  if (!plan || !['monthly', 'yearly'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const returnUrl = process.env.NEXT_PUBLIC_APP_URL!

  const checkoutSession = await createCheckoutSession({
    userId: session.user.id,
    email: session.user.email!,
    plan,
    returnUrl,
  })

  return NextResponse.json({ url: checkoutSession.url })
}
