const fs = require('fs');
const ip = require('ip');

function getNextAvailableIp(configPath = process.env.WG_CONF_PATH, networkCidr = process.env.WG_NETWORK) {
  if (!fs.existsSync(configPath)) return ip.cidrSubnet(networkCidr).firstAddress.replace(/\.1$/, '.2');

  const content = fs.readFileSync(configPath, 'utf-8');
  const usedIps = Array.from(content.matchAll(/AllowedIPs\s*=\s*(\d+\.\d+\.\d+\.(\d+))\/32/g))
    .map(match => parseInt(match[2]));

  const subnetInfo = ip.cidrSubnet(networkCidr);
  let host = 2;

  while (usedIps.includes(host) && host < 254) {
    host++;
  }

  return subnetInfo.networkAddress.split('.').slice(0, 3).join('.') + `.${host}`;
}

module.exports = getNextAvailableIp;
