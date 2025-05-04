const fs = require('fs');
const path = require('path');
require('dotenv').config();

const configPath = process.env.WG_CONF_PATH || '/etc/wireguard/wg0.conf';
const privateKey = fs.readFileSync('/etc/wireguard/server_private.key', 'utf8').trim();

const interfaceBlock = `[Interface]
Address = ${process.env.WG_NETWORK.replace('.0/24', '.1/24')}
PrivateKey = ${privateKey}
ListenPort = ${process.env.WG_PORT || 51820}
SaveConfig = true

PostUp = iptables -t nat -A POSTROUTING -s ${process.env.WG_NETWORK} -o eth0 -j MASQUERADE; \\
         iptables -A FORWARD -i wg0 -j ACCEPT; \\
         iptables -A FORWARD -o wg0 -j ACCEPT

PostDown = iptables -t nat -D POSTROUTING -s ${process.env.WG_NETWORK} -o eth0 -j MASQUERADE; \\
           iptables -D FORWARD -i wg0 -j ACCEPT; \\
           iptables -D FORWARD -o wg0 -j ACCEPT
`;

fs.writeFileSync(configPath, interfaceBlock);
console.log(`✅ WireGuard config written to ${configPath}`);
