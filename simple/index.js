const http = require("node:http");
const { hash } = require("node:crypto");
const { readFileSync } = require("node:fs");
const path = require("node:path");

const namespaces = JSON.parse(
  readFileSync(path.join(__dirname, "namespaces.json"), "utf8"),
);

if (
  !namespaces ||
  typeof namespaces !== "object" ||
  Array.isArray(namespaces) ||
  Object.values(namespaces).some(
    (secret) => typeof secret !== "string" || !secret,
  )
) {
  throw new Error(
    "namespaces.json must map namespace names to nonempty secrets",
  );
}

// Keep the timestamps of up to five requests per IP in the last second.
const clients = new Map();

const server = http.createServer(async (req, res) => {
  const plainText = req.headers.accept?.trim().toLowerCase() === "text/plain";
  const reply = (status, body) => {
    res.writeHead(status, {
      "Content-Type": plainText ? "text/plain; charset=utf-8" : "application/json",
      "Vary": "Accept",
    });
    res.end(plainText ? (body?.hash ?? body?.error ?? "null") : JSON.stringify(body));
  };
  const ip = req.socket.remoteAddress;
  const now = performance.now();
  const timestamps = (clients.get(ip) ?? []).filter(time => now - time < 1000);
  clients.set(ip, timestamps);
  if (timestamps.length >= 5) {
    res.setHeader("Retry-After", 1);
    return reply(429, { error: "Too many requests" });
  }
  timestamps.push(now);

  if (req.method !== "POST" || req.url !== "/hash") {
    return reply(404, { error: "Use POST /hash" });
  }

  try {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
      if (body.length > 200) return reply(413, { error: "Request too large" });
    }

    let namespace = "";
    let timestamp = 0;
    try {
      const json = JSON.parse(body) ?? {};
      namespace = json.namespace;
      timestamp = json.timestamp;
    } catch {
      return reply(400, {
        error: "Body needs to be valid JSON",
      });
    }

    if (
      typeof namespace !== "string" ||
      !Number.isSafeInteger(timestamp) ||
      timestamp < 0
    ) {
      return reply(400, {
        error:
          "Provide a namespace and nonnegative integer timestamp in milliseconds",
      });
    }

    if (!Object.hasOwn(namespaces, namespace) || timestamp > Date.now()) {
      return reply(200, null);
    }

    reply(200, {
      hash: hash("sha256", `${timestamp}:${namespaces[namespace]}`),
    });
  } catch {
    reply(400, { error: "Invalid request" });
  }
});

server.listen(process.env.PORT ?? 8000, process.env.HOST ?? "127.0.0.1", () => {
  console.log(
    `Listening on http://${server.address().address}:${server.address().port}`,
  );
});
