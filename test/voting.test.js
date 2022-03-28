const { expect } = require('chai');

contract('Voting', function (accounts) {

  beforeEach(async function () {
    this.VotingInstance = await Voting.new();
   });

});