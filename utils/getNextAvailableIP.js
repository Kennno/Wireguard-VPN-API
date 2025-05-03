const fs = require('fs');

function getNextAvailableIP(confPath, network) {
  const baseIP = network.split(".").slice(0, 3).join(".");
  const usedIPs = new Set();

  if (fs.existsSync(confPath)) {
    const conf = fs.readFileSync(confPath, "utf-8");
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

module.exports = getNextAvailableIP;
