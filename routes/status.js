const express = require('express');
const os = require('os');
const config = require('../config');

const router = express.Router();

router.get('/status', (req, res) => {
  const load = os.loadavg()[0];
  const ping = Math.random() * 100;

  res.json({
    id: config.wgServerName,
    ip: config.wgPublicIP,
    load: parseFloat(load.toFixed(2)),
    ping: parseFloat(ping.toFixed(1)),
    country: config.wgCountry
  });
});

module.exports = router;
