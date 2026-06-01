// src/lib/stripe.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
  typescript: true,
})

export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY!,
  yearly: process.env.STRIPE_PRICE_YEARLY!,
}

export const PLAN_DISPLAY = {
  monthly: { label: 'Monthly', price: '$6', period: '/month', savings: null },
  yearly:  { label: 'Yearly',  price: '$49', period: '/year', savings: 'Save 32%' },
}

export async function createCheckoutSession({
  userId,
  email,
  plan,
  returnUrl,
}: {
  userId: string
  email: string
  plan: 'monthly' | 'yearly'
  returnUrl: string
}) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{ price: STRIPE_PRICES[plan], quantity: 1 }],
    success_url: `${returnUrl}/settings?upgrade=success`,
    cancel_url: `${returnUrl}/settings?upgrade=canceled`,
    metadata: { userId, plan },
    subscription_data: {
      trial_period_days: 14,
      metadata: { userId },
    },
  })
  return session
}

export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string
  returnUrl: string
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${returnUrl}/settings`,
  })
  return session
}
