// src/lib/butler.ts
import type { ButlerTrait } from '@/types'
import { timeOfDay } from './utils'

export const BUTLER_AVATARS: Record<ButlerTrait, string> = {
  formal:   '🎩',
  friendly: '😊',
  concise:  '⚡',
  witty:    '😄',
}

export const BUTLER_TAGS: Record<ButlerTrait, string> = {
  formal:   '🎩 Formal',
  friendly: '😊 Friendly',
  concise:  '⚡ Concise',
  witty:    '😄 Witty',
}

export const BUTLER_NAMES = [
  'Alfred', 'Reginald', 'Winston', 'Chester', 'Maxim',
  'Jasper', 'Edmund', 'Vivienne', 'Estelle', 'Clive',
]

interface GreetingConfig {
  greeting: (name: string, userName: string, pendingCount: number) => string
  preview: (name: string) => string
  signature: (name: string) => string
  intro: (name: string) => string
  chatHeader: (name: string) => string
  systemPrompt: (name: string, context: string) => string
}

export const BUTLER_GREETINGS: Record<ButlerTrait, GreetingConfig> = {
  formal: {
    greeting: (n, u, t) =>
      `Good ${timeOfDay()}${u ? ', ' + u : ''}. ${
        t > 0
          ? `You have ${t} task${t > 1 ? 's' : ''} requiring attention.`
          : 'Your home is in excellent order.'
      }`,
    preview: (n) => `Good morning. Your HVAC filter is due for replacement in 7 days.`,
    signature: (n) => `— ${n}, at your service`,
    intro: (n) => `${n} is ready to manage your home.`,
    chatHeader: (n) => `${n} · Your home butler`,
    systemPrompt: (n, ctx) =>
      `You are ${n}, a formal home butler AI. Be precise, professional, and dignified. Never use slang. ${ctx}`,
  },
  friendly: {
    greeting: (n, u, t) =>
      `Hey${u ? ', ' + u : ''}! 👋 ${
        t > 0
          ? `You've got ${t} task${t > 1 ? 's' : ''} coming up!`
          : 'Everything looks great! 🎉'
      }`,
    preview: (n) => `Hey! Your HVAC filter is due in 7 days. Easy fix!`,
    signature: (n) => `— ${n} 👋`,
    intro: (n) => `${n} is excited to help with your home!`,
    chatHeader: (n) => `${n} · Your home helper`,
    systemPrompt: (n, ctx) =>
      `You are ${n}, a friendly and warm home butler AI. Be encouraging and supportive. Use casual language. ${ctx}`,
  },
  concise: {
    greeting: (n, u, t) =>
      `${u ? u + ': ' : ''}${t > 0 ? `${t} task${t > 1 ? 's' : ''} due.` : 'All clear.'}`,
    preview: (n) => `HVAC filter due in 7 days.`,
    signature: (n) => `— ${n}`,
    intro: (n) => `${n} set up. Ready.`,
    chatHeader: (n) => `${n} · Concise`,
    systemPrompt: (n, ctx) =>
      `You are ${n}, a concise home butler AI. Keep all responses brief and direct. No fluff. ${ctx}`,
  },
  witty: {
    greeting: (n, u, t) =>
      `Good ${timeOfDay()}${u ? ', ' + u : ''}! ${
        t > 0
          ? `${t} task${t > 1 ? 's' : ''} that won't fix themselves.`
          : 'Suspiciously well-maintained. Enjoy it.'
      }`,
    preview: (n) => `Your HVAC filter has seen better days. 7 days until retirement.`,
    signature: (n) => `— ${n}, keeping the dust at bay`,
    intro: (n) => `${n} is ready. Expect occasional wordplay.`,
    chatHeader: (n) => `${n} · Witty consultant`,
    systemPrompt: (n, ctx) =>
      `You are ${n}, a witty home butler AI with dry humor. Always genuinely helpful, occasionally sardonic. ${ctx}`,
  },
}

export function getButlerGreeting(
  trait: ButlerTrait,
  name: string,
  userName: string,
  pendingCount: number
): string {
  return BUTLER_GREETINGS[trait].greeting(name, userName, pendingCount)
}

export function buildSystemPrompt(
  trait: ButlerTrait,
  butlerName: string,
  homeName: string,
  appliances: string[],
  vaultSummary: string,
  guideNames: string[]
): string {
  const context = [
    `Home: ${homeName}.`,
    `Appliances: ${appliances.join(', ') || 'None listed'}.`,
    `Documents in vault: ${vaultSummary || 'None'}.`,
    `Fix It guides available: ${guideNames.join(', ')}.`,
    `When answering home problems: 1) Diagnose clearly 2) State DIY difficulty (Easy/Medium/Hard) 3) Estimate professional cost 4) Recommend the specific Fix It guide by name if one applies 5) Mention vault documents (warranties, manuals) if relevant.`,
    `Always be helpful first, personality second.`,
  ].join(' ')

  return BUTLER_GREETINGS[trait].systemPrompt(butlerName, context)
}
