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

  describe("Testing functionality", () => {

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

      it("Should revert adding proposal from unknown address", async () => {
        await expectRevert(votingInstance.addProposal("This is my proposal", { from: user4 }), "You're not a voter");
      });
    });

    //Testing functionality for getting proposal 
    describe("Getting a proposal", () => {
      before(async () => {
        votingInstance = await Voting.new({ from: owner });
        for (n = 1; n <= 3; n ++) {
          await votingInstance.addVoter(accounts[n], { from: owner });
        }
        await votingInstance.startProposalsRegistering({ from: owner });
        await votingInstance.addProposal("This is my proposal", { from: user1 })
      });

      it("Should get a proposal", async () => {
        proposal = await votingInstance.getOneProposal.call(0, { from: user2 })
        expect(proposal.description).to.equal("This is my proposal");
      });

      it("Should revert getting proposal from unknown address", async () => {
        await expectRevert(votingInstance.getOneProposal(1, { from: user4 }), "You're not a voter");
      });
    });

    //Testing functionality for setting vote 
    describe("Setting vote", () => {
      before(async () => {
        votingInstance = await Voting.new({ from: owner });
        for (n = 1; n <= 4; n ++) {
            await votingInstance.addVoter(accounts[n], { from: owner });
        }
        await votingInstance.startProposalsRegistering({ from: owner });
        for (n = 1; n <= 3; n ++) {
            await votingInstance.addProposal("proposal-${n}", { from: accounts[n] })
        }
        await votingInstance.endProposalsRegistering({ from: owner });
      });

      it("Should revert if voting session have not started yet", async () => {
        await expectRevert(votingInstance.setVote(0, { from: user2 }), "Voting session havent started yet");
      });

      it("Should emit an event when the voting session started", async () => {
        expectEvent(await votingInstance.startVotingSession({ from: owner }), "WorkflowStatusChange", { previousStatus: new BN(2), newStatus: new BN(3) });
      });

      it("Should revert if voter is voting more than once", async () => {
        await votingInstance.setVote(2, { from: user1 })
        await expectRevert(votingInstance.setVote(1, { from: user1 }), "You have already voted");
      });

      it("Should increment vote count after voting for a proposal", async () => {
        proposal = await votingInstance.getOneProposal.call(1, { from: user3 })
        expect(new BN(proposal.voteCount)).to.bignumber.equal(new BN(0));

        await votingInstance.setVote(1, { from: user3 })
        proposal = await votingInstance.getOneProposal.call(1, { from: user3 })
        expect(new BN(proposal.voteCount)).to.bignumber.equal(new BN(1));
      });

      it("Should revert voting for invalid proposal id", async () => {
        await expectRevert(votingInstance.setVote(99, { from: user4 }), "Proposal not found");
      });
    });

    //Testing functionality for votes tallying
    describe("Tallying votes", () => {
      
      beforeEach(async () => {
        votingInstance = await Voting.new({ from: owner });
        for (n = 1; n <= 5; n ++) {
            await votingInstance.addVoter(accounts[n], { from: owner });
        }
        await votingInstance.startProposalsRegistering({ from: owner });
        for (n = 1; n <= 5; n ++) {
            await votingInstance.addProposal("proposal-${n}", { from: accounts[n] })
        }
        await votingInstance.endProposalsRegistering({ from: owner });
        await votingInstance.startVotingSession({ from: owner });
        for (n = 1; n <= 5; n ++) {
            await votingInstance.setVote(n % 2, { from: accounts[n] })
      }
      });

      it("Should revert tally if voting session has not ended", async () => {
        await expectRevert(votingInstance.tallyVotes({ from: owner }), "Current status is not voting session ended");
      });

      it("Should tally votes", async () => {
        await votingInstance.endVotingSession({ from: owner });
        expect(await votingInstance.workflowStatus()).to.bignumber.equal(new BN(4));
        expect(await votingInstance.winningProposalID()).to.bignumber.equal(new BN(0));

        await votingInstance.tallyVotes({ from: owner });
        expect(await votingInstance.winningProposalID()).to.bignumber.equal(new BN(1));
        expect(await votingInstance.workflowStatus()).to.bignumber.equal(new BN(5));
      });

      it("Should emit an event after tally votes", async () => {
        await votingInstance.endVotingSession({ from: owner });
        expectEvent(await votingInstance.tallyVotes({ from: owner }), "WorkflowStatusChange", { previousStatus: new BN(4), newStatus: new BN(5) });
      });

      it("Should revert tallying votes from a voter", async () => {
        await expectRevert(votingInstance.tallyVotes({ from: user1 }), "Ownable: caller is not the owner.");
      });
    });

  });

});