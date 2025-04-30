const ping = require("ping");
const os = require("os");
const { wgServerName, wgPublicIP, wgCountry } = require("./config");

async function getStatus() {
  const result = await ping.promise.probe("1.1.1.1", { timeout: 1 });
  const load = os.loadavg()[0]; // 1-min average
  return {
    id: wgServerName,
    ip: wgPublicIP,
    load: load.toFixed(2),
    ping: result.time || 0,
    country: wgCountry
  };
}

module.exports = { getStatus };
