require("dotenv").config();

module.exports = {
  port: process.env.PORT || 443,
  wgInterface: process.env.WG_INTERFACE,
  wgServerName: process.env.WG_SERVER_NAME,
  wgNetwork: process.env.WG_NETWORK,
  wgPublicIP: process.env.WG_PUBLIC_IP,
  wgCountry: process.env.WG_COUNTRY,
  wgConfPath: process.env.WG_CONF_PATH || "/etc/wireguard/wg0.conf"
};
