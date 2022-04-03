const Voting                            = artifacts.require('Voting');
const { expect }                        = require('chai');
const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');

contract("Voting tests", accounts => {
  const owner = accounts[0];
  const user1 = accounts[1];
  const user2 = accounts[2];
  const user3 = accounts[3];
  const user4 = accounts[4];
  const user5 = accounts[5];
  let votingInstance;

  // Create a new instance of voting contract before all the tests in a describe
  before(async () => {
    votingInstance = await Voting.new({ from: owner });
  });

  //Testing functionality to add voter
  describe("Adding voters", () => {

    it("Should start at first workflow status", async () => {
      expect(await votingInstance.workflowStatus()).to.bignumber.equal(new BN(0));
    });

    it("Should add voters", async () => {
      await votingInstance.addVoter(user1, { from: owner });
      await votingInstance.addVoter(user2, { from: owner });
      let getVoter1 = await votingInstance.getVoter.call(user2, { from: user1 });
      expect(getVoter1.isRegistered).to.be.equal(true);
      let getVoter2 = await votingInstance.getVoter.call(user2, { from: user1 });
      expect(getVoter2.isRegistered).to.be.equal(true);

      //Check a non existing voter
      let getVoter3 = await votingInstance.getVoter.call(user3, { from: user1 });
      expect(getVoter3.isRegistered).to.be.equal(false);
    });

    it("Should emit an event adding a voter", async () => {
      expectEvent(await votingInstance.addVoter(user3, { from: owner }), "VoterRegistered", { voterAddress: user3 });
    });

    it("Should revert adding a voter already registered", async () => {
      await votingInstance.addVoter(user4, { from: owner });
      await expectRevert(votingInstance.addVoter(user4, { from: owner }), "Already registered");
    });

    it("Should revert adding a voter not from the owner", async () => {
        await expectRevert(votingInstance.addVoter(user1, { from: user2 }), "Ownable: caller is not the owner.");
    });
  });

});