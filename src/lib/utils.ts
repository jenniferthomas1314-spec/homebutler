// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { type Property, type TimelineEvent, type TransferPackage } from '@/types'

// ── Tailwind class merging ────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// ── Date helpers ─────────────────────────────────────────
export function today(): string {
  return new Date().toISOString().split('T')[0]
}

export function addDays(date: string, n: number): string {
  const dt = new Date(date)
  dt.setDate(dt.getDate() + n)
  return dt.toISOString().split('T')[0]
}

export function addDaysFromNow(n: number): string {
  return addDays(today(), n)
}

export function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - new Date(today()).getTime()) / 864e5)
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  const [y, m, d] = date.split('-')
  return `${m}/${d}/${y}`
}

export function formatYear(date: string | null | undefined): string {
  if (!date) return '—'
  return date.split('-')[0]
}

export function formatRelativeTime(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function timeOfDay(): string {
  const h = new Date().getHours()
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
}

export function currentSeason(): 'Spring' | 'Summer' | 'Fall' | 'Winter' {
  const m = new Date().getMonth()
  return m < 3 || m === 11 ? 'Winter' : m < 6 ? 'Spring' : m < 9 ? 'Summer' : 'Fall'
}

// ── Number formatting ─────────────────────────────────────
export function formatCurrency(n: number): string {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return ''
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / 1048576).toFixed(1) + 'MB'
}

// ── ID / code generation ──────────────────────────────────
export function genId(): string {
  return 'id-' + Math.random().toString(36).slice(2, 10)
}

export function genCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export function genTransferCode(): string {
  return genCode() + '-' + genCode()
}

// ── Recurrence ────────────────────────────────────────────
export const RECUR_DAYS: Record<string, number> = {
  '1 month': 30,
  '3 months': 90,
  '6 months': 180,
  '12 months': 365,
}

// ── Document expiry ───────────────────────────────────────
export function docExpiry(expiryDate: string | null): {
  status: 'none' | 'expired' | 'soon' | 'ok'
  label: string
} {
  if (!expiryDate) return { status: 'none', label: '' }
  const d = Math.ceil(
    (new Date(expiryDate).getTime() - new Date().setHours(0, 0, 0, 0)) / 864e5
  )
  if (d < 0) return { status: 'expired', label: `Expired ${Math.abs(d)}d ago` }
  if (d <= 90) return { status: 'soon', label: `Expires in ${d}d` }
  return { status: 'ok', label: `Expires ${formatDate(expiryDate)}` }
}

// ── Timeline auto-builder ─────────────────────────────────
export function buildTimeline(prop: Property): TimelineEvent[] {
  const items: TimelineEvent[] = []

  if (prop.purchaseDate || prop.purchasePrice) {
    items.push({
      id: 'auto-purchase',
      type: 'purchase',
      title: `Purchased — ${prop.name}`,
      date: prop.purchaseDate || today(),
      notes: prop.purchasePrice ? `Purchase price: ${formatCurrency(prop.purchasePrice)}` : '',
      source: 'auto',
      amount: prop.purchasePrice,
      addedAt: today(),
    })
  }

  if (prop.yearBuilt) {
    items.push({
      id: 'auto-built',
      type: 'ownership',
      title: 'Home built',
      date: prop.yearBuilt + '-06-01',
      notes: `Built in ${prop.yearBuilt}`,
      source: 'auto',
      amount: null,
      addedAt: today(),
    })
  }

  for (const a of prop.appliances.filter(a => a.purchased)) {
    items.push({
      id: 'auto-app-' + a.id,
      type: 'appliance',
      title: `${a.name} installed`,
      date: a.purchased,
      notes: `${a.brand || ''}${a.model ? ' · ' + a.model : ''}`,
      source: 'appliances',
      amount: null,
      addedAt: today(),
    })
  }

  for (const d of prop.vault.filter(d => d.type === 'permit' || d.type === 'inspection')) {
    items.push({
      id: 'auto-doc-' + d.id,
      type: 'permit',
      title: d.name,
      date: d.dateAdded || today(),
      notes: d.issuer + (d.amount ? ` · ${formatCurrency(d.amount)}` : ''),
      source: 'vault',
      amount: d.amount,
      addedAt: today(),
    })
  }

  for (const c of prop.costs.filter(c => Number(c.amount) >= 500)) {
    items.push({
      id: 'auto-cost-' + c.id,
      type: 'repair',
      title: c.desc,
      date: c.date || today(),
      notes: `${c.category} · ${formatCurrency(c.amount)}`,
      source: 'costs',
      amount: Number(c.amount),
      addedAt: today(),
    })
  }

  const totalCost = prop.costs.reduce((s, c) => s + Number(c.amount), 0)
  if (totalCost >= 5000) {
    items.push({
      id: 'auto-milestone',
      type: 'milestone',
      title: `Reached ${formatCurrency(Math.floor(totalCost / 5000) * 5000)} in home investment`,
      date: today(),
      notes: `Total tracked: ${formatCurrency(totalCost)}`,
      source: 'auto',
      amount: Math.floor(totalCost / 5000) * 5000,
      addedAt: today(),
    })
  }

  for (const e of prop.timeline) {
    items.push({ ...e, source: 'manual' })
  }

  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// ── Transfer package builder ──────────────────────────────
export function buildTransferPackage(prop: Property): TransferPackage {
  return {
    exportedAt: new Date().toISOString(),
    version: 'hb-v1',
    property: {
      name: prop.name,
      address: prop.address,
      type: prop.type,
      emoji: prop.emoji,
      purchaseDate: prop.purchaseDate,
      purchasePrice: prop.purchasePrice,
      yearBuilt: prop.yearBuilt,
    },
    timeline: buildTimeline(prop),
    appliances: prop.appliances.map(({ id: _id, ...a }) => a),
    tasks: prop.tasks
      .filter(t => !t.done)
      .map(({ id: _id, done: _done, completionHistory: _h, ...t }) => t),
    vault: prop.vault.map(({ id: _id, addedAt: _a, fileUrl: _u, ...d }) => d),
    contractors: prop.contractors.map(({ id: _id, ...c }) => c),
    costs: prop.costs.map(({ id: _id, ...c }) => c),
    totalInvested: prop.costs.reduce((s, c) => s + Number(c.amount), 0),
  }
}

// ── Parts finder ──────────────────────────────────────────
export function matchPartDef(taskName: string) {
  return PART_DEFS.find(pd =>
    pd.keywords.some(kw => taskName.toLowerCase().includes(kw))
  ) ?? null
}

export const PART_DEFS = [
  {
    id: 'hvac_filter',
    keywords: ['hvac filter', 'air filter', 'furnace filter', 'ac filter'],
    partType: 'HVAC Filter',
    icon: '🌬️',
    sizeLabel: 'Filter size',
    sizePlaceholder: 'e.g. 20x25x1',
    sizeHint: 'Printed on the frame of your existing filter.',
    commonSizes: ['16x20x1', '16x25x1', '20x20x1', '20x25x1', '20x25x4'],
    searchFn: (s: string) => `${s} furnace air filter`,
    stores: ['amazon', 'homedepot', 'walmart'],
  },
  {
    id: 'water_filter',
    keywords: ['water filter', 'refrigerator filter', 'fridge filter'],
    partType: 'Water Filter',
    icon: '💧',
    sizeLabel: 'Filter model',
    sizePlaceholder: 'e.g. Samsung DA29-00020B',
    sizeHint: 'Check inside the fridge near the filter housing.',
    commonSizes: ['Samsung DA29-00020B', 'LG LT700P', 'Whirlpool W10295370', 'GE MWF'],
    searchFn: (s: string) => `${s} replacement water filter`,
    stores: ['amazon', 'homedepot', 'walmart'],
  },
  {
    id: 'smoke_battery',
    keywords: ['smoke detector', 'smoke alarm', 'co detector'],
    partType: 'Detector Battery',
    icon: '🔋',
    sizeLabel: 'Battery size',
    sizePlaceholder: 'e.g. 9V',
    sizeHint: 'Most smoke detectors use 9V or AA.',
    commonSizes: ['9V', '9V Lithium', 'AA', 'AAA'],
    searchFn: (s: string) => `${s} batteries`,
    stores: ['amazon', 'walmart', 'homedepot'],
  },
  {
    id: 'toilet_flapper',
    keywords: ['toilet flapper', 'running toilet'],
    partType: 'Toilet Flapper',
    icon: '🚽',
    sizeLabel: 'Brand or size',
    sizePlaceholder: 'e.g. Kohler 2-inch',
    sizeHint: 'Check the toilet tank lid.',
    commonSizes: ['Universal 2"', 'Kohler 2"', 'American Standard 2"'],
    searchFn: (s: string) => `${s} toilet flapper`,
    stores: ['amazon', 'homedepot', 'walmart'],
  },
  {
    id: 'dryer_vent',
    keywords: ['dryer vent', 'lint trap'],
    partType: 'Dryer Vent Supplies',
    icon: '👕',
    sizeLabel: 'Duct diameter',
    sizePlaceholder: 'e.g. 4 inch',
    sizeHint: 'Most dryers use 4" round duct.',
    commonSizes: ['4 inch', 'Lint brush kit'],
    searchFn: (s: string) => `${s} dryer vent cleaning`,
    stores: ['amazon', 'homedepot', 'walmart'],
  },
]

// ── Affiliate URLs ────────────────────────────────────────
export const AFF_CONFIG = {
  amazon: {
    defaultTag: 'YOUR-TAG-20',
    url: (q: string, tag: string) =>
      `https://www.amazon.com/s?k=${encodeURIComponent(q)}&tag=${tag}`,
    name: 'Amazon',
    logo: '📦',
  },
  homedepot: {
    defaultTag: 'YOUR-HD-TAG',
    url: (q: string, _tag: string) =>
      `https://www.homedepot.com/s/${encodeURIComponent(q)}`,
    name: 'Home Depot',
    logo: '🏠',
  },
  walmart: {
    defaultTag: 'YOUR-WM-TAG',
    url: (q: string, _tag: string) =>
      `https://www.walmart.com/search?q=${encodeURIComponent(q)}`,
    name: 'Walmart',
    logo: '🛒',
  },
}

export function affUrl(
  storeId: string,
  query: string,
  userTag?: string
): string {
  const store = AFF_CONFIG[storeId as keyof typeof AFF_CONFIG]
  if (!store) return '#'
  const tag = userTag || store.defaultTag
  return store.url(query, tag)
}

// ── Role permissions ──────────────────────────────────────
export const ROLE_PERMS = {
  owner:  { canEdit: true,  canDelete: true,  canInvite: true,  canManage: true  },
  admin:  { canEdit: true,  canDelete: true,  canInvite: true,  canManage: true  },
  member: { canEdit: true,  canDelete: false, canInvite: false, canManage: false },
  viewer: { canEdit: false, canDelete: false, canInvite: false, canManage: false },
}

export function canDo(role: string, action: keyof typeof ROLE_PERMS.owner): boolean {
  return ROLE_PERMS[role as keyof typeof ROLE_PERMS]?.[action] ?? false
}
