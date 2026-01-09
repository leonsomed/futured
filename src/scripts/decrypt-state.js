const fs = require("fs/promises");
const { decrypt } = require("../crypto");

const files = ["state/state-a", "state/state-b", "state/state-c"];

async function run() {
  const data = await Promise.allSettled(
    files.map((file) => fs.readFile(file, "utf8")),
  );

  console.log(
    data.map((result) =>
      result.value ? JSON.parse(decrypt(result.value)) : null,
    ),
  );
}

run();
