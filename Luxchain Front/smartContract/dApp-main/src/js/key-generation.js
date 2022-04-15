const keypair = require("keypair");
const fs = require("fs");

function keyGeneration() {
  var pair = keypair();

  var publicKey = JSON.stringify({ key: pair["public"] });
  var privateKey = JSON.stringify({ key: pair["private"] });

  function callBack(error) {
    if (error) {
      console.log("An error occured while writing JSON Object to File.");
      return console.log(error);
    }
    console.log("JSON file has been saved.");
  }

  fs.writeFile("encryption-key.json", publicKey, "utf8", callBack);
  fs.writeFile("decryption-key.json", privateKey, "utf8", callBack);
}

keyGeneration();
