// ═══════════════════════════════════════════════════════════════════════════════
// Auth Service — Admin authentication
// ═══════════════════════════════════════════════════════════════════════════════

import { sbGet, sbPatch } from './supabase.js'

const ADMIN_ID = process.env.ADMIN_ACCOUNT_ID ? Number(process.env.ADMIN_ACCOUNT_ID) : 0

// In-memory auth store (resets on restart — acceptable for Telegram bot)
const authenticated = new Set<number>()
const pendingPassword = new Set<number>()

export function isAuthenticated(chatId: number): boolean {
  return authenticated.has(chatId)
}

export function isPendingPassword(chatId: number): boolean {
  return pendingPassword.has(chatId)
}

export function setAuthenticated(chatId: number): void {
  pendingPassword.delete(chatId)
  authenticated.add(chatId)
}

export function setPendingPassword(chatId: number): void {
  authenticated.delete(chatId)
  pendingPassword.add(chatId)
}

export function logout(chatId: number): void {
  authenticated.delete(chatId)
  pendingPassword.delete(chatId)
}

/** Verify password against Supabase Admin table */
export async function verifyPassword(password: string): Promise<boolean> {
  try {
    const admins = await sbGet('Admin', 'limit=1')
    if (!admins.length) return false
    return admins[0].password === password
  } catch {
    return false
  }
}

/** Change admin password in Supabase */
export async function changePassword(newPassword: string): Promise<boolean> {
  try {
    const admins = await sbGet('Admin', 'limit=1')
    if (!admins.length) return false
    await sbPatch('Admin', `id=eq.${admins[0].id}`, { password: newPassword })
    return true
  } catch {
    return false
  }
}

/** Check if chatId is the allowed admin */
export function isAdmin(chatId: number): boolean {
  if (!ADMIN_ID) return true // No restriction if not configured
  return chatId === ADMIN_ID
}
