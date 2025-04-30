const express = require("express");
const https = require("https");
const fs = require("fs");
const { port } = require("./config");
const { addPeer, removePeer } = require("./wireguard");
const { getStatus } = require("./status");
const { parsePeers } = require("./peers");

const app = express();
app.use(express.json());

const cors = require("cors");

//lubab kõik päritolu (avatud cors) 
app.use(cors()); 

//kui tahad teha nii, et aind kindel IP saab kasutada, siis pane app.use(cors({ "origin: "IP" }));

// Endpointid
app.get("/status", async (req, res) => {
  const status = await getStatus();
  res.json(status);
});

app.get("/peers", (req, res) => {
  const peers = parsePeers();
  res.json(peers);
});

app.post("/add-peer", (req, res) => {
  const { publicKey, ip } = req.body;
  if (!publicKey || !ip) return res.status(400).json({ error: "Missing publicKey or ip" });

  const success = addPeer(publicKey, ip);
  res.status(success ? 200 : 500).json({ success });
});

app.post("/remove-peer", (req, res) => {
  const { publicKey } = req.body;
  if (!publicKey) return res.status(400).json({ error: "Missing publicKey" });

  const success = removePeer(publicKey);
  res.status(success ? 200 : 500).json({ success });
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
