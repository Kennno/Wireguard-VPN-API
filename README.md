# VPN Server API (WireGuard + HTTPS)

See projekt võimaldab hallata WireGuard VPN serverit API kaudu: lisada/eemaldada peer'e, vaadata staatusi, healthcheck'i ja kasutada HTTPS-i.

## 📦 Nõuded

- Ubuntu server (20.04 või uuem)
- Node.js (18+)
- pm2 (`npm install -g pm2`)
- WireGuard (`sudo apt install wireguard`)
- Sertifikaadid (Let's Encrypt või self-signed)

## 🚀 Paigaldusjuhend

### 1. Klooni projekt

```bash
git clone https://github.com/Kennno/vpn-api.git
cd vpn-api
cp .env.example .env

Muuda .env sisu vastavalt uuele serverile (IP, nimi, maa jne)

### 2. Paigalda sõltuvused
npm install

### 3. Lisa sertifikaadid kataloogi certs/
mkdir certs
ln -s /etc/letsencrypt/live/your.domain.com/fullchain.pem certs/fullchain.pem
ln -s /etc/letsencrypt/live/your.domain.com/privkey.pem certs/privkey.pem
# Asenda your.domain.com sinu domeeniga

### 4. Käivita pm2-ga (paneb backgroundi jooksma)
pm2 start index.js --name vpn-api
pm2 save
pm2 startup

API töötab nüüd aadressil: https://your.domain.com/status


### 5. API endpointid
GET /status – tagastab serveri seisundi

GET /health – ütleb kas server on "UP"

GET /peers – kuvab aktiivsed peer'id

POST /add-peer – lisab peer'i ({publicKey, ip})

POST /remove-peer – eemaldab peer'i ({publicKey})


### 🛡  CORS ja turvalisus
CORS on lubatud. Soovitatav on lisada API võtme kontroll, kui API on avalik.



### PAIGALDUS

git clone https://github.com/Kennno/vpn-api.git
cd vpn-api
cp .env.example .env  # ja muuda ära
npm install
ln -s /etc/letsencrypt/live/[domeen]/fullchain.pem certs/fullchain.pem
ln -s /etc/letsencrypt/live/[domeen]/privkey.pem certs/privkey.pem
pm2 start index.js --name vpn-api
pm2 save
