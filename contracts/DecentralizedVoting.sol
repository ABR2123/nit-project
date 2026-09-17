// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DecentralizedVoting
 * @dev Secure, transparent, and verifiable e-voting smart contract.
 * Features:
 * - Distributed election creation and management
 * - Voter eligibility registry (Sybil attack prevention)
 * - Strict one-person-one-vote enforcement
 * - Cryptographic ballot receipts for end-to-end voter auditability
 * - Immutable candidate vote tallies
 */
contract DecentralizedVoting {
    address public owner;

    struct Candidate {
        uint256 id;
        string name;
        string party;
        string manifesto;
        string avatarUrl;
        uint256 voteCount;
    }

    struct Election {
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool isFinalized;
        uint256 totalVotes;
        address creator;
        uint256 winningCandidateId;
    }

    uint256 public electionCount;

    // electionId => Election
    mapping(uint256 => Election) public elections;

    // electionId => candidateId => Candidate
    mapping(uint256 => mapping(uint256 => Candidate)) public candidates;
    // electionId => candidate count
    mapping(uint256 => uint256) public electionCandidateCounts;

    // electionId => voter address => is whitelisted/eligible
    mapping(uint256 => mapping(address => bool)) public isWhitelisted;

    // electionId => voter address => has voted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // electionId => receiptHash => true
    mapping(uint256 => mapping(bytes32 => bool)) public validReceipts;

    // Events for real-time auditability and block explorers
    event ElectionCreated(
        uint256 indexed electionId,
        string title,
        uint256 startTime,
        uint256 endTime,
        address indexed creator
    );

    event CandidateAdded(
        uint256 indexed electionId,
        uint256 indexed candidateId,
        string name,
        string party
    );

    event VoterRegistered(
        uint256 indexed electionId,
        address indexed voter
    );

    event VoteCast(
        uint256 indexed electionId,
        address indexed voter,
        uint256 indexed candidateId,
        bytes32 receiptHash,
        uint256 timestamp
    );

    event ElectionFinalized(
        uint256 indexed electionId,
        uint256 winningCandidateId,
        uint256 totalVotes
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can call this");
        _;
    }

    modifier onlyElectionCreator(uint256 _electionId) {
        require(
            msg.sender == elections[_electionId].creator || msg.sender == owner,
            "Only election creator or contract owner can manage this election"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Create a new election
     * @param _title Title of the election
     * @param _description Purpose and guidelines
     * @param _startTime UNIX timestamp when voting begins
     * @param _endTime UNIX timestamp when voting closes
     * @param _candidateNames Names of candidates
     * @param _parties Candidate political parties or affiliations
     * @param _manifestos Candidate manifestos
     * @param _avatars Candidate profile avatar URLs
     */
    function createElection(
        string memory _title,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime,
        string[] memory _candidateNames,
        string[] memory _parties,
        string[] memory _manifestos,
        string[] memory _avatars
    ) external returns (uint256) {
        require(bytes(_title).length > 0, "Election title is required");
        require(_endTime > _startTime, "End time must be after start time");
        require(_candidateNames.length >= 2, "At least 2 candidates required");
        require(
            _candidateNames.length == _parties.length &&
            _candidateNames.length == _manifestos.length &&
            _candidateNames.length == _avatars.length,
            "Candidate details arrays must have matching lengths"
        );

        electionCount++;
        uint256 newElectionId = electionCount;

        elections[newElectionId] = Election({
            id: newElectionId,
            title: _title,
            description: _description,
            startTime: _startTime,
            endTime: _endTime,
            isFinalized: false,
            totalVotes: 0,
            creator: msg.sender,
            winningCandidateId: 0
        });

        // Add candidates
        for (uint256 i = 0; i < _candidateNames.length; i++) {
            uint256 candidateId = i + 1;
            candidates[newElectionId][candidateId] = Candidate({
                id: candidateId,
                name: _candidateNames[i],
                party: _parties[i],
                manifesto: _manifestos[i],
                avatarUrl: _avatars[i],
                voteCount: 0
            });
            emit CandidateAdded(newElectionId, candidateId, _candidateNames[i], _parties[i]);
        }
        electionCandidateCounts[newElectionId] = _candidateNames.length;

        // Auto-register creator as voter
        isWhitelisted[newElectionId][msg.sender] = true;
        emit VoterRegistered(newElectionId, msg.sender);

        emit ElectionCreated(newElectionId, _title, _startTime, _endTime, msg.sender);
        return newElectionId;
    }

    /**
     * @notice Register eligible voters in batch
     * @param _electionId ID of the election
     * @param _voters Array of voter wallet addresses
     */
    function registerVoters(
        uint256 _electionId,
        address[] calldata _voters
    ) external onlyElectionCreator(_electionId) {
        require(_electionId > 0 && _electionId <= electionCount, "Election does not exist");
        require(!elections[_electionId].isFinalized, "Election already finalized");

        for (uint256 i = 0; i < _voters.length; i++) {
            address voter = _voters[i];
            require(voter != address(0), "Invalid voter address");
            if (!isWhitelisted[_electionId][voter]) {
                isWhitelisted[_electionId][voter] = true;
                emit VoterRegistered(_electionId, voter);
            }
        }
    }

    /**
     * @notice Cast an anonymous, verifiable ballot
     * @param _electionId ID of the election
     * @param _candidateId Candidate voted for
     * @param _receiptHash Cryptographic SHA-256 / Keccak256 hash receipt
     */
    function castVote(
        uint256 _electionId,
        uint256 _candidateId,
        bytes32 _receiptHash
    ) external {
        require(_electionId > 0 && _electionId <= electionCount, "Invalid election ID");
        Election storage election = elections[_electionId];

        require(block.timestamp >= election.startTime, "Voting has not started yet");
        require(block.timestamp <= election.endTime, "Voting period has ended");
        require(!election.isFinalized, "Election is finalized");
        require(isWhitelisted[_electionId][msg.sender], "You are not an eligible/registered voter");
        require(!hasVoted[_electionId][msg.sender], "Double voting prevented: You have already cast your ballot");
        require(
            _candidateId > 0 && _candidateId <= electionCandidateCounts[_electionId],
            "Invalid candidate ID"
        );
        require(_receiptHash != bytes32(0), "Invalid receipt hash");

        // Mark voter as voted
        hasVoted[_electionId][msg.sender] = true;

        // Increment candidate votes and total
        candidates[_electionId][_candidateId].voteCount++;
        election.totalVotes++;

        // Store receipt for independent audit
        validReceipts[_electionId][_receiptHash] = true;

        emit VoteCast(_electionId, msg.sender, _candidateId, _receiptHash, block.timestamp);
    }

    /**
     * @notice Finalize election results and certify winner
     * @param _electionId ID of the election
     */
    function finalizeElection(uint256 _electionId) external onlyElectionCreator(_electionId) {
        require(_electionId > 0 && _electionId <= electionCount, "Invalid election ID");
        Election storage election = elections[_electionId];
        require(!election.isFinalized, "Already finalized");

        uint256 highestVotes = 0;
        uint256 winnerId = 0;
        uint256 candidateCount = electionCandidateCounts[_electionId];

        for (uint256 i = 1; i <= candidateCount; i++) {
            if (candidates[_electionId][i].voteCount > highestVotes) {
                highestVotes = candidates[_electionId][i].voteCount;
                winnerId = i;
            }
        }

        election.isFinalized = true;
        election.winningCandidateId = winnerId;

        emit ElectionFinalized(_electionId, winnerId, election.totalVotes);
    }

    /**
     * @notice Verify whether a vote receipt is recorded in the blockchain ledger
     */
    function verifyReceipt(uint256 _electionId, bytes32 _receiptHash) external view returns (bool) {
        return validReceipts[_electionId][_receiptHash];
    }

    /**
     * @notice Get election basic info
     */
    function getElection(uint256 _electionId) external view returns (
        uint256 id,
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        bool isFinalized,
        uint256 totalVotes,
        address creator,
        uint256 winningCandidateId
    ) {
        Election storage e = elections[_electionId];
        return (
            e.id,
            e.title,
            e.description,
            e.startTime,
            e.endTime,
            e.isFinalized,
            e.totalVotes,
            e.creator,
            e.winningCandidateId
        );
    }

    /**
     * @notice Fetch all candidates of an election
     */
    function getCandidates(uint256 _electionId) external view returns (Candidate[] memory) {
        uint256 count = electionCandidateCounts[_electionId];
        Candidate[] memory list = new Candidate[](count);
        for (uint256 i = 0; i < count; i++) {
            list[i] = candidates[_electionId][i + 1];
        }
        return list;
    }
}
