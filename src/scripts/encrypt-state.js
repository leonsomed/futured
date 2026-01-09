const fs = require("fs/promises");
const { encrypt } = require("../crypto");

const files = [
  "state-txt/state-a.json",
  "state-txt/state-b.json",
  "state-txt/state-c.json",
];

async function run() {
  await fs.mkdir("state").catch(() => null);
  const data = await Promise.all(
    files.map(async (file) => ({
      text: await fs.readFile(file, "utf8"),
      file,
    })),
  );

  await Promise.all(
    data.map((next) =>
      fs.writeFile(
        next.file.replace("-txt", "").replace(".json", ""),
        encrypt(next.text),
      ),
    ),
  );
}

run();
