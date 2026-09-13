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

The hash follows the original project's formula:
`SHA-256("<timestamp>:<secret>")`, encoded as lowercase hex. Timestamps are
nonnegative integer Unix milliseconds and must be at or before the server's
current time. Use the exact timestamp and secret used to encrypt your content.
Unknown namespaces and future timestamps return HTTP 200 with JSON `null`, as in
the original project. Malformed requests return 400; bodies over a few hundred bytes of text
return 413. Only `POST /hash` is supported; other routes or methods return 404.

## How to generate a hash to encrypt your files

It is best to run this in an airgap device. You don't really need to have the whole codebase, simply referenace the implementation of how hashes are generated, here is an example:

```js
node -p 'require("node:crypto").hash("sha256", `${new Date("2026-01-01T00:00:00.000Z").getTime()}:your_secret`)'
```
