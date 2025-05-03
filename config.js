const fs = require("fs");
const { execSync } = require("child_process");
require("dotenv").config();

let publicKey = process.env.PUBLIC_KEY;

if (!publicKey) {
  try {
    const privateKey = fs.readFileSync("/etc/wireguard/server_private.key", "utf-8").trim();
    publicKey = execSync(`echo ${privateKey} | wg pubkey`).toString().trim();
    console.log("✅ Server public key loaded from /etc/wireguard/server_private.key");
  } catch (err) {
    console.warn("⚠️ PUBLIC_KEY not set and could not be derived:", err.message);
    publicKey = "";
  }
}

module.exports = {
  port: process.env.PORT || 443,
  wgInterface: process.env.WG_INTERFACE,
  wgServerName: process.env.WG_SERVER_NAME,
  wgNetwork: process.env.WG_NETWORK,
  wgPublicIP: process.env.WG_PUBLIC_IP,
  wgPort: process.env.WG_PORT || 51820,
  wgCountry: process.env.WG_COUNTRY,
  wgConfPath: process.env.WG_CONF_PATH,
  wgDNS: process.env.WG_DNS || "1.1.1.1",
  wgClientConfDir: process.env.WG_CLIENT_CONF_DIR || "./clients",
  publicKey
};
