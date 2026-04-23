// ═══════════════════════════════════════════════════════════════════════════════
// Logger — Write to file since PM2 doesn't capture bun's stdout
// ═══════════════════════════════════════════════════════════════════════════════

import { appendFileSync } from 'fs'

const LOG_FILE = '/tmp/alshifa-bot.log'

export function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`
  try { appendFileSync(LOG_FILE, line) } catch {}
}

export function getLog() {
  try {
    const { readFileSync } = require('fs')
    return readFileSync(LOG_FILE, 'utf-8').slice(-5000)
  } catch { return '(no logs)' }
}
