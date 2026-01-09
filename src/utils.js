function encode(data) {
  try {
    return JSON.stringify(data);
  } catch {
    return null;
  }
}

function decode(data) {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

const MESSAGE_TYPES = {
  SYNC_CHECK: "SYNC-CHECK",
  SYNC_PUSH: "SYNC-PUSH",
  SYNC_PULL: "SYNC-PULL",
  OK: "OK",
  HASH: "HASH",
};

function validateMessage(rawMessage) {
  if (!rawMessage) {
    return null;
  }

  if (typeof rawMessage !== "object" || Array.isArray(rawMessage)) {
    return null;
  }

  switch (rawMessage.type) {
    case MESSAGE_TYPES.SYNC_CHECK:
      if (typeof rawMessage.version !== "number") {
        return null;
      }
      return rawMessage;
    case MESSAGE_TYPES.SYNC_PUSH:
      if (typeof rawMessage.state !== "string") {
        return null;
      }
      return rawMessage;
    case MESSAGE_TYPES.SYNC_PULL:
      return rawMessage;
    case MESSAGE_TYPES.OK:
      return rawMessage;
    case MESSAGE_TYPES.HASH:
      if (typeof rawMessage.namespace !== "string") {
        return null;
      }
      if (
        typeof rawMessage.timestamp !== "number" ||
        rawMessage.timestamp < 0
      ) {
        return null;
      }
      return rawMessage;
    default:
      return null;
  }
}

function parseData(data) {
  const rawMessage = decode(data);

  if (!rawMessage) {
    return null;
  }

  return validateMessage(rawMessage);
}

if (!process.env.PORT) {
  throw new Error("Missing PORT env variable");
}

module.exports = {
  encode,
  decode,
  parseData,
  MESSAGE_TYPES,
  port: parseInt(process.env.PORT, 10),
};
