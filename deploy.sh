#!/bin/bash
cd /root/vpn-api || exit
echo "🔄 Pulling latest changes from GitHub..."
git pull origin main

npm install

echo "♻️ Restarting API..."
pm2 restart vpn-api

echo "✅ Deployment complete."
