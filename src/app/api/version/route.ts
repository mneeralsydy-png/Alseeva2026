import { NextResponse } from 'next/server';

// Simple cache for the version hash
let _cachedVersion: string | null = null;
let _lastCheck = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

function generateVersion(): string {
  const now = new Date();
  const date = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  const time = now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0');
  return `${date}-${time}`;
}

function getBuildHash(): string {
  try {
    const fs = require('fs');
    const path = require('path');
    const buildIdPath = path.join(process.cwd(), '.next/BUILD_ID');
    if (fs.existsSync(buildIdPath)) {
      return fs.readFileSync(buildIdPath, 'utf-8').trim().slice(0, 12);
    }
  } catch {
    // Ignore
  }
  return generateVersion();
}

export async function GET() {
  const now = Date.now();

  if (_cachedVersion && (now - _lastCheck) < CACHE_TTL) {
    return NextResponse.json({
      version: _cachedVersion,
      buildHash: getBuildHash(),
      timestamp: new Date().toISOString(),
      status: 'active',
    });
  }

  _cachedVersion = generateVersion();
  _lastCheck = now;

  return NextResponse.json({
    version: _cachedVersion,
    buildHash: getBuildHash(),
    timestamp: new Date().toISOString(),
    status: 'active',
  });
}
