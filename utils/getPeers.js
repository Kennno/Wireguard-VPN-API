const fs = require('fs');

function getPeers(confPath) {
  const peers = [];
  if (fs.existsSync(confPath)) {
    const conf = fs.readFileSync(confPath, "utf-8");
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

module.exports = getPeers;
