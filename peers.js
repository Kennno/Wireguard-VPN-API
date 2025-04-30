const { listPeers } = require("./wireguard");

function parsePeers() {
  const raw = listPeers();
  const peers = [];
  const blocks = raw.split("\n\n");

  blocks.forEach(block => {
    const lines = block.split("\n");
    const peer = {};

    lines.forEach(line => {
      if (line.startsWith("peer:")) peer.publicKey = line.split("peer: ")[1].trim();
      if (line.includes("allowed ips")) peer.allowedIps = line.split(":")[1].trim();
    });

    if (peer.publicKey) peers.push(peer);
  });

  return peers;
}

module.exports = { parsePeers };
