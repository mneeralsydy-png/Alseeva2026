import { sbGet } from '@/lib/supabase'

// Cache telegram config in memory to avoid repeated DB reads
let cachedConfig: { token: string; chatId: string } | null = null
let cacheTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get Telegram bot config from CenterInfo table (persistent storage)
 * Falls back to process.env (for backward compatibility)
 */
export async function getTelegramConfig(): Promise<{ token: string; chatId: string }> {
  // Check memory cache first
  if (cachedConfig && Date.now() - cacheTime < CACHE_TTL) {
    return cachedConfig
  }

  let token = ''
  let chatId = ''

  try {
    // Sequential reads (avoids any parallel fetch issues)
    const tokenRows = await sbGet('CenterInfo', 'key=eq.telegram_bot_token')
    token = tokenRows?.[0]?.value || process.env.TELEGRAM_BOT_TOKEN || ''

    if (token) {
      const chatRows = await sbGet('CenterInfo', 'key=eq.telegram_channel_id')
      chatId = chatRows?.[0]?.value || process.env.TELEGRAM_CHANNEL_ID || ''
    }
  } catch (error) {
    console.error('Failed to read telegram config from DB:', error)
  }

  if (token && chatId) {
    cachedConfig = { token, chatId }
    cacheTime = Date.now()
    return cachedConfig
  }

  // Fallback to env vars
  return {
    token: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHANNEL_ID || '',
  }
}

/**
 * Clear cached telegram config (useful after updating settings)
 */
export function clearTelegramCache(): void {
  cachedConfig = null
  cacheTime = 0
}

/**
 * Save telegram config to CenterInfo and update env vars + cache
 */
export async function saveTelegramConfig(token: string, chatId: string): Promise<void> {
  const { sbPost, sbPatch, sbGet } = await import('@/lib/supabase')

  // Upsert token
  const existingToken = await sbGet('CenterInfo', 'key=eq.telegram_bot_token')
  if (existingToken.length > 0) {
    await sbPatch('CenterInfo', 'key=eq.telegram_bot_token', { value: token })
  } else {
    await sbPost('CenterInfo', { key: 'telegram_bot_token', value: token, type: 'text', section: 'تيلجرام' })
  }

  // Upsert chat id
  const existingChat = await sbGet('CenterInfo', 'key=eq.telegram_channel_id')
  if (existingChat.length > 0) {
    await sbPatch('CenterInfo', 'key=eq.telegram_channel_id', { value: chatId })
  } else {
    await sbPost('CenterInfo', { key: 'telegram_channel_id', value: chatId, type: 'text', section: 'تيلجرام' })
  }

  // Update process.env for current session
  process.env.TELEGRAM_BOT_TOKEN = token
  process.env.TELEGRAM_CHANNEL_ID = chatId

  // Update cache
  cachedConfig = { token, chatId }
  cacheTime = Date.now()
}
