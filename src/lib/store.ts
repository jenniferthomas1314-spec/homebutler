// src/lib/store.ts
// Global state using Zustand — replaces localStorage from the prototype

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AppState, Property, Butler, Notification, AppUser } from '@/types'
import { genId, today } from './utils'

interface StoreActions {
  // Auth
  setUser: (user: AppUser | null) => void
  // Butler
  setButler: (butler: Butler) => void
  // Properties
  setProperties: (properties: Property[]) => void
  addProperty: (property: Property) => void
  updateProperty: (id: string, updates: Partial<Property>) => void
  deleteProperty: (id: string) => void
  setActiveProperty: (id: string) => void
  // Notifications
  addNotification: (n: Notification) => void
  markNotificationRead: (id: string) => void
  markAllRead: () => void
  // Completed guides
  markGuideComplete: (guideId: string) => void
  // Affiliate tags
  setAffiliateTag: (store: string, tag: string) => void
  // Saved part specs
  setSavedPartSpec: (partId: string, spec: string) => void
  deleteSavedPartSpec: (partId: string) => void
  // Notif prefs
  setNotifPref: (key: string, value: boolean) => void
  // Reset
  reset: () => void
}

const initialState: AppState = {
  user: null,
  butler: { name: 'Alfred', trait: 'formal' },
  activePropertyId: null,
  properties: [],
  notifications: [],
  completedGuides: {},
  affiliateTags: { amazon: '', homedepot: '', walmart: '' },
  savedPartSpecs: {},
  notifPrefs: {
    inApp: true,
    advanceDays: [7],
    triggers: {
      tasksDue: true,
      tasksOverdue: true,
      warrantyExpiring: true,
      docExpiring: true,
    },
  },
}

export const useStore = create<AppState & StoreActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => set({ user }),
      setButler: (butler) => set({ butler }),

      setProperties: (properties) => set({ properties }),
      addProperty: (property) =>
        set(s => ({ properties: [...s.properties, property] })),
      updateProperty: (id, updates) =>
        set(s => ({
          properties: s.properties.map(p => p.id === id ? { ...p, ...updates } : p),
        })),
      deleteProperty: (id) =>
        set(s => ({
          properties: s.properties.filter(p => p.id !== id),
          activePropertyId: s.activePropertyId === id
            ? (s.properties.find(p => p.id !== id)?.id ?? null)
            : s.activePropertyId,
        })),
      setActiveProperty: (id) => set({ activePropertyId: id }),

      addNotification: (n) =>
        set(s => ({
          notifications: [n, ...s.notifications].slice(0, 50),
        })),
      markNotificationRead: (id) =>
        set(s => ({
          notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
        })),
      markAllRead: () =>
        set(s => ({
          notifications: s.notifications.map(n => ({ ...n, read: true })),
        })),

      markGuideComplete: (guideId) =>
        set(s => ({ completedGuides: { ...s.completedGuides, [guideId]: true } })),

      setAffiliateTag: (store, tag) =>
        set(s => ({ affiliateTags: { ...s.affiliateTags, [store]: tag } })),

      setSavedPartSpec: (partId, spec) =>
        set(s => ({ savedPartSpecs: { ...s.savedPartSpecs, [partId]: spec } })),
      deleteSavedPartSpec: (partId) =>
        set(s => {
          const { [partId]: _, ...rest } = s.savedPartSpecs
          return { savedPartSpecs: rest }
        }),

      setNotifPref: (key, value) =>
        set(s => ({
          notifPrefs: {
            ...s.notifPrefs,
            triggers: { ...s.notifPrefs.triggers, [key]: value },
          },
        })),

      reset: () => set(initialState),
    }),
    {
      name: 'homebutler-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// ── Convenience selectors ─────────────────────────────────
export const useActiveProperty = () => {
  const { properties, activePropertyId } = useStore()
  return properties.find(p => p.id === activePropertyId) ?? properties[0] ?? null
}

export const useUserRole = () => {
  const { user } = useStore()
  const p = useActiveProperty()
  return p?.members.find(m => m.userId === user?.id)?.role ?? 'member'
}

export const useUnreadCount = () =>
  useStore(s => s.notifications.filter(n => !n.read).length)

export const useDiySavings = () => {
  const p = useActiveProperty()
  const completedGuides = useStore(s => s.completedGuides)
  // Import GUIDES lazily to avoid circular dep
  const guideTotal = Object.keys(completedGuides).length * 0 // filled in component
  return (p?.totalSaved ?? 0) + guideTotal
}
