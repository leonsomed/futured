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

const server = http.createServer(async (req, res) => {
  const reply = (status, body) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  };
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
