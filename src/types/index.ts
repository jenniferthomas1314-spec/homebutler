// src/types/index.ts
// All core HomeButler types

export type ButlerTrait = 'formal' | 'friendly' | 'concise' | 'witty'
export type Role = 'owner' | 'admin' | 'member' | 'viewer'
export type TaskFilter = 'all' | 'pending' | 'overdue' | 'done'
export type VaultView = 'list' | 'grid' | 'group'
export type Season = 'Spring' | 'Summer' | 'Fall' | 'Winter'
export type SaleMethod = 'code' | 'file' | 'print'
export type Plan = 'free' | 'pro'

export type DocType =
  | 'warranty' | 'manual' | 'receipt' | 'invoice'
  | 'insurance' | 'permit' | 'inspection' | 'other'

export type TimelineEventType =
  | 'purchase' | 'ownership' | 'renovation' | 'repair'
  | 'appliance' | 'permit' | 'milestone'

// ── User / Auth ──────────────────────────────────────────
export interface AppUser {
  id: string
  email: string
  name: string
  initials: string
  avatarColor: string
  avatarTextColor: string
  plan: Plan
  stripeCustomerId?: string
  createdAt: string
}

// ── Butler ───────────────────────────────────────────────
export interface Butler {
  name: string
  trait: ButlerTrait
}

// ── Property Member ──────────────────────────────────────
export interface PropertyMember {
  userId: string
  name: string
  email: string
  role: Role
  initials: string
  avatarColor: string
  avatarTextColor: string
  joinedAt: string
}

export interface PropertyInvite {
  id: string
  code: string
  email: string
  role: Role
  createdAt: string
  status: 'pending' | 'accepted' | 'revoked'
}

// ── Task ─────────────────────────────────────────────────
export interface CompletionRecord {
  date: string
  nextDue: string
  spec?: string | null
}

export interface Task {
  id: string
  name: string
  area: string
  due: string
  recur: string
  done: boolean
  notes: string
  completionHistory: CompletionRecord[]
}

// ── Appliance ────────────────────────────────────────────
export interface ServiceRecord {
  date: string
  desc: string
  cost?: number | null
}

export interface Appliance {
  id: string
  name: string
  brand: string
  model: string
  purchased: string
  warranty: string
  notes: string
  history: ServiceRecord[]
}

// ── Contractor ───────────────────────────────────────────
export interface Contractor {
  id: string
  name: string
  trade: string
  phone: string
  rating: number
  notes: string
}

// ── Cost ─────────────────────────────────────────────────
export interface Cost {
  id: string
  desc: string
  category: string
  amount: number
  date: string
}

// ── Document Vault ───────────────────────────────────────
export interface VaultDocument {
  id: string
  type: DocType
  name: string
  issuer: string
  appliance: string
  room: string
  dateAdded: string
  expiryDate: string | null
  amount: number | null
  notes: string
  fileName: string
  fileSize: number | null
  fileUrl: string | null        // Supabase Storage URL
  addedAt: string
}

// ── Timeline ─────────────────────────────────────────────
export interface TimelineEvent {
  id: string
  type: TimelineEventType
  title: string
  date: string
  notes: string
  amount: number | null
  source: 'manual' | 'auto' | 'appliances' | 'costs' | 'vault'
  addedAt: string
}

// ── Activity Log ─────────────────────────────────────────
export interface ActivityEntry {
  id: string
  type: string
  userId: string
  userName: string
  initials: string
  avatarColor: string
  avatarTextColor: string
  message: string
  timestamp: string
}

// ── Property ─────────────────────────────────────────────
export interface Property {
  id: string
  name: string
  address: string
  type: string
  emoji: string
  purchaseDate: string
  purchasePrice: number | null
  yearBuilt: string
  members: PropertyMember[]
  invites: PropertyInvite[]
  tasks: Task[]
  appliances: Appliance[]
  contractors: Contractor[]
  costs: Cost[]
  vault: VaultDocument[]
  timeline: TimelineEvent[]
  activityLog: ActivityEntry[]
  totalSaved: number
  seasonal: Record<Season, string[]>
}

// ── Part Spec ────────────────────────────────────────────
export interface PartSpec {
  partDefId: string
  spec: string
}

// ── Notification ─────────────────────────────────────────
export interface Notification {
  id: string
  key: string
  type: 'info' | 'warn' | 'urgent' | 'ok'
  icon: string
  title: string
  sub: string
  time: string
  read: boolean
}

// ── App State ────────────────────────────────────────────
export interface AppState {
  user: AppUser | null
  butler: Butler
  activePropertyId: string | null
  properties: Property[]
  notifications: Notification[]
  completedGuides: Record<string, boolean>
  affiliateTags: Record<string, string>
  savedPartSpecs: Record<string, string>
  notifPrefs: {
    inApp: boolean
    advanceDays: number[]
    triggers: Record<string, boolean>
  }
}

// ── Transfer Package ─────────────────────────────────────
export interface TransferPackage {
  exportedAt: string
  version: string
  property: Pick<Property, 'name' | 'address' | 'type' | 'emoji' | 'purchaseDate' | 'purchasePrice' | 'yearBuilt'>
  timeline: TimelineEvent[]
  appliances: Omit<Appliance, 'id'>[]
  tasks: Omit<Task, 'id' | 'done' | 'completionHistory'>[]
  vault: Omit<VaultDocument, 'id' | 'addedAt' | 'fileUrl'>[]
  contractors: Omit<Contractor, 'id'>[]
  costs: Omit<Cost, 'id'>[]
  totalInvested: number
}

// ── Fix It ───────────────────────────────────────────────
export interface GuideStep {
  t: string
  d: string
  v: string
  tip?: string
  warning?: string
}

export interface Guide {
  id: string
  name: string
  emoji: string
  category: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  laborCost: number
  timeMinutes: number
  tools: string[]
  steps: GuideStep[]
}

// ── Subscription ─────────────────────────────────────────
export interface Subscription {
  id: string
  userId: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  plan: 'monthly' | 'yearly'
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

// ── Plan limits ──────────────────────────────────────────
export const PLAN_LIMITS = {
  free: {
    properties: 1,
    documents: 10,
    tasks: 20,
    aiMessages: 5,        // per day
    homeSaleTransfer: false,
    partsFinder: true,
  },
  pro: {
    properties: Infinity,
    documents: Infinity,
    tasks: Infinity,
    aiMessages: Infinity,
    homeSaleTransfer: true,
    partsFinder: true,
  },
} as const
