const express = require("express");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const QRCode = require("qrcode");
const config = require("../config");
const getNextAvailableIP = require("../utils/getNextAvailableIP");

const router = express.Router();

// ➤ Register new client
router.post("/", async (req, res) => {
  const { name = 'Unnamed', email = '', telegram = '' } = req.body;
  const ip = getNextAvailableIP(config.wgConfPath, config.wgNetwork);

  const clientPrivateKey = execSync("wg genkey").toString().trim();
  const clientPublicKey = execSync(`echo ${clientPrivateKey} | wg pubkey`).toString().trim();
  const presharedKey = execSync("wg genpsk").toString().trim();

  const createdAt = new Date();
  createdAt.setUTCHours(createdAt.getUTCHours() + 3);
  const timestamp = createdAt.toISOString().replace("T", " ").split(".")[0];

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

  // Add peer to server config
  fs.appendFileSync(config.wgConfPath, "\n" + peerConfig + "\n");

  try {
    execSync(`wg-quick strip ${config.wgInterface} > /tmp/wg-strip && wg syncconf ${config.wgInterface} /tmp/wg-strip && rm /tmp/wg-strip`);
  } catch (err) {
    console.error("wg syncconf error:", err.message);
  }

  // Save client config
  const filename = name.toLowerCase().replace(/\s+/g, "_") + ".conf";
  const clientPath = path.join(config.wgClientConfDir, filename);
  fs.writeFileSync(clientPath, clientConfig);

  const qr = await QRCode.toDataURL(clientConfig);

  res.json({ success: true, ip, config: clientConfig, qr });
});

// ➤ Remove client
router.delete("/", (req, res) => {
  const { publicKey } = req.body;

  if (!publicKey || typeof publicKey !== "string") {
    return res.status(400).json({ error: "Missing or invalid publicKey" });
  }

  try {
    const lines = fs.readFileSync(config.wgConfPath, "utf-8").split("\n");
    let found = false;
    let newLines = [];
    let skipBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === "[Peer]") {
        skipBlock = false;
        let block = [line];
        let j = i + 1;
        while (j < lines.length && lines[j].trim() !== "[Peer]") {
          block.push(lines[j]);
          if (lines[j].trim() === `PublicKey = ${publicKey}`) {
            found = true;
            skipBlock = true;
          }
          j++;
        }
        if (!skipBlock) {
          newLines = newLines.concat(block);
        }
        i = j - 1;
      } else {
        newLines.push(line);
      }
    }

    if (!found) {
      return res.status(404).json({ error: "Peer not found" });
    }

    fs.writeFileSync(config.wgConfPath, newLines.join("\n").trim() + "\n");
    execSync(`wg-quick strip ${config.wgInterface} > /tmp/wg-strip && wg syncconf ${config.wgInterface} /tmp/wg-strip && rm /tmp/wg-strip`);

    // Remove client config file
    if (fs.existsSync(config.wgClientConfDir)) {
      const files = fs.readdirSync(config.wgClientConfDir);
      const deletedFiles = [];

      for (const file of files) {
        const filePath = path.join(config.wgClientConfDir, file);
        const contents = fs.readFileSync(filePath, "utf8");
        const lines = contents.split("\n");
        const match = lines.find(line => line.includes(`ClientPublicKey: ${publicKey}`));
        if (match) {
          fs.unlinkSync(filePath);
          deletedFiles.push(file);
        }
      }

      console.log("✅ Deleted client config files:", deletedFiles);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error removing peer:", err.message);
    res.status(500).json({ error: "Failed to remove peer" });
  }
});

module.exports = router;
