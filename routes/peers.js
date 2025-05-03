const express = require('express');
const getPeers = require('../utils/getPeers');
const config = require('../config');

const router = express.Router();

router.get('/peers', (req, res) => {
  const peers = getPeers(config.wgConfPath);
  res.json(peers);
});

module.exports = router;
