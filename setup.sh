#!/bin/bash

echo "=== VPN API Setup Script ==="

read -p "Enter your domain or public IP (used for SSL): " DOMAIN
read -p "Enter WireGuard port [51820]: " WGPORT
WGPORT=${WGPORT:-51820}

echo "📦 Installing dependencies..."
sudo apt update && sudo apt install -y curl snapd wireguard git

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

echo ""
echo "⚠️  CAUTION: Enabling automatic updates allows your server to receive remote code updates."
echo "   - Only IPs listed in .env under ALLOWED_IPS will be able to trigger deploys."
echo "   - If no IPs are listed, webhook will NOT work."
echo "   - This is intended for trusted environments only."
read -p "Do you want to enable automatic updates via Git webhook? [y/N]: " enable_updates

if [[ "$enable_updates" == "y" || "$enable_updates" == "Y" ]]; then
  echo "🔧 Setting up webhook deploy..."

  if grep -q "^ALLOWED_IPS=" .env; then
    echo "✅ Using existing ALLOWED_IPS from .env"
  else
    read -p "Enter one or more allowed IPs (comma-separated): " deploy_ips
    echo "ALLOWED_IPS=$deploy_ips" >> .env
    echo "✅ Added ALLOWED_IPS=$deploy_ips to .env"
  fi

  echo "📝 Creating deploy.sh..."
  cat > /root/vpn-api/deploy.sh <<EOF
#!/bin/bash
cd /root/vpn-api || exit
echo "🔄 Pulling latest changes from GitHub..."
git pull origin main

npm install

echo "♻️ Restarting API..."
pm2 restart vpn-api

echo "✅ Deployment complete."
EOF

  chmod +x /root/vpn-api/deploy.sh

  echo "📝 Creating webhook-deploy.js..."
  cat > /root/vpn-api/webhook-deploy.js <<'EOF'
const express = require('express');
const { exec } = require('child_process');
const dotenv = require('dotenv');
const app = express();
const PORT = 4000;

dotenv.config();
const allowedIps = (process.env.ALLOWED_IPS || '').split(',').map(ip => ip.trim());

app.use(express.json());

app.post('/deploy', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const cleanIp = ip.replace('::ffff:', '');

  if (!allowedIps.includes(cleanIp)) {
    console.log(`❌ Blocked request from IP: ${cleanIp}`);
    return res.status(403).send('Forbidden');
  }

  console.log(`✅ Authorized deploy request from: ${cleanIp}`);

  exec('/root/vpn-api/deploy.sh', (err, stdout, stderr) => {
    if (err) {
      console.error(`Deployment error:\n${stderr}`);
      return res.status(500).send('Deployment failed');
    }
    console.log(stdout);
    res.status(200).send('Deployment successful');
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Webhook listener running on port ${PORT}`);
});
EOF

  echo "🚀 Starting webhook listener..."
  pm2 start /root/vpn-api/webhook-deploy.js --name webhook-listener
  pm2 save

  echo "✅ Webhook deploy setup complete. Server now accepts remote updates from allowed IPs."
else
  echo "ℹ️ Skipping automatic update configuration."
fi

echo "✅ VPN API setup complete. Access at: https://$DOMAIN"
