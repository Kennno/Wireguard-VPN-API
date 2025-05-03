# 🌐 VPN Server API (WireGuard + HTTPS)

WIP API to manage WireGuard VPN servers via secure HTTPS endpoints. Easily register and remove clients, generate `.conf` files, and scan-ready QR codes.

---

## 📦 Requirements

- Ubuntu Server (20.04 or newer)
- Node.js (v18+)
- PM2 (`npm install -g pm2`)
- WireGuard (`sudo apt install wireguard`)
- SSL Certificates (Let's Encrypt or self-signed)

---

## 🚀 Installation Guide

### 1. Clone the repository
```bash
git clone https://github.com/Kennno/vpn-api.git
cd vpn-api
```

### 2. Environment setup
```bash
cp .env.example .env
nano .env
```
Update values like:
- `WG_INTERFACE=wg0`
- `WG_PUBLIC_IP=your.domain.com`
- `WG_PORT=51820`
- `WG_DNS=1.1.1.1`
- `WG_SERVER_NAME=MyVPN`
- `WG_NETWORK=10.66.66.0/24`
- `WG_CONF_PATH=/etc/wireguard/wg0.conf`
- `WG_CLIENT_CONF_DIR=./clients`
- `PORT_HTTP=80`
- `PORT_HTTPS=443`
- `SSL_KEY_PATH=/root/vpn-api/certs/privkey.pem`
- `SSL_CERT_PATH=/root/vpn-api/certs/fullchain.pem`
- `WG_COUNTRY=USA` - Optional 
- `WG_SERVER_NAME=USA-vpn` - Optional

### 3. Install dependencies
```bash
npm install
```

### 4. Add SSL certificates
Create the certs folder:
```bash
mkdir certs
```
#### Option A – Let's Encrypt (recommended)
```bash
ln -s /etc/letsencrypt/live/your.domain.com/fullchain.pem certs/fullchain.pem
ln -s /etc/letsencrypt/live/your.domain.com/privkey.pem certs/privkey.pem
```
#### Option B – Self-signed certs
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/privkey.pem -out certs/fullchain.pem
```

### 5. Start the API server
```bash
pm2 start index.js --name vpn-api
pm2 save
pm2 startup
```

Your API is now accessible at: `https://your.domain.com`

---

## 📡 API Endpoints

### `GET /status`
Returns system load, ping and metadata.
```json
{
  "id": "MyVPN",
  "ip": "your.domain.com",
  "load": 0.18,
  "ping": 25.6,
  "country": "YourCountry"
}
```

### `GET /health`
Returns server health status.
```json
{ "status": "UP" }
```

### `GET /peers`
List current connected WireGuard peers.
```json
[
  { "publicKey": "abc...=", "allowedIps": "10.66.66.100/32" },
  { "publicKey": "def...=", "allowedIps": "10.66.66.101/32" }
]
```

### `POST /client`
Registers a new client and returns `.conf` and QR code.

#### Example:
```bash
curl -X POST https://your.domain.com/client \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Client", "email": "test@example.com"}'
```

#### Response:
```json
{
  "success": true,
  "ip": "10.66.66.10",
  "config": "[Interface]\n...",
  "qr": "data:image/png;base64,..."
}
```

### `DELETE /client`
Removes the peer and deletes matching `.conf` file.

#### Example:
```bash
curl -X DELETE https://your.domain.com/client \
  -H "Content-Type: application/json" \
  -d '{"publicKey": "ABC123...="}'
```

#### Response:
```json
{ "success": true }
```

---

## 🔐 Security
- HTTPS enforced by default
- CORS enabled globally
- Recommend to add API key auth if public-facing

---

## ⚙️ WireGuard Setup Notes

### Enable IPv4 forwarding
In `/etc/sysctl.conf`, ensure:
```
net.ipv4.ip_forward=1
```
Then apply:
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

PostUp = iptables -t nat -A POSTROUTING -s 10.66.66.0/24 -o eth0 -j MASQUERADE; \
         iptables -A FORWARD -i wg0 -j ACCEPT; \
         iptables -A FORWARD -o wg0 -j ACCEPT

PostDown = iptables -t nat -D POSTROUTING -s 10.66.66.0/24 -o eth0 -j MASQUERADE; \
           iptables -D FORWARD -i wg0 -j ACCEPT; \
           iptables -D FORWARD -o wg0 -j ACCEPT
```

---

## Created and maintained by:
[Kennno](https://github.com/Kennno)
