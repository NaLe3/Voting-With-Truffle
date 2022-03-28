const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const Voting = artifacts.require("Voting");
 

contract('Voting', function (accounts) {
  const owner = accounts[0];
  const voter1 = accounts[1];

  beforeEach(async function () {
    this.VotingInstance = await Voting.new();
   });

   
  it("...add a voter", async function () {
    await this.VotingInstance.addVoter(voter1);

    expect(await this.VotingInstance.voters[voter1].isRegistered).to.equal(true);
  });

});


