const express = require("express");
const fs = require("fs");
const http = require("http");
const https = require("https");
const cors = require("cors");
const config = require("./config");

const app = express();
app.use(cors());
app.use(express.json());

// ➤ HTTP → HTTPS redirect
app.use((req, res, next) => {
  if (!req.secure && req.headers.host) {
    return res.redirect("https://" + req.headers.host + req.url);
  }
  next();
});

// ➤ Routes
app.use(require("./routes/status"));
app.use(require("./routes/peers"));
app.use('/register-client', require('./routes/register-client')); // router.post("/")
app.use('/remove-client', require('./routes/remove-client'));     // router.delete("/")

// ➤ HTTPS server
const httpsOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH || "certs/privkey.pem"),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH || "certs/fullchain.pem")
};

https.createServer(httpsOptions, app).listen(config.port, () => {
  console.log(`🔒 HTTPS server running on port ${config.port}`);
});

// ➤ HTTP server (redirect only)
http.createServer(app).listen(process.env.PORT_HTTP || 80, () => {
  console.log(`🌐 HTTP server running on port ${process.env.PORT_HTTP || 80} (redirects to HTTPS)`);
});
