const express = require("express");
const fs = require("fs");
const https = require("https");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const { port } = require("./config");
const { addPeer, removePeer } = require("./wireguard");
const { formatPeersAsConfig } = require("./peers");
const { getStatus } = require("./status");

const { getPeersRawFromConf } = require("./peers");

const { getPeersWithUsage } = require("./peers");

app.get("/peers", (req, res) => {
  try {
    const peers = getPeersWithUsage();
    res.json(peers);
  } catch (err) {
    res.status(500).json({ error: "Failed to load peers", details: err.message });
  }
});

app.post("/add-peer", (req, res) => {
  const { publicKey, ip } = req.body;
  if (!publicKey || !ip) return res.status(400).json({ error: "Missing parameters" });

  const success = addPeer(publicKey, ip);
  res.status(success ? 200 : 500).json({ success });
});

app.post("/remove-peer", (req, res) => {
  const { publicKey } = req.body;
  if (!publicKey) return res.status(400).json({ error: "Missing publicKey" });

  const success = removePeer(publicKey);
  res.status(success ? 200 : 500).json({ success });
});

app.get("/status", async (req, res) => {
  const status = await getStatus();
  res.json(status);
});

app.get("/health", (req, res) => {
  res.send("UP");
});

// HTTPS server
const certOptions = {
  key: fs.readFileSync("certs/privkey.pem"),
  cert: fs.readFileSync("certs/fullchain.pem")
};

https.createServer(certOptions, app).listen(port, () => {
  console.log(`🔒 HTTPS server töötab port ${port}`);
});
