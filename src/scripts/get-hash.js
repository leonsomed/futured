const readline = require("node:readline");
const { getTimeHash } = require("../crypto");

async function run() {
  const rl = readline.createInterface({ input: process.stdin });
  console.log(`WARNING: PLEASE READ ⚠️
- Make sure to generate these hashes in an airgap device.
- Make sure to pass a secret and not a namespace.
- Make sure to pass a an epoch timestamp not a string date.

Please enter a timestamp ie: 1768003215066`);
  let timestamp;
  let secret;

  for await (const line of rl) {
    if (!timestamp) {
      timestamp = parseInt(line, 10);
      if (!timestamp || isNaN(timestamp) || timestamp < 0) {
        throw new Error("Missing or invalid first timestamp argument");
      }
      console.log("Now enter the secret:");
    } else {
      secret = line;
      if (!secret) {
        throw new Error("Missing or invalid second secret argument");
      }
      break;
    }
  }

  const hash = getTimeHash(timestamp, secret);
  console.log("Here is your hash:");
  console.log(hash);
  rl.close();
}

run();
