// ═══════════════════════════════════════════════════════════════════════════════
// Conversation Manager — Multi-step form handling
// ═══════════════════════════════════════════════════════════════════════════════

interface ConversationState {
  action: string
  step: number
  data: Record<string, any>
}

const conversations = new Map<number, ConversationState>()

export function getState(chatId: number): ConversationState {
  if (!conversations.has(chatId)) {
    conversations.set(chatId, { action: '', step: 0, data: {} })
  }
  return conversations.get(chatId)!
}

export function clearState(chatId: number): void {
  conversations.delete(chatId)
}

export function startConversation(chatId: number, action: string): ConversationState {
  const state = { action, step: 1, data: {} }
  conversations.set(chatId, state)
  return state
}
