const express = require("express");
const router = express.Router();
const { getUsageByPublicKey, getTotalUsage } = require("../utils/usage");
const { getClientMetaByPublicKey } = require("../utils/lookupClientMeta");

// ➤ Get usage for specific peer (by publicKey)
router.get("/:publicKey", (req, res) => {
  const publicKey = decodeURIComponent(req.params.publicKey || "");

  if (!publicKey) {
    return res.status(400).json({ error: "Missing publicKey" });
  }

  getUsageByPublicKey(publicKey, (err, usage) => {
    if (err) return res.status(500).json({ error: "Failed to fetch usage" });
    if (!usage) return res.status(404).json({ error: "Peer not found" });

    const meta = getClientMetaByPublicKey(publicKey);
    res.json({
      ...meta,
      ...usage,
    });
  });
});

// ➤ Get total usage across all peers
router.get("/", (req, res) => {
  getTotalUsage((err, data) => {
    if (err) return res.status(500).json({ error: "Failed to fetch total usage" });
    res.json(data);
  });
});

module.exports = router;
