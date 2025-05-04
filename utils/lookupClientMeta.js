const fs = require("fs");
const path = require("path");
const config = require("../config");

function getClientMetaByPublicKey(publicKey) {
  const files = fs.readdirSync(config.wgClientConfDir);

  for (const file of files) {
    const filePath = path.join(config.wgClientConfDir, file);
    const content = fs.readFileSync(filePath, "utf8");

    if (content.includes(`ClientPublicKey: ${publicKey}`)) {
      const nameMatch = content.match(/# Name: (.+)/);
      const emailMatch = content.match(/# Email: (.+)/);
      const telegramMatch = content.match(/# Telegram: (.+)/);
      const createdMatch = content.match(/# Date created: (.+)/);

      return {
        name: nameMatch ? nameMatch[1].trim() : "",
        email: emailMatch ? emailMatch[1].trim() : "",
        telegram: telegramMatch ? telegramMatch[1].trim() : "",
        createdAt: createdMatch ? createdMatch[1].trim() : "",
      };
    }
  }

  return null;
}

module.exports = { getClientMetaByPublicKey };
