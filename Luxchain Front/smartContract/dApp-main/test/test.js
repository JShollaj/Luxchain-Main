const deploy_contracts = require("../migrations/2_deploy_contracts");
const truffleAssert = require("truffle-assertions");
var assert = require("assert");

var LuxChain = artifacts.require("../contracts/LuxChain.sol");

contract("LuxChain", function (accounts) {
  before(async () => {
    LuxChainInstance = await LuxChain.deployed();
  });
  console.log("Testing LuxChain Contract");

  it("Deployed Succesfully", async () => {
    const address = LuxChainInstance.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });

  it("Only admin can Mint", async () => {
    await truffleAssert.reverts(
      LuxChainInstance.mint(accounts[1], "1234321312", "NotValidMinting", {
        from: accounts[3],
      }),
      "Admin only function"
    );
  });

  it("Mint tokens", async () => {
    const minted_token_1 = await LuxChainInstance.mint(
      accounts[1],
      "12345678",
      "LolBag"
    );
    const minted_token_2 = await LuxChainInstance.mint(
      accounts[2],
      "12345999",
      "Bag#2"
    );
    const minted_token_3 = await LuxChainInstance.mint(
      accounts[3],
      "73648374",
      "Bag#3"
    );

    const minted_token_4 = await LuxChainInstance.mint(
      accounts[4],
      "129309320",
      "Bag#4"
    );
    const totalSupply = await LuxChainInstance.getTotalSupply();
    assert.equal(totalSupply, 4);
    // console.log(minted_token_1);
    // console.log(minted_token_2);
    // console.log(minted_token_3);
    // console.log(minted_token_4);
  });

  it("list token names", async () => {
    const totalSupply = await LuxChainInstance.getTotalSupply();

    let bagName;
    let result = [];
    for (var i = 0; i < totalSupply; i++) {
      bagName = await LuxChainInstance.viewName(i);
      console.log(bagName);
      result.push(bagName);
    }

    // console.log(result);

    let expected = ["LolBag", "Bag#2", "Bag#3", "Bag#4"];
    assert.equal(result.join(","), expected.join(","));
  });

  it("list Serial Numbers", async () => {
    const totalSupply = await LuxChainInstance.getTotalSupply();

    let bagId;
    let result = [];
    for (var i = 0; i < totalSupply; i++) {
      bagId = await LuxChainInstance.viewSerialNumber(i);
      // console.log(bagId);
      result.push(bagId);
    }

    // console.log(result);

    let expected = ["12345678", "12345999", "73648374", "129309320"];
    assert.equal(result.join(","), expected.join(","));
  });

  it("Transfer ownership of tokenn", async () => {
    //   await LuxChainInstance.approve(accounts[2], 0, {from: accounts[1]})
    // console.log("Calling approve");
    // console.log(await LuxChainInstance.ownerOf(0));
    let transfer_1 = await LuxChainInstance.transferFrom(
      accounts[1],
      accounts[2],
      0,
      { from: accounts[1] }
    ); // valid token id
    let transfer_2 = await LuxChainInstance.transferFrom(
      accounts[3],
      accounts[4],
      2,
      { from: accounts[3] }
    ); // invalid token id
    // console.log(await LuxChainInstance.ownerOf(0));
    truffleAssert.eventEmitted(transfer_1, "transferEvent");
    assert.equal(await LuxChainInstance.ownerOf(0), accounts[2]);
    assert.equal(await LuxChainInstance.ownerOf(2), accounts[4]);
    //   truffleAssert.eventEmitted(transfer_2, "transferEvent");
  });

  it("Report lost only by owner and admin", async () => {
    
    let lost_1 = await LuxChainInstance.reportlost(0, { from: accounts[2] })
    truffleAssert.eventEmitted(lost_1, "tokenLost");
    assert.equal(await LuxChainInstance.checkState(0), 1);

    // revert the report not from owner or admin
    await truffleAssert.reverts(LuxChainInstance.reportlost(2, { from: accounts[2] }), "Admin or owner only function")
  });

  it("Restore the token only by admin", async () => {
    // admin can restore the token
    let restore_1 = await LuxChainInstance.restoreToken(0, { from: accounts[0] })
    truffleAssert.eventEmitted(restore_1, "tokenrestored");
    assert.equal(await LuxChainInstance.checkState(0), 0);

    // revert the restore not from admin
    await LuxChainInstance.reportlost(0, { from: accounts[2] })
    await truffleAssert.reverts(LuxChainInstance.restoreToken(0, { from: accounts[2] }), "Admin only function")
  });

  it("Invalidate the token only by admin", async () => {
    // admin can invalidate the token
    await LuxChainInstance.restoreToken(0, { from: accounts[0] })
    let invalidate_1 = await LuxChainInstance.invalidateToken(0, { from: accounts[0] })
    truffleAssert.eventEmitted(invalidate_1, "invalidToken");
    assert.equal(await LuxChainInstance.checkState(0), 2);

    // revert the invalidate not from admin
    await truffleAssert.reverts(LuxChainInstance.invalidateToken(2, { from: accounts[2] }), "Admin only function")
  });

});