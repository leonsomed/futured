const fs = require("fs/promises");

const files = [
  "state-txt/state-a.json",
  "state-txt/state-b.json",
  "state-txt/state-c.json",
];

const content = JSON.stringify(
  {
    version: 8,
    peers: {
      "localhost:8000": true,
      "localhost:8001": true,
      "localhost:8002": true,
    },
    namespaces: {
      foo: "shhhh222222",
      aaa: "ss",
    },
  },
  null,
  2,
);

async function run() {
  await fs.mkdir("state-txt").catch(() => null);
  await Promise.all(files.map((file) => fs.writeFile(file, content)));
}

run();
