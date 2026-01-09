const fs = require("fs/promises");
const { createRandomKey } = require("../crypto");

async function run() {
  await fs.writeFile(".env.new", `KEY=${createRandomKey()}`);
}

run();
