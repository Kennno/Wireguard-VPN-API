const fs = require("fs");
const { execSync } = require("child_process");
const { wgConfPath, wgInterface } = require("./config");

function getPeersWithUsage() {
  const conf = fs.readFileSync(wgConfPath, "utf8");
  const confLines = conf.split("\n");

  const peers = [];
  let currentPeer = {};
  let currentComments = [];

  confLines.forEach(line => {
    if (line.startsWith("#")) {
      currentComments.push(line);
    } else if (line.startsWith("[Peer]")) {
      if (currentPeer.publicKey) peers.push(currentPeer);
      currentPeer = { comments: currentComments.join("\n") };
      currentComments = [];
    } else if (line.includes("PublicKey")) {
      currentPeer.publicKey = line.split("=")[1].trim();
    } else if (line.includes("AllowedIPs")) {
      currentPeer.allowedIps = line.split("=")[1].trim();
    } else if (line.includes("PresharedKey")) {
      currentPeer.presharedKey = line.split("=")[1].trim();
    } else if (line.includes("PersistentKeepalive")) {
      currentPeer.keepalive = line.split("=")[1].trim();
    }
  });

  if (currentPeer.publicKey) peers.push(currentPeer);

  // Get live usage info
  const wgOutput = execSync(`wg show ${wgInterface}`).toString();
  const wgBlocks = wgOutput.split("peer: ").slice(1);

  wgBlocks.forEach(block => {
    const lines = block.split("\n").map(l => l.trim());
    const publicKey = lines[0];
    const peer = peers.find(p => p.publicKey === publicKey);
    if (!peer) return;

    lines.forEach(line => {
      if (line.startsWith("allowed ips:")) peer.liveAllowedIps = line.split(":")[1].trim();
      if (line.startsWith("endpoint:")) peer.endpoint = line.split(":")[1].trim();
      if (line.startsWith("latest handshake:")) peer.lastHandshake = line.split(":")[1].trim();
      if (line.startsWith("transfer:")) {
        const match = line.match(/transfer: ([^,]+) received, ([^ ]+) sent/);
        if (match) {
          peer.received = match[1];
          peer.transmitted = match[2];
        }
      }
    });
  });

  return peers;
}

module.exports = {
  getPeersWithUsage
};
