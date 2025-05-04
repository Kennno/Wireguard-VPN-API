#!/bin/bash

echo "=== VPN API Setup Script ==="

read -p "Enter your domain or public IP (used for SSL): " DOMAIN
read -p "Enter WireGuard port [51820]: " WGPORT
WGPORT=${WGPORT:-51820}

echo "📦 Installing dependencies..."
sudo apt update && sudo apt install -y curl snapd wireguard git

echo "📦Enabling IPv4 forwarding..."
grep -q '^net.ipv4.ip_forward=1' /etc/sysctl.conf || echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

echo "📦 Installing Node.js and PM2..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g pm2

echo "🔐 Installing Certbot..."
sudo snap install core && sudo snap refresh core
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot

echo "🔐 Getting SSL certificate via Let's Encrypt..."
sudo certbot certonly --standalone -d "$DOMAIN"

echo "🧾 Creating .env file..."
cat > .env <<EOF
WG_INTERFACE=wg0
WG_PUBLIC_IP=$DOMAIN
WG_PORT=$WGPORT
WG_DNS=1.1.1.1
WG_SERVER_NAME=MyVPN
WG_NETWORK=10.66.66.0/24
WG_CONF_PATH=/etc/wireguard/wg0.conf
WG_CLIENT_CONF_DIR=./clients
PORT_HTTP=80
PORT_HTTPS=443
SSL_KEY_PATH=$(pwd)/certs/privkey.pem
SSL_CERT_PATH=$(pwd)/certs/fullchain.pem
EOF

echo "🔑 Generating WireGuard server keys..."
umask 077
wg genkey | tee /etc/wireguard/server_private.key | wg pubkey > /etc/wireguard/server_public.key
chmod 600 /etc/wireguard/server_private.key

echo "📁 Creating cert links..."
mkdir -p certs
ln -sf /etc/letsencrypt/live/$DOMAIN/privkey.pem certs/privkey.pem
ln -sf /etc/letsencrypt/live/$DOMAIN/fullchain.pem certs/fullchain.pem

echo "📦 Installing Node packages..."
npm install

echo "⚙️ Generating wg0.conf..."
npm run generate:wgconf

echo "🚀 Starting WireGuard..."
sudo systemctl enable wg-quick@wg0
sudo wg-quick up wg0

echo "🚀 Starting VPN API with PM2..."
pm2 start index.js --name vpn-api
pm2 save
pm2 startup

echo "✅ VPN API setup complete. Access at: https://$DOMAIN"
