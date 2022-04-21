// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./myUSDC.sol";
import "hardhat/console.sol";

contract Dao {
    address public chairMan;
    uint private _minimumQuorum;
    uint private _debatingPeriodDuration;
    uint private _proposalNumber;
    myUSDC private _token;

    event resultProposal(uint id, bool status);
    event newProposal(uint id, string description);
    event userWithdrawal(address sender, uint256 amount);
    event userVote(address voterAddress, bool newVote);

    struct User {
        uint deposit;
        uint frozenTime;
    }

    struct Proposal {
        string description;
        bytes callData;
        address recipient;
        int votes;
        uint endDate;
        uint votedCounter;
        bool result;
        bool status;
    }

    mapping(address => User) private users;
    mapping(uint => Proposal) public proposals;
    mapping(uint => mapping(address => bool)) private votes;


    constructor(address _chairMan, address TokenAddress, uint minimumQuorum, uint debatingPeriodDuration) {
        chairMan = _chairMan;
        _token = myUSDC(TokenAddress);
        _minimumQuorum = minimumQuorum;
        _debatingPeriodDuration = debatingPeriodDuration;
    }

    function deposit(uint amount) external
    {
        require(users[msg.sender].deposit < type(uint256).max, "Too much");

        _token.transferFrom(msg.sender, address(this), amount);
        users[msg.sender].deposit += amount;
    }

    function withdrawal() external
    {
        require(block.timestamp > users[msg.sender].frozenTime, "Time for a vote is not up");

        _token.transfer(msg.sender, users[msg.sender].deposit);
        emit userWithdrawal(msg.sender, users[msg.sender].deposit);

    }

    function addProposal(bytes memory callData, address recipient, string memory description) external
    {
        require(msg.sender == chairMan, "Permission denied");

        proposals[_proposalNumber].description = description;
        proposals[_proposalNumber].callData = callData;
        proposals[_proposalNumber].recipient = recipient;
        proposals[_proposalNumber].endDate = block.timestamp + _debatingPeriodDuration;
        emit newProposal(_proposalNumber, proposals[_proposalNumber].description);
        _proposalNumber += 1;
    }

    function vote(uint proposalId, bool choice) external
    {
        require(proposals[proposalId].endDate > block.timestamp, "This proposal is not found or has already been completed");
        require(votes[proposalId][msg.sender] == false, "You already voted");

        if (users[msg.sender].frozenTime < proposals[proposalId].endDate)
            users[msg.sender].frozenTime = proposals[proposalId].endDate;
        if (choice)
            proposals[proposalId].votes += int(users[msg.sender].deposit);
        else
            proposals[proposalId].votes -= int(users[msg.sender].deposit);

        proposals[proposalId].votedCounter += 1;
        votes[proposalId][msg.sender] = true;
        emit userVote(msg.sender, choice);
    }


    function finishProposal(uint proposalId) external
    {
        require(proposals[proposalId].status == false, "This proposal has been already closed");
        require(block.timestamp > proposals[proposalId].endDate, "Time for a vote is not up");

        if (proposals[proposalId].votes > 0 && proposals[proposalId].votedCounter >= _minimumQuorum)
        {
            runProposal(proposalId);
            proposals[proposalId].result = true;
        }
        else
            proposals[proposalId].result = false;
        proposals[proposalId].status = true;
        emit resultProposal(proposalId, proposals[proposalId].result);
    }

    function runProposal(uint proposalId) private
    {
        (bool success,) = proposals[proposalId].recipient.call{value : 0}(proposals[proposalId].callData);
        require(success, "ERROR call func");
    }
}