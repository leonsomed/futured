const { MESSAGE_TYPES } = require("./utils");
const { startServer } = require("./server");
const { postMessage } = require("./client");
const {
  getState,
  getEncryptedState,
  initState,
  processPeerState,
} = require("./state");
const { getTimeHash } = require("./crypto");

if (!process.env.SELF) {
  throw new Error("Missing SELF env variable");
}

const SYNC_INTERVAL = 60 * 60 * 1000;

async function handleMessageServer(message, onReponse) {
  const state = getState();

  switch (message.type) {
    case MESSAGE_TYPES.SYNC_CHECK: {
      if (message.version === state.version) {
        onReponse({ type: MESSAGE_TYPES.OK });
        break;
      }

      if (message.version > state.version) {
        onReponse({ type: MESSAGE_TYPES.SYNC_PULL });
        break;
      }

      const encryptedState = await getEncryptedState();

      if (encryptedState) {
        onReponse({
          type: MESSAGE_TYPES.SYNC_PUSH,
          state: encryptedState,
        });
      }
      break;
    }
    case MESSAGE_TYPES.SYNC_PULL: {
      const encryptedState = await getEncryptedState();

      if (encryptedState) {
        onReponse({
          type: MESSAGE_TYPES.SYNC_PUSH,
          state: encryptedState,
        });
      }
      break;
    }
    case MESSAGE_TYPES.SYNC_PUSH: {
      await processPeerState(message.state);

      onReponse({ type: MESSAGE_TYPES.OK });
      break;
    }
    case MESSAGE_TYPES.OK: {
      onReponse({ type: MESSAGE_TYPES.OK });
      break;
    }
    case MESSAGE_TYPES.HASH: {
      const secret = state.namespaces[message.namespace];

      if (!secret || message.timestamp < 0 || message.timestamp > Date.now()) {
        onReponse(null);
        break;
      }

      const hash = getTimeHash(message.timestamp, secret);
      onReponse({ hash });
      break;
    }
    default:
      break;
  }
}

async function handleClientMessage(message) {
  switch (message.type) {
    case MESSAGE_TYPES.SYNC_PULL: {
      const encryptedState = await getEncryptedState();

      if (encryptedState) {
        return {
          type: MESSAGE_TYPES.SYNC_PUSH,
          state: encryptedState,
        };
      }

      return { type: MESSAGE_TYPES.OK };
    }
    case MESSAGE_TYPES.SYNC_PUSH: {
      await processPeerState(message.state);

      return { type: MESSAGE_TYPES.OK };
    }
    case MESSAGE_TYPES.OK: {
      return { type: MESSAGE_TYPES.OK };
    }
    default:
      throw new Error("not supported");
  }
}

let _server;

async function init() {
  await initState();
  server = await startServer(handleMessageServer);

  const runInterval = async () => {
    const state = getState();

    for (const peer of Object.keys(state.peers)) {
      if (process.env.SELF === peer) {
        continue;
      }
      const [host, port] = peer.split(":");

      try {
        let nextMessage = {
          type: MESSAGE_TYPES.SYNC_CHECK,
          version: state.version,
        };

        while (true) {
          const response = await postMessage(
            { host, port: parseInt(port, 10) },
            nextMessage,
          );
          nextMessage = await handleClientMessage(response);

          if (nextMessage.type === MESSAGE_TYPES.OK) {
            break;
          }
        }
      } catch (e) {
        if (e.code === "ECONNREFUSED") {
          console.debug(`peer not available ${peer}`);
          continue;
        }
        console.warn(`Error connecting to peer ${peer}`);
        console.error(e);
      }
    }
  };

  setInterval(runInterval, SYNC_INTERVAL);
  runInterval();
}

process.on("SIGINT", async () => {
  console.log("User initiated shutdown (SIGINT)");
  await _server?.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Process initiated shutdown (SIGTERM)");
  await _server?.close();
  process.exit(0);
});

process.on("uncaughtException", async (e) => {
  console.error("uncaughtException", e);
  await _server?.close();
  process.exit(1);
});

process.on("unhandledRejection", async (e) => {
  console.error("unhandledRejection", e);
  await _server?.close();
  process.exit(1);
});

init();
