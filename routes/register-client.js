const express = require("express");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const QRCode = require("qrcode");
const getNextAvailableIP = require("../utils/getNextAvailableIP");
const config = require("../config");

const router = express.Router();

router.post("/", async (req, res) => {
  const { name = "Unnamed", email = "", telegram = "" } = req.body;

  // 1️⃣ IP aadress valitakse automaatselt
  const ip = getNextAvailableIP(config.wgConfPath, config.wgNetwork);

  // 2️⃣ Genereeritakse võtmed
  const clientPrivateKey = execSync("wg genkey").toString().trim();
  const clientPublicKey = execSync(`echo ${clientPrivateKey} | wg pubkey`).toString().trim();
  const presharedKey = execSync("wg genpsk").toString().trim();

  // 3️⃣ Ajatempel UTC+3
  const createdAt = new Date();
  createdAt.setUTCHours(createdAt.getUTCHours() + 3);
  const timestamp = createdAt.toISOString().replace("T", " ").split(".")[0];

  // 4️⃣ Kliendi konfiguratsioon (QR ja konfifail)
  const clientConfig = `
# Name: ${name}
# Email: ${email}
# Telegram: ${telegram}
# Date created: ${timestamp}
# ClientPublicKey: ${clientPublicKey}

[Interface]
PrivateKey = ${clientPrivateKey}
Address = ${ip}/32
DNS = ${config.wgDNS || "1.1.1.1"}

[Peer]
PublicKey = ${config.publicKey}
PresharedKey = ${presharedKey}
Endpoint = ${config.wgPublicIP}:${config.wgPort}
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
`.trim();

  // 5️⃣ Peer serveri jaoks
  const peerConfig = `
# Name: ${name}
# Email: ${email}
# Telegram: ${telegram}
# Date created: ${timestamp}

[Peer]
PublicKey = ${clientPublicKey}
PresharedKey = ${presharedKey}
AllowedIPs = ${ip}/32
PersistentKeepalive = 25
`.trim();

  // 6️⃣ Lisa serveri WireGuard konfi lõppu
  fs.appendFileSync(config.wgConfPath, "\n\n" + peerConfig);

  // 7️⃣ Rakenda uus konf turvaliselt
  try {
    const tmp = "/tmp/wg-stripped.conf";
    execSync(`wg-quick strip ${config.wgInterface} > ${tmp} && wg syncconf ${config.wgInterface} ${tmp} && rm ${tmp}`);
    console.log("✅ WireGuard config applied");
  } catch (err) {
    console.error("❌ wg syncconf error:", err.message);
  }

  // 8️⃣ Salvesta kliendi .conf fail kataloogi
  try {
    if (!fs.existsSync(config.wgClientConfDir)) {
      fs.mkdirSync(config.wgClientConfDir, { recursive: true, mode: 0o700 });
    }

    const safeFilename = name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const clientFilePath = path.join(config.wgClientConfDir, `${safeFilename}.conf`);
    fs.writeFileSync(clientFilePath, clientConfig);
  } catch (err) {
    console.error("❌ Failed to write client config file:", err.message);
  }

  // 9️⃣ Genereeri QR
  const qr = await QRCode.toDataURL(clientConfig);

  // 🔟 Tagasta JSON
  res.json({
    success: true,
    ip,
    config: clientConfig,
    qr
  });
});

module.exports = router;
