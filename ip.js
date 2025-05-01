const usedIPs = new Set();

function getNextAvailableIP(base = "10.66.66.", start = 2) {
  let i = start;
  while (usedIPs.has(`${base}${i}`)) {
    i++;
  }
  const ip = `${base}${i}`;
  usedIPs.add(ip);
  return ip;
}

module.exports = { getNextAvailableIP };
