const voting = artifacts.require("voting");
module.exports = function(deployer) {
 // Deployer le smart contract!
 deployer.deploy(voting);
}