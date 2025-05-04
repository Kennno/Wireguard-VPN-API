const fs = require('fs');
require('dotenv').config();

const configPath = process.env.WG_CONF_PATH || '/etc/wireguard/wg0.conf';
const network = process.env.WG_NETWORK || '10.66.66.0/24';
const serverIp = network.replace(/0\/24$/, '1/24');
const port = process.env.WG_PORT || 51820;
const iface = process.env.WG_INTERFACE || 'wg0';
const externalInterface = 'eth0';

let privateKey;
try {
  privateKey = fs.readFileSync('/etc/wireguard/server_private.key', 'utf8').trim();
} catch (err) {
  console.error('❌ Cannot read server_private.key. Make sure it exists.');
  process.exit(1);
}

const config = [
  '[Interface]',
  `Address = ${serverIp}`,
  `PrivateKey = ${privateKey}`,
  `ListenPort = ${port}`,
  'SaveConfig = true',
  `PostUp = iptables -t nat -A POSTROUTING -s ${network} -o ${externalInterface} -j MASQUERADE; iptables -A FORWARD -i ${iface} -j ACCEPT; iptables -A FORWARD -o ${iface} -j ACCEPT`,
  `PostDown = iptables -t nat -D POSTROUTING -s ${network} -o ${externalInterface} -j MASQUERADE; iptables -D FORWARD -i ${iface} -j ACCEPT; iptables -D FORWARD -o ${iface} -j ACCEPT`
].join('\n');

fs.writeFileSync(configPath, config + '\n');
console.log(`✅ Generated clean WireGuard config at: ${configPath}`);
