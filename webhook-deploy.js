const express = require('express');
const { exec } = require('child_process');
const dotenv = require('dotenv');
const app = express();
const PORT = 4000;

dotenv.config();
const allowedIps = (process.env.ALLOWED_IPS || '').split(',').map(ip => ip.trim());

app.use(express.json());

app.post('/deploy', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const cleanIp = ip.replace('::ffff:', '');

  if (!allowedIps.includes(cleanIp)) {
    console.log(`❌ Blocked request from IP: ${cleanIp}`);
    return res.status(403).send('Forbidden');
  }

  console.log(`✅ Authorized deploy request from: ${cleanIp}`);

  exec('/root/vpn-api/deploy.sh', (err, stdout, stderr) => {
    if (err) {
      console.error(`Deployment error:\n${stderr}`);
      return res.status(500).send('Deployment failed');
    }
    console.log(stdout);
    res.status(200).send('Deployment successful');
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Webhook listener running on port ${PORT}`);
});
