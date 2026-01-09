const crypto = require("crypto");

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;
const KEY_LENGTH = 32;

function getKey() {
  if (!process.env.KEY) {
    console.error("Missing KEY env variable");
    process.exit(1);
  }

  const KEY = Buffer.from(process.env.KEY, "hex");

  if (KEY.length !== KEY_LENGTH) {
    console.error(`KEY env variable is not ${KEY_LENGTH} bytes`);
    process.exit(1);
  }

  return KEY;
}

function createRandomKey() {
  const key = crypto.randomBytes(32);
  return Buffer.from(key).toString("hex");
}

function encrypt(text) {
  const KEY = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

function decrypt(text) {
  const KEY = getKey();
  const [ivHex, encryptedTextHex] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encryptedText = Buffer.from(encryptedTextHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

function getTimeHash(timestamp, secret) {
  return crypto.hash("sha256", `${timestamp}:${secret}`);
}

module.exports = {
  createRandomKey,
  encrypt,
  decrypt,
  getTimeHash,
};
