const Voting                            = artifacts.require('Voting');
const { expect }                        = require('chai');
const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');

contract("Voting tests", accounts => {
  const owner = accounts[0];
  const user1 = accounts[1];
  const user2 = accounts[2];
  const user3 = accounts[3];
  const user4 = accounts[4];
  let votingInstance;

  //Testing functionality to add voter
  describe("Adding voters", () => {

    before(async () => {
      votingInstance = await Voting.new({ from: owner });
    });

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

  //Testing functionality to get voter
  describe("Getting a voter", () => {
    before(async () => {
      votingInstance = await Voting.new({ from: owner });
      for (n = 1; n <= 2; n ++) {
        await votingInstance.addVoter(accounts[n], { from: owner });
      }
    });

    it("Should get a voter", async () => {
      const Voter2 = await votingInstance.getVoter.call(user2, { from: user1 });
      expect(Voter2.isRegistered).to.be.equal(true);
    });

    it("Should revert getting a voter from unregistered address", async () => {
      await expectRevert(votingInstance.getVoter(user1, { from: user3 }), "You're not a voter");
    });
  });

  //Testing functionality for proposal registration
  describe("Adding proposals", () => {
    before(async () => {
        votingInstance = await Voting.new({ from: owner });
        for (n = 1; n < 4; n ++) {
            await votingInstance.addVoter(accounts[n], { from: owner });
        }
    });

    it("Should add a proposal", async () => {
        await votingInstance.startProposalsRegistering({ from: owner });
        await votingInstance.addProposal("This is my proposal", { from: user1 });
        expect(await votingInstance.workflowStatus()).to.bignumber.equal(new BN(1));
    });

    it("Should emit an event after adding a proposal", async () => {
        expectEvent(await votingInstance.addProposal("This is my proposal", { from: user3 }), "ProposalRegistered", { proposalId: new BN(1) });
    });
    
    it("Should revert adding an empty proposal", async () => {
        await expectRevert(votingInstance.addProposal("", { from: user3 }), "Vous ne pouvez pas ne rien proposer");
    });

    it("Should revert adding proposal with unknown address", async () => {
        await expectRevert(votingInstance.addProposal("This is my proposal", { from: user4 }), "You're not a voter");
    });
  });


});