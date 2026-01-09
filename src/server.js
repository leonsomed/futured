const https = require("https");
const fs = require("fs");
const { parseData, port } = require("./utils");

async function getReqBody(req) {
  return new Promise((resolve, reject) => {
    let body = [];
    req.on("data", (chunk) => {
      body.push(chunk);
    });
    req.on("error", reject);
    req.on("end", () => {
      resolve(Buffer.concat(body).toString());
    });
  });
}

async function startServer(onMessage) {
  const options = {
    key: fs.readFileSync("server-key.pem"),
    cert: fs.readFileSync("server-cert.pem"),
  };

  const server = https.createServer(options, async (req, res) => {
    try {
      const url = req.url ?? "";
      const endpoint = url.substring(url.indexOf("/") + 1);
      const sendResponse = (data) => {
        res.writeHead(200);
        res.end(JSON.stringify(data));
      };

      if (req.method.toUpperCase() === "GET") {
        // all GET endpoints
        console.warn("endpoint not supported GET", endpoint);
        res.writeHead(404);
        res.end(JSON.stringify({ code: "not-found" }));
      } else if (
        req.method.toUpperCase() === "POST" &&
        endpoint === "message"
      ) {
        // all POST endpoints
        const data = await getReqBody(req);
        const message = parseData(data);

        if (!message) {
          res.writeHead(404);
          res.end(JSON.stringify({ code: "not-found" }));
          return;
        }

        onMessage(message, sendResponse);
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ code: "not-found" }));
      }
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.error(e);
      }

      res.writeHead(400);
      res.end(JSON.stringify({ code: "unknown error" }));
    }
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`TLS server listening on port ${port}`);
      resolve(server);
    });
  });
}

module.exports = {
  startServer,
};
