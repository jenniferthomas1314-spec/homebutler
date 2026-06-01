# HomeButler — Deployment Guide

## Stack

| Layer | Service | Cost |
|-------|---------|------|
| Frontend + API routes | Next.js 14 on Vercel | Free tier |
| Database + Auth | Supabase | Free tier (up to 500MB) |
| File storage | Supabase Storage | Free tier (1GB) |
| Payments | Stripe | 2.9% + 30¢ per transaction |
| AI | Anthropic API | Pay per use (~$0.003/message) |
| Domain | Namecheap / Cloudflare | ~$10/year |

---

## 1. Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free)
- A [Vercel](https://vercel.com) account (free)
- An [Anthropic](https://console.anthropic.com) account
- A [Stripe](https://stripe.com) account

---

## 2. Supabase Setup

1. Create a new project at supabase.com
2. Go to **SQL Editor** and run the contents of `supabase/migrations/001_initial_schema.sql`
3. Go to **Storage** → Create a bucket called `vault-documents` (Private)
4. Add this storage policy in SQL Editor:

```sql
create policy "Users can upload to own folder"
on storage.objects for insert
with check (
  bucket_id = 'vault-documents' and
  auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can read own files"
on storage.objects for select
using (
  bucket_id = 'vault-documents' and
  auth.uid()::text = (storage.foldername(name))[1]
);
```

5. Go to **Authentication** → Providers → Enable Google OAuth (optional but recommended)
6. Note your **Project URL** and **anon key** from Settings → API

---

## 3. Local Development

```bash
# Clone and install
git clone https://github.com/yourusername/homebutler.git
cd homebutler
npm install

# Copy env file and fill in your values
cp .env.local.example .env.local

# Run locally
npm run dev
```

Open http://localhost:3000

---

## 4. Environment Variables

Fill in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=       # From Supabase Settings > API
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # From Supabase Settings > API
SUPABASE_SERVICE_ROLE_KEY=      # From Supabase Settings > API (keep secret!)
ANTHROPIC_API_KEY=              # From console.anthropic.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # From Stripe Dashboard
STRIPE_SECRET_KEY=              # From Stripe Dashboard
STRIPE_WEBHOOK_SECRET=          # From Stripe webhook setup (step 6)
STRIPE_PRICE_MONTHLY=           # Price ID you create in Stripe
STRIPE_PRICE_YEARLY=            # Price ID you create in Stripe
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 5. Stripe Setup

1. Create your product in the Stripe Dashboard:
   - Product name: "HomeButler Pro"
   - Add two prices: Monthly ($6/mo) and Yearly ($49/yr)
   - Note both **Price IDs** (start with `price_`)

2. Add them to your `.env.local` as `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_YEARLY`

---

## 6. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo at vercel.com → Import Project.

**Add all environment variables** in Vercel Dashboard → Settings → Environment Variables. Change `NEXT_PUBLIC_APP_URL` to your production URL.

---

## 7. Stripe Webhooks

After deploying, set up the webhook:

1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. URL: `https://yourdomain.com/api/stripe/webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the **Signing secret** → add as `STRIPE_WEBHOOK_SECRET` in Vercel

---

## 8. Custom Domain

1. Buy a domain (homebutler.app, myhomebutler.com, etc.)
2. Vercel Dashboard → Your Project → Settings → Domains → Add domain
3. Follow DNS instructions

---

## 9. Affiliate Programs (Revenue Day 1)

Apply to these — approval takes 1-7 days:

- **Amazon Associates**: affiliate-program.amazon.com
  - After approval, get your tracking ID and set `NEXT_PUBLIC_AFFILIATE_AMAZON`
- **Home Depot**: Impact.com → search "Home Depot"
- **Walmart**: Impact.com → search "Walmart"

Users can also enter their own affiliate tags in Settings (great for resellers/influencers).

---

## 10. Launch Checklist

- [ ] Supabase schema migrated
- [ ] Storage bucket created with policies
- [ ] All env vars set in Vercel
- [ ] Stripe products and prices created
- [ ] Stripe webhook configured
- [ ] Custom domain pointing to Vercel
- [ ] Test signup → onboarding → upgrade flow end to end
- [ ] Test Stripe webhook with `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- [ ] Set up error monitoring (Sentry — free tier)
- [ ] Set up analytics (Plausible or Vercel Analytics — privacy-friendly)

---

## 11. After Launch

### Get your first 100 users
- Post on r/homeowners, r/DIY, r/FirstTimeHomeBuyer
- Share on NextDoor and local Facebook groups
- Post on Product Hunt (prepare a week in advance)
- Record a 2-minute demo video

### Realtor partnership pitch
> "I built an app that lets homeowners track every repair, warranty, and appliance — and hand it all off to the buyer when they sell. Would you be interested in gifting it to your clients at closing?"

One realtor doing 20 closings/year = 20 new users. 10 realtors = 200 users.

---

## Architecture Notes

- **Auth**: Supabase Auth with JWT → passed to API routes via cookies
- **Data**: Supabase PostgreSQL with Row Level Security (members can only see their properties)
- **Files**: Supabase Storage, private bucket, signed URLs
- **State**: Zustand for client-side state (cached from Supabase), persisted in localStorage as fallback
- **AI**: Anthropic API proxied through `/api/ai` — never expose the key client-side
- **Payments**: Stripe Checkout (hosted page) → webhook updates DB → UI reads plan from profile

---

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── ai/route.ts          # AI butler proxy
│   │   ├── stripe/
│   │   │   ├── checkout/route.ts
│   │   │   └── webhook/route.ts
│   │   ├── transfer/route.ts    # Home sale transfer codes
│   │   └── vault/upload/route.ts
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── callback/route.ts
│   ├── dashboard/               # All main app pages
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Dashboard
│   │   ├── tasks/page.tsx
│   │   ├── vault/page.tsx
│   │   ├── timeline/page.tsx
│   │   ├── sale/page.tsx
│   │   ├── fixit/page.tsx
│   │   ├── ai/page.tsx
│   │   └── settings/page.tsx
│   ├── pricing/page.tsx
│   ├── onboarding/page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── layout/AppShell.tsx
│   ├── ui/                      # Reusable UI primitives
│   └── [feature]/               # Feature-specific components
├── lib/
│   ├── supabase.ts
│   ├── store.ts                 # Zustand global state
│   ├── utils.ts                 # All helper functions
│   ├── butler.ts                # Butler personality system
│   └── stripe.ts
└── types/index.ts               # All TypeScript types
```
