# VPN Server API (WireGuard + HTTPS)

An API to manage WireGuard VPN servers via secure HTTPS endpoints. Easily register and remove clients, generate `.conf` files, and scan-ready QR codes.

---

## Requirements

* Ubuntu Server (20.04 or newer)
* Git
* Node.js (v18+)
* npm (Node Package Manager)
* PM2 (`npm install -g pm2`)
* WireGuard (`sudo apt install wireguard`)
* Certbot (for Let's Encrypt SSL)
* SSL Certificates (Let's Encrypt or self-signed)

---

## Automated Setup (recommended)

1. Make sure `git` is installed (on fresh Ubuntu):

```bash
sudo apt update && sudo apt install -y git
```

2. Clone the repository:

```bash
git clone https://github.com/Kennno/vpn-api.git
cd vpn-api
```

3. Make the setup script executable and run it:

```bash
chmod +x setup.sh
./setup.sh
```

The script will:

* Ask for your domain or IP address
* Install all dependencies (Node.js, WireGuard, Certbot, etc.)
* Request an SSL certificate from Let's Encrypt
* Generate WireGuard server keys
* Write a `.env` file
* Create `wg0.conf`
* Enable and bring up the WireGuard interface
* Start the API using PM2

After completion, your API will be running at `https://your.domain.com`.

---

## Manual Setup

### 1. System preparation

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install snapd curl git wireguard -y
```

### 2. Install Node.js and PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g pm2
```

### 3. Install Certbot (Let's Encrypt)

```bash
sudo snap install core && sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### 4. Obtain SSL certificates

```bash
sudo certbot certonly --standalone -d your.domain.com
```

### 5. Clone the repository

```bash
git clone https://github.com/Kennno/vpn-api.git
cd vpn-api
```

### 6. Create and edit .env file

```bash
cp .env.example .env
nano .env
```

Update values such as:

* `WG_INTERFACE=wg0`
* `WG_PUBLIC_IP=your.domain.com`
* `WG_PORT=51820`
* `WG_DNS=1.1.1.1`
* `WG_SERVER_NAME=MyVPN`
* `WG_NETWORK=10.66.66.0/24`
* `WG_CONF_PATH=/etc/wireguard/wg0.conf`
* `WG_CLIENT_CONF_DIR=./clients`
* `PORT_HTTP=80`
* `PORT_HTTPS=443`
* `SSL_KEY_PATH=$(pwd)/certs/privkey.pem`
* `SSL_CERT_PATH=$(pwd)/certs/fullchain.pem`

### 7. Install dependencies

```bash
npm install
```

### 8. Generate WireGuard server keys

```bash
umask 077
wg genkey | tee /etc/wireguard/server_private.key | wg pubkey > /etc/wireguard/server_public.key
chmod 600 /etc/wireguard/server_private.key
```

### 9. Create SSL symlinks

```bash
mkdir -p certs
ln -sf /etc/letsencrypt/live/your.domain.com/privkey.pem certs/privkey.pem
ln -sf /etc/letsencrypt/live/your.domain.com/fullchain.pem certs/fullchain.pem
```

### 10. Generate wg0.conf

```bash
npm run generate:wgconf
```

This creates a properly formatted WireGuard configuration file at `/etc/wireguard/wg0.conf`.

### 11. Start WireGuard

```bash
sudo systemctl enable wg-quick@wg0
sudo wg-quick up wg0
```

### 12. Start the API

```bash
pm2 start index.js --name vpn-api
pm2 save
pm2 startup
```

Your API is now accessible at `https://your.domain.com`.

---

## API Endpoints

### GET /status

Returns system load, ping, and metadata.

```json
{
  "id": "MyVPN",
  "ip": "your.domain.com",
  "load": 0.18,
  "ping": 25.6,
  "country": "YourCountry"
}
```

### GET /health

Returns server health status.

```json
{ "status": "UP" }
```

### GET /peers

List current connected WireGuard peers.

```json
[
  { "publicKey": "abc...=", "allowedIps": "10.66.66.100/32" },
  { "publicKey": "def...=", "allowedIps": "10.66.66.101/32" }
]
```

### POST /client

Registers a new client and returns `.conf` and QR code.

```bash
curl -X POST https://your.domain.com/client \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Client", "email": "test@example.com"}'
```

```json
{
  "success": true,
  "ip": "10.66.66.10",
  "config": "[Interface]
...",
  "qr": "data:image/png;base64,..."
}
```

### DELETE /client

Removes the peer and deletes matching `.conf` file.

```bash
curl -X DELETE https://your.domain.com/client \
  -H "Content-Type: application/json" \
  -d '{"publicKey": "ABC123...="}'
```

```json
{ "success": true }
```

---

## Security

* HTTPS enforced by default
* CORS enabled globally
* Recommend adding API key auth if public-facing

---

## WireGuard Setup Notes

### Enable IPv4 forwarding

Edit `/etc/sysctl.conf`:

```
net.ipv4.ip_forward=1
```

Apply the setting:

```bash
sudo sysctl -p
```

### Example `/etc/wireguard/wg0.conf`

```ini
[Interface]
Address = 10.66.66.1/24
PrivateKey = <server_private_key>
ListenPort = 51820
SaveConfig = true

PostUp = iptables -t nat -A POSTROUTING -s 10.66.66.0/24 -o eth0 -j MASQUERADE; iptables -A FORWARD -i wg0 -j ACCEPT; iptables -A FORWARD -o wg0 -j ACCEPT
PostDown = iptables -t nat -D POSTROUTING -s 10.66.66.0/24 -o eth0 -j MASQUERADE; iptables -D FORWARD -i wg0 -j ACCEPT; iptables -D FORWARD -o wg0 -j ACCEPT
```

---

## Created and maintained by

[Kenno](https://github.com/Kennno)
