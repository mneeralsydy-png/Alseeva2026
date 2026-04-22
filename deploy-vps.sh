#!/bin/bash
# ── AlShifa Center — Deployment Script ─────────────────────
# Run this on the VPS: ssh root@66.42.113.157
# Or run locally after copying files

set -e

PROJECT_DIR="/var/www/alshifa"
LOCAL_DIR="/home/z/my-project"

echo "=========================================="
echo "  نشر تطبيق مركز الشفاء"
echo "=========================================="

# 1. Go to project directory
cd "$PROJECT_DIR"

# 2. Pull latest from git (if using git) or sync files
# If using rsync from local machine:
# rsync -avz --exclude='node_modules' --exclude='.next' --exclude='.git' --exclude='agent-ctx' --exclude='upload' --exclude='download' --exclude='examples' /home/z/my-project/ root@66.42.113.157:/var/www/alshifa/

# 3. Install dependencies
echo "📦 Installing dependencies..."
npm install --production=false 2>&1 | tail -3

# 4. Build the Next.js app
echo "🔨 Building Next.js app..."
npx next build 2>&1 | tail -10

# 5. Restart PM2
echo "🔄 Restarting PM2..."
pm2 restart alshifa 2>&1 || pm2 start npm --name alshifa -- start

# 6. Start Telegram bot service
echo "🤖 Starting Telegram bot service..."
cd "$PROJECT_DIR/mini-services/telegram-bot"
npm install 2>&1 | tail -3
pm2 start index.ts --name alshifa-bot --interpreter ts-node 2>&1 || pm2 restart alshifa-bot

# 7. Save PM2 configuration
pm2 save

# 8. Verify
echo "✅ Verifying..."
sleep 3
curl -s http://localhost:3000/api/telegram | python3 -m json.tool 2>/dev/null || echo "API check done"

echo ""
echo "=========================================="
echo "  ✅ النشر مكتمل!"
echo "=========================================="
