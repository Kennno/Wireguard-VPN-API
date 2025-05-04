const { exec } = require("child_process");

// Parse usage for a specific publicKey
function getUsageByPublicKey(publicKey, callback) {
  exec("wg show", (err, stdout) => {
    if (err) return callback(err);

    const peerBlock = stdout
      .split("\n\n")
      .find(block => block.includes(`peer: ${publicKey}`));

    if (!peerBlock) return callback(null, null);

    const rxMatch = peerBlock.match(/transfer: (.+?) received/);
    const txMatch = peerBlock.match(/received, (.+?) sent/);
    const handshakeMatch = peerBlock.match(/latest handshake: (.+)/);

    callback(null, {
      publicKey,
      transferRx: rxMatch ? rxMatch[1] : "0 B",
      transferTx: txMatch ? txMatch[1] : "0 B",
      latestHandshake: handshakeMatch ? handshakeMatch[1].trim() : "Never",
    });
  });
}

// Helpers to parse/format byte values
function parseBytes(str) {
  const units = { B: 1, KiB: 1024, MiB: 1024 ** 2, GiB: 1024 ** 3 };
  const match = str.match(/([\d.]+)\s*(B|KiB|MiB|GiB)/);
  if (!match) return 0;
  return parseFloat(match[1]) * units[match[2]];
}

function formatBytes(bytes) {
  if (bytes >= 1024 ** 3) return (bytes / (1024 ** 3)).toFixed(2) + " GiB";
  if (bytes >= 1024 ** 2) return (bytes / (1024 ** 2)).toFixed(2) + " MiB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(2) + " KiB";
  return bytes + " B";
}

// Calculate total usage across all peers
function getTotalUsage(callback) {
  exec("wg show", (err, stdout) => {
    if (err) return callback(err);

    const peerBlocks = stdout.split("\n\n").filter(block => block.includes("peer:"));

    let totalRx = 0;
    let totalTx = 0;

    peerBlocks.forEach(block => {
      const rxMatch = block.match(/transfer: (.+?) received/);
      const txMatch = block.match(/received, (.+?) sent/);
      totalRx += parseBytes(rxMatch ? rxMatch[1] : "0 B");
      totalTx += parseBytes(txMatch ? txMatch[1] : "0 B");
    });

    callback(null, {
      totalTransferRx: formatBytes(totalRx),
      totalTransferTx: formatBytes(totalTx),
      peersCount: peerBlocks.length,
    });
  });
}

// EXPORT functions
module.exports = {
  getUsageByPublicKey,
  getTotalUsage,
};
