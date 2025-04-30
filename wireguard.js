const { execSync } = require("child_process");

function addPeer(publicKey, ip) {
  try {
    execSync(`wg set wg0 peer ${publicKey} allowed-ips ${ip}/32`);
    return true;
  } catch (err) {
    console.error("Add peer error:", err.message);
    return false;
  }
}

function removePeer(publicKey) {
  try {
    execSync(`wg set wg0 peer ${publicKey} remove`);
    return true;
  } catch (err) {
    console.error("Remove peer error:", err.message);
    return false;
  }
}

function listPeers() {
  try {
    const output = execSync("wg show all").toString();
    return output;
  } catch (err) {
    console.error("List peer error:", err.message);
    return "";
  }
}

module.exports = { addPeer, removePeer, listPeers };
