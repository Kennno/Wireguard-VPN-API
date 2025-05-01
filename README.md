# VPN Server API (WireGuard + HTTPS)

See projekt võimaldab hallata WireGuard VPN serverit API kaudu: lisada/eemaldada peer'e, vaadata staatusi, healthcheck'i ja kasutada HTTPS-i.

## 📦 Nõuded

- **Ubuntu server** (20.04 või uuem)
- **Node.js** (18+)
- **PM2** (`npm install -g pm2`)
- **WireGuard** (`sudo apt install wireguard`)
- **Sertifikaadid** (Let's Encrypt või self-signed)

## 🚀 Paigaldusjuhend

### 1. Klooni projekt

Klooni projekt ja mine vastavasse kausta:

```bash
git clone https://github.com/Kennno/vpn-api.git
cd vpn-api
Koopia .env faili ja muuda vastavalt serveri seadistusele:

bash
Copy
cp .env.example .env
nano .env
Muuda järgmisi väärtusi oma serveri jaoks:

WG_PUBLIC_IP: Sisesta oma serveri avalik IP.

WG_SERVER_NAME: Serveri nimi, näiteks "USA-vpn".

WG_NETWORK: VPN võrgumask, nt 10.66.66.0/24.

WG_COUNTRY: Serveri asukoht, nt USA.

WG_CONF_PATH: Path WireGuard seadistusfaili jaoks, nt /etc/wireguard/wg0.conf.

2. Paigalda sõltuvused
Käivita järgmine käsk, et paigaldada kõik vajalikud sõltuvused:

bash
Copy
npm install
3. Lisa sertifikaadid kataloogi certs/
Kataloogis certs/ peaks olema olemas SSL sertifikaadid. Kui kasuta Let's Encrypt, loo sümboolne link, et seostada sertifikaadid õigesse kohta.

bash
Copy
mkdir certs
ln -s /etc/letsencrypt/live/your.domain.com/fullchain.pem certs/fullchain.pem
ln -s /etc/letsencrypt/live/your.domain.com/privkey.pem certs/privkey.pem
Asenda your.domain.com oma domeeniga, kus on aktiivne SSL sertifikaat.

4. Käivita API PM2-ga
PM2 aitab käivitada ja hallata serverit taustal. Käivita järgmine käsk, et panna API tööle:

bash
Copy
pm2 start index.js --name vpn-api
pm2 save
pm2 startup
API töötab nüüd aadressil: https://your.domain.com

5. API lõpp-punktid
GET /status – Tagastab serveri seisundi (koos koormuse ja pingi väärtustega).

Vastus:

json
Copy
{
  "id": "USA-vpn",
  "ip": "178.156.146.68",
  "load": 0,
  "ping": 19.8,
  "country": "USA"
}
GET /health – Ütleb kas server on "UP" või "DOWN".

Vastus:

json
Copy
{
  "status": "UP"
}
GET /peers – Kuvab aktiivsed peer'id ja nende konfiguratsioonid.

Vastus:

json
Copy
[
  {
    "publicKey": "FmZqcsYMYPO1cNyASpxv4UEUm41DVF2n72c+imwgzgI=",
    "allowedIps": "10.66.66.100/32"
  },
  {
    "publicKey": "kFgjwNPr9aUwDddo/h4+X+HEQf5voH3R+mu0zFhT6xw=",
    "allowedIps": "10.66.66.101/32"
  }
]
POST /add-peer – Lisab uue peer'i WireGuardi seadistusfaili. Parameetrid: { publicKey, ip }.

Näide päringust:

json
Copy
{
  "publicKey": "aPV7wt2bLjqq6jUX5+aOzePx/i5QFV9ZPAJ5xLz36UM=",
  "ip": "10.66.66.102"
}
Vastus:

json
Copy
{
  "success": true
}
POST /remove-peer – Eemaldab peer'i WireGuardi seadistusfailist. Parameeter: { publicKey }.

Näide päringust:

json
Copy
{
  "publicKey": "aPV7wt2bLjqq6jUX5+aOzePx/i5QFV9ZPAJ5xLz36UM="
}
Vastus:

json
Copy
{
  "success": true
}
🛡 CORS ja turvalisus
API-l on CORS lubatud. Kui API on avalik, siis on soovitatav lisada API võtme kontroll turvalisuse tagamiseks.

⚙️ Paigaldus: Üksikasjalik juhend
Klooni projekt ja mine kausta:

bash
Copy
git clone https://github.com/Kennno/vpn-api.git
cd vpn-api
Kopeeri .env.example ja muuda väärtused:

bash
Copy
cp .env.example .env
nano .env
Paigalda vajalikud sõltuvused:

bash
Copy
npm install
Lisa SSL sertifikaadid: Kui kasutad Let's Encrypt sertifikaate, loo sümboolsed lingid järgmiselt:

bash
Copy
ln -s /etc/letsencrypt/live/your.domain.com/fullchain.pem certs/fullchain.pem
ln -s /etc/letsencrypt/live/your.domain.com/privkey.pem certs/privkey.pem
Käivita API taustal PM2 abil:

bash
Copy
pm2 start index.js --name vpn-api
pm2 save
pm2 startup
API töötab nüüd aadressil https://your.domain.com.
