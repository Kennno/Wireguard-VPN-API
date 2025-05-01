require("dotenv").config();
const express = require("express");
const fs = require("fs");
const https = require("https");
const cors = require("cors");
const os = require("os");
const { execSync } = require("child_process");
const QRCode = require("qrcode");
const config = require("./config");

const app = express();
app.use(cors());
app.use(express.json());

// ➤ /status endpoint
app.get("/status", (req, res) => {
  const load = os.loadavg()[0];
  const ping = Math.random() * 100;

  res.json({
    id: config.wgServerName,
    ip: config.wgPublicIP,
    load: parseFloat(load.toFixed(2)),
    ping: parseFloat(ping.toFixed(1)),
    country: config.wgCountry
  });
});

// ➤ /peers endpoint
app.get("/peers", (req, res) => {
  const peers = getPeers();
  res.json(peers);
});

// ➤ getPeers util
function getPeers() {
  const peers = [];
  if (fs.existsSync(config.wgConfPath)) {
    const conf = fs.readFileSync(config.wgConfPath, "utf-8");
    const peerMatches = conf.match(/PublicKey\s*=\s*(\S+)/g);
    if (peerMatches) {
      peerMatches.forEach((match) => {
        const peerPublicKey = match.split("=")[1].trim();
        peers.push({ publicKey: peerPublicKey, allowedIps: "0.0.0.0/0" });
      });
    }
  }
  return peers;
}

// ➤ getNextAvailableIP util
function getNextAvailableIP() {
  const baseIP = config.wgNetwork.split(".").slice(0, 3).join(".");
  const usedIPs = new Set();

  if (fs.existsSync(config.wgConfPath)) {
    const conf = fs.readFileSync(config.wgConfPath, "utf-8");
    const matches = conf.match(/AllowedIPs\s*=\s*(\d+\.\d+\.\d+\.\d+)/g);
    if (matches) {
      matches.forEach((m) => usedIPs.add(m.split("=")[1].trim()));
    }
  }

  for (let i = 2; i < 255; i++) {
    const candidate = `${baseIP}.${i}`;
    if (!usedIPs.has(candidate)) return candidate;
  }

  throw new Error("No available IPs");
}

// ➤ /register-client endpoint
app.post("/register-client", async (req, res) => {
  const name = req.body.name || "Unnamed";
  const email = req.body.email || "";
  const telegram = req.body.telegram || "";
  const ip = req.body.ip || getNextAvailableIP();

  const clientPrivateKey = execSync("wg genkey").toString().trim();
  const clientPublicKey = execSync(`echo ${clientPrivateKey} | wg pubkey`).toString().trim();
  const presharedKey = execSync("wg genpsk").toString().trim();

  const clientConfig = ` 
# Name: ${name}
# Email: ${email}
# Telegram: ${telegram}
# Created at: ${new Date().toISOString()}

[Interface]
PrivateKey = ${clientPrivateKey}
Address = ${ip}/32
DNS = 1.1.1.1

[Peer]
PublicKey = ${config.publicKey}
PresharedKey = ${presharedKey}
Endpoint = ${config.wgPublicIP}:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
`;

  const peerConfig = `
# Name: ${name}
# Email: ${email}
# Telegram: ${telegram}
# Created at: ${new Date().toISOString()}

[Peer]
PublicKey = ${clientPublicKey}
PresharedKey = ${presharedKey}
AllowedIPs = ${ip}/32
PersistentKeepalive = 25
`;

  // Lisa serveri conf-i
  fs.appendFileSync(config.wgConfPath, peerConfig + "\n");

  try {
    execSync(`wg syncconf ${config.wgInterface} <(wg-quick strip ${config.wgInterface})`, { shell: "/bin/bash" });
  } catch (err) {
    console.error("wg syncconf error:", err.message);
  }

  const qr = await QRCode.toDataURL(clientConfig);

  res.json({
    success: true,
    ip,
    config: clientConfig.trim(),
    qr
  });
});

// ➤ HTTPS käivitus
const httpsOptions = {
  key: fs.readFileSync("certs/privkey.pem"),
  cert: fs.readFileSync("certs/fullchain.pem")
};

https.createServer(httpsOptions, app).listen(config.port, () => {
  console.log(`🔒 HTTPS server töötab port ${config.port}`);
});
