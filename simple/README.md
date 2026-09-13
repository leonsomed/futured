# Simple futured

A standalone, dependency-free Node.js server with one operation: `POST /hash`.
Requires Node.js 22 or newer.

Edit `namespaces.json` to map namespace names directly to secrets:

```json
{
  "foo": "replace-with-your-secret",
  "another": "another-secret"
}
```

Namespaces are loaded once at startup. Restart after editing the file. Run from the repository root:

```bash
node simple/index.js
```

## How to request a hash from the API

The default address is `http://127.0.0.1:8000`. Set `HOST` and `PORT` to change it. To request a hash:

```bash
namespace=foo
timestamp=$(node -p 'new Date("2026-01-15T00:00:00.000Z").getTime()')
curl http://127.0.0.1:8000/hash \
  --header 'Content-Type: application/json' \
  --data "{\"namespace\":\"$namespace\",\"timestamp\":$timestamp}"
```

The response is `{"hash":"<64-character SHA-256 hex string>"}`.

Send `Accept: text/plain` to receive just the hash without JSON or quotes:

```bash
curl http://127.0.0.1:8000/hash \
  --header 'Content-Type: application/json' \
  --header 'Accept: text/plain' \
  --data '{"namespace":"foo","timestamp":1767225600000}'
```

With this header, errors are plain text messages and unavailable hashes return
the text `null`. Status codes are unchanged. JSON remains the default for other
Accept values or when the header is omitted. The request body is always JSON.

The hash follows the original project's formula:
`SHA-256("<timestamp>:<secret>")`, encoded as lowercase hex. Timestamps are
nonnegative integer Unix milliseconds and must be at or before the server's
current time. Use the exact timestamp and secret used to encrypt your content.
Unknown namespaces and future timestamps return HTTP 200 with JSON `null`, as in
the original project. Malformed requests return 400; bodies over a few hundred bytes of text
return 413. Only `POST /hash` is supported; other routes or methods return 404.

Each IP can send up to five requests in a rolling one-second window. On each
request, timestamps at least one second old are removed from that IP's array.
If five timestamps remain, the request receives HTTP 429 with `Retry-After: 1`;
otherwise, its timestamp is recorded. Invalid requests and unsupported routes
also count; throttled requests do not. Limits are kept in memory and reset on
restart. IP entries remain in the map; there is no cleanup interval.
The IP comes from the socket; forwarded IP headers are ignored. Behind a reverse
proxy, clients sharing the proxy's IP share this limit.

## How to generate a hash to encrypt your files

It is best to run this in an airgap device. You don't really need to have the whole codebase, simply referenace the implementation of how hashes are generated, here is an example:

```js
node -p 'require("node:crypto").hash("sha256", `${new Date("2026-01-01T00:00:00.000Z").getTime()}:your_secret`)'
```
