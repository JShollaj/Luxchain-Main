var crypto = require("crypto");

const encryption = require("./encryption.json");

function encryption(information) {
  let toEncrypt = Buffer.from(information, "utf8");
  let encrypted = crypto
    .publicEncrypt(encryption.key, toEncrypt)
    .toString("base64");
  return encrypted;
}
