const fs = require("fs/promises");
const { decrypt } = require("./crypto");

// interface State {
//   version: number
//   peers: {
//     [domain: string]: boolean
//   }
//   namespaces: {
//     [namespace: string]: string // secret
//   }
// }

let state = {
  version: 1,
  peers: {},
  namespaces: {},
};

if (!process.env.NAME) {
  throw new Error("Missing NAME env variable");
}

const getStateFilePath = () => `state/state-${process.env.NAME}`;

let disk = null;

async function writeFile(state) {
  if (process.env.DISABLE_WRITE === "true") {
    disk = state;
    return;
  }

  await fs.writeFile(getStateFilePath(), state, {
    encoding: "utf8",
  });
}

async function readFile() {
  if (process.env.DISABLE_WRITE === "true") {
    return disk;
  }

  return fs.readFile(getStateFilePath(), { encoding: "utf8" });
}

function validateState(newState) {
  if (!newState || typeof newState !== "object" || Array.isArray(newState)) {
    console.warn("validateState state is not a valid object");
    return null;
  }

  if (typeof newState.version !== "number" || newState.version < 1) {
    console.warn("validateState version is not valid");
    return null;
  }

  const peers = Object.keys(newState.peers).reduce((acc, next) => {
    acc[next] = true;
    return acc;
  }, {});

  const namespaces = {};
  const namespaceEntries = Object.entries(newState.namespaces);

  for (const [namespace, secret] of namespaceEntries) {
    if (typeof secret !== "string") {
      console.warn("validateState secret not found for namespace");
      return null;
    }

    namespaces[namespace] = secret;
  }

  return {
    version: newState.version,
    peers,
    namespaces,
  };
}

function getState() {
  return state;
}

async function initState() {
  const data = await readFile().catch((e) => {
    console.warn("initState Unable to read file state");
    console.error(e);
    return null;
  });

  if (!data) {
    console.warn("initState Unable to start from file, using default state");
    return;
  }

  const json = await decryptJson(data);
  const decodedState = decodeJson(json);

  if (!decodedState) {
    console.warn(
      "initState Unable to parse state file contents, using default state",
    );
    return;
  }

  const validatedState = validateState(decodedState);

  if (!validatedState) {
    console.warn("initState File state is invalid, using default state");
    return;
  }

  state = validatedState;
}

async function getEncryptedState() {
  return await readFile().catch((e) => {
    console.warn("getEncryptedState Unable to read file state");
    console.error(e);
    return null;
  });
}

async function decryptJson(encryptedState) {
  try {
    return await decrypt(encryptedState);
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error(e);
    }
    return null;
  }
}

function decodeJson(json) {
  try {
    return JSON.parse(json);
  } catch (e) {
    console.warn("Unable to decode json");
    console.error(e);
    return null;
  }
}

async function processPeerState(encryptedState) {
  const json = await decryptJson(encryptedState);
  const newState = validateState(decodeJson(json));

  if (newState) {
    state = newState;

    await writeFile(encryptedState).catch((e) => {
      console.warn("processPeerState Unable to save state to file");
      console.error(e);
    });
  }
}

module.exports = {
  getState,
  getEncryptedState,
  processPeerState,
  initState,
};
