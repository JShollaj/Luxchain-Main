const LuxChain = artifacts.require("LuxChain")

module.exports = (deployer, network, accounts) => {
    deployer.deploy(LuxChain, "Apple", "AAPL")
}