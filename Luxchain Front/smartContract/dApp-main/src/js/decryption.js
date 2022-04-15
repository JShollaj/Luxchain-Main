var crypto = require("crypto");

const decryption = require("./decryption.json");

function decryption(encrypted) {
  let toDecrypt = Buffer.from(encrypted, "base64");
  let decrypted = crypto
    .privateDecrypt(decryption.key, toDecrypt)
    .toString("utf8");
  return decrypted;
}
