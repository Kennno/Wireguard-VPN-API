const express = require("express");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const config = require("../config");

const router = express.Router();

router.delete("/", (req, res) => {
  const { publicKey } = req.body;

  if (!publicKey || typeof publicKey !== "string") {
    return res.status(400).json({ error: "Missing or invalid publicKey" });
  }

  try {
    const lines = fs.readFileSync(config.wgConfPath, "utf-8").split("\n");
    let found = false;
    let newLines = [];
    let skipBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === "[Peer]") {
        skipBlock = false;
        let block = [line];
        let j = i + 1;
        while (j < lines.length && lines[j].trim() !== "[Peer]") {
          block.push(lines[j]);
          if (lines[j].trim() === `PublicKey = ${publicKey}`) {
            found = true;
            skipBlock = true;
          }
          j++;
        }
        if (!skipBlock) {
          newLines = newLines.concat(block);
        }
        i = j - 1;
      } else {
        newLines.push(line);
      }
    }

    if (!found) {
      return res.status(404).json({ error: "Peer not found" });
    }

    fs.writeFileSync(config.wgConfPath, newLines.join("\n").trim() + "\n");

    const tmp = "/tmp/wg-stripped.conf";
    execSync(`wg-quick strip ${config.wgInterface} > ${tmp} && wg syncconf ${config.wgInterface} ${tmp} && rm ${tmp}`);

    // Remove matching .conf file(s) by exact match
    if (fs.existsSync(config.wgClientConfDir)) {
      const files = fs.readdirSync(config.wgClientConfDir);
      const deletedFiles = [];

      for (const file of files) {
        const filePath = path.join(config.wgClientConfDir, file);
        const contents = fs.readFileSync(filePath, "utf8");
        const lines = contents.split("\n");
	const match = lines.find(line => line.includes(`ClientPublicKey: ${publicKey}`));
        if (match) {
          fs.unlinkSync(filePath);
          deletedFiles.push(file);
        }
      }

      console.log("✅ Deleted client config files:", deletedFiles);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Error removing peer:", err.message);
    res.status(500).json({ error: "Failed to remove peer" });
  }
});

module.exports = router;
