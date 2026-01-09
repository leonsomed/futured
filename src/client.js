const https = require("https");
const { encode, parseData } = require("./utils");

function postMessage(peer, message) {
  return new Promise((resolve, reject) => {
    const postData = encode(message);
    const options = {
      rejectUnauthorized: false,
      hostname: peer.host,
      port: peer.port,
      path: "/message",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("error", reject);
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        const data = parseData(body);
        resolve(data);
      });
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

module.exports = {
  postMessage,
};
