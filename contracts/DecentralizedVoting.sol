// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================
//  ██████╗ ███████╗ ██████╗
//  ██╔══██╗╚══███╔╝██╔════╝
//  ██║  ██║  ███╔╝ ██║  ███╗
//  ██║  ██║ ███╔╝  ██║   ██║
//  ██████╔╝███████╗╚██████╔╝
//  ╚═════╝ ╚══════╝ ╚═════╝
//
//  DecentralizedVoting — Enterprise Edition
//
//  SECURITY ARCHITECTURE:
//  ┌─────────────────────────────────────────────────────────┐
//  │ 1. Merkle Tree Voter Registry                           │
//  │    Sybil-resistance without on-chain voter lists.      │
//  │    Eligibility is proven via cryptographic proof.      │
//  ├─────────────────────────────────────────────────────────┤
//  │ 2. Commit-Reveal Ballot Secrecy (2-Phase Protocol)     │
//  │    Phase 1: Voter submits hash(candidateId, salt).     │
//  │    Phase 2: Voter reveals plaintext to tally vote.     │
//  │    Prevents: mempool snooping, bandwagon effects.      │
//  ├─────────────────────────────────────────────────────────┤
//  │ 3. Decentralized Finalization                           │
//  │    Anyone can finalize; contract enforces timeline.    │
//  │    No onlyOwner / onlyCreator gating on critical path. │
//  └─────────────────────────────────────────────────────────┘
// ============================================================

/**
 * @title DecentralizedVoting
 * @author Enterprise Security Rewrite
 * @notice A privacy-preserving, Sybil-resistant, permissionlessly-finalizable
 *         on-chain voting system suitable for public elections.
 *
 * @dev THREAT MODEL addressed:
 *
 *   [FIXED] Plaintext votes in mempool
 *           -> Commit-Reveal scheme hides the vote until after election closes.
 *
 *   [FIXED] Sybil attack / open voter self-registration
 *           -> Merkle root replaces the open isWhitelisted mapping. A voter
 *              must supply a valid Merkle proof that their address exists in
 *              the pre-committed electoral roll. No new addresses can be
 *              added after the election is created.
 *
 *   [FIXED] Centralized finalization (admin capture / censorship)
 *           -> finalizeElection() is now public. The contract's own
 *              block.timestamp check is the sole gatekeeper.
 *
 *   [PARTIAL] Front-running of reveal phase
 *           -> The salt binds the commitment to the voter's choice. A
 *              front-runner copying a reveal would re-use a commitment
 *              already marked as revealed, and revert on the duplicate check.
 *              NOTE: If the voter's address is the Merkle leaf, a third
 *              party cannot claim a different voter's reveal slot.
 */
contract DecentralizedVoting {

    // =========================================================
    // DATA STRUCTURES
    // =========================================================

    /**
     * @notice Metadata for a single candidate.
     * @dev voteCount is only incremented during the reveal phase (Phase 2),
     *      so it is 0 and meaningless until after voting closes.
     */
    struct Candidate {
        uint256 id;
        string  name;
        string  party;
        string  manifesto;
        string  avatarUrl;
        uint256 voteCount; // Only meaningful after reveal window opens
    }

    /**
     * @notice Core election state machine.
     *
     *   Time-line:
     *
     *   block.timestamp:  ─────────────────────────────────────────▶
     *                     ┌──────────────┬──────────────┬──────────
     *   Phase:            │  Pre-voting  │ COMMIT Phase │ REVEAL Phase
     *                     │              │(Active Voting│(Tallying Window)
     *                     │              │   window)    │
     *                    startTime      endTime       revealDeadline
     *
     * @param merkleRoot   Keccak256 root of the voter eligibility Merkle tree.
     *                     Leaf format: keccak256(abi.encodePacked(voterAddress))
     *                     Computed off-chain and committed at election creation.
     * @param revealDeadline  Timestamp by which all voters must reveal. After
     *                        this point the election can be finalized.
     */
    struct Election {
        uint256 id;
        string  title;
        string  description;
        uint256 startTime;
        uint256 endTime;         // End of COMMIT (Phase 1) window
        uint256 revealDeadline;  // End of REVEAL (Phase 2) window
        bool    isFinalized;
        uint256 totalVotes;      // Incremented only on successful reveals
        address creator;
        uint256 winningCandidateId;
        bytes32 merkleRoot;      // Immutable electoral roll commitment
    }

    // =========================================================
    // STATE VARIABLES
    // =========================================================

    /// @notice Auto-incrementing election counter (1-indexed)
    uint256 public electionCount;

    /// @notice electionId => Election metadata
    mapping(uint256 => Election) public elections;

    /// @notice electionId => candidateId => Candidate
    mapping(uint256 => mapping(uint256 => Candidate)) public candidates;

    /// @notice electionId => number of candidates
    mapping(uint256 => uint256) public electionCandidateCounts;

    // ── Phase 1: Commit ──────────────────────────────────────

    /**
     * @notice Stores the voter's sealed ballot commitment during Phase 1.
     *
     *   commitment = keccak256(abi.encodePacked(candidateId, secretSalt))
     *
     *   The salt must be a secret random value known only to the voter.
     *   It MUST be preserved by the voter for the reveal phase.
     *
     *   electionId => voterAddress => commitmentHash
     */
    mapping(uint256 => mapping(address => bytes32)) public voteCommitments;

    // ── Phase 2: Reveal ──────────────────────────────────────

    /**
     * @notice Tracks whether a voter has already revealed their commitment.
     *   Prevents the same commitment from being tallied twice.
     *
     *   electionId => voterAddress => hasRevealed
     */
    mapping(uint256 => mapping(address => bool)) public hasRevealed;

    // =========================================================
    // EVENTS
    // =========================================================

    /**
     * @notice Emitted when a new election is created.
     * @param merkleRoot The Merkle root of the voter eligibility set.
     */
    event ElectionCreated(
        uint256 indexed electionId,
        string  title,
        uint256 startTime,
        uint256 endTime,
        uint256 revealDeadline,
        bytes32 merkleRoot,
        address indexed creator
    );

    event CandidateAdded(
        uint256 indexed electionId,
        uint256 indexed candidateId,
        string  name,
        string  party
    );

    /**
     * @notice Emitted on a successful Phase 1 commit.
     *         NOTE: candidateId and salt are intentionally NOT logged here.
     *         Only the opaque commitment is stored — maintaining ballot secrecy
     *         even on-chain during the active voting window.
     */
    event VoteCommitted(
        uint256 indexed electionId,
        address indexed voter,
        bytes32 commitment
    );

    /**
     * @notice Emitted on a successful Phase 2 reveal and tally.
     *         At this point the election is over, so revealing the candidateId
     *         on-chain is safe and necessary for auditability.
     */
    event VoteRevealed(
        uint256 indexed electionId,
        address indexed voter,
        uint256 indexed candidateId,
        uint256 timestamp
    );

    /**
     * @notice Emitted when anyone calls finalizeElection after revealDeadline.
     */
    event ElectionFinalized(
        uint256 indexed electionId,
        uint256 winningCandidateId,
        uint256 totalVotes
    );

    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    // @dev No owner is set. The contract is stateless with respect to
    //      administrative control — all authority is derived from the
    //      election's own parameters and block.timestamp.
    constructor() {}

    // =========================================================
    // ELECTION CREATION
    // =========================================================

    /**
     * @notice Create a new election with a pre-committed voter eligibility
     *         Merkle root. Anyone can create an election.
     *
     * @param _title            Human-readable title of the election
     * @param _description      Purpose and context of the election
     * @param _startTime        UNIX timestamp when Phase 1 (commit) opens
     * @param _endTime          UNIX timestamp when Phase 1 (commit) closes
     * @param _revealDuration   Seconds after _endTime that Phase 2 stays open.
     *                          Must be > 0 to give voters time to reveal.
     *                          Recommended: at least 24–72 hours.
     * @param _merkleRoot       Keccak256 Merkle root of eligible voter addresses.
     *                          Computed off-chain before election creation.
     *                          Leaf = keccak256(abi.encodePacked(voterAddress))
     * @param _candidateNames   Ordered array of candidate names
     * @param _parties          Ordered array of party affiliations
     * @param _manifestos       Ordered array of candidate manifestos
     * @param _avatars          Ordered array of avatar/IPFS image URIs
     *
     * @return electionId       The newly assigned election ID
     */
    function createElection(
        string  memory _title,
        string  memory _description,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _revealDuration,
        bytes32 _merkleRoot,
        string[] memory _candidateNames,
        string[] memory _parties,
        string[] memory _manifestos,
        string[] memory _avatars
    ) external returns (uint256 electionId) {

        // ── Input validation ──────────────────────────────────
        require(bytes(_title).length > 0,         "Title required");
        require(_startTime >= block.timestamp,    "Start must be in the future");
        require(_endTime > _startTime,            "End must be after start");
        require(_revealDuration > 0,              "Reveal window must be > 0");
        require(_merkleRoot != bytes32(0),        "Merkle root required");
        require(_candidateNames.length >= 2,      "At least 2 candidates required");
        require(
            _candidateNames.length == _parties.length &&
            _candidateNames.length == _manifestos.length &&
            _candidateNames.length == _avatars.length,
            "Candidate array length mismatch"
        );

        // ── Write election state ──────────────────────────────
        electionId = ++electionCount;

        elections[electionId] = Election({
            id:                 electionId,
            title:              _title,
            description:        _description,
            startTime:          _startTime,
            endTime:            _endTime,
            revealDeadline:     _endTime + _revealDuration,
            isFinalized:        false,
            totalVotes:         0,
            creator:            msg.sender,
            winningCandidateId: 0,
            merkleRoot:         _merkleRoot
        });

        // ── Register candidates (1-indexed IDs) ───────────────
        for (uint256 i = 0; i < _candidateNames.length; i++) {
            uint256 candidateId = i + 1;
            candidates[electionId][candidateId] = Candidate({
                id:        candidateId,
                name:      _candidateNames[i],
                party:     _parties[i],
                manifesto: _manifestos[i],
                avatarUrl: _avatars[i],
                voteCount: 0
            });
            emit CandidateAdded(electionId, candidateId, _candidateNames[i], _parties[i]);
        }
        electionCandidateCounts[electionId] = _candidateNames.length;

        emit ElectionCreated(
            electionId, _title, _startTime, _endTime,
            _endTime + _revealDuration, _merkleRoot, msg.sender
        );
    }

    // =========================================================
    // PHASE 1 — COMMIT
    // =========================================================

    /**
     * @notice Submit a sealed ballot commitment during the active voting window.
     *
     *   The voter computes off-chain:
     *     secretSalt  = ethers.randomBytes(32)
     *     commitment  = keccak256(abi.encodePacked(candidateId, secretSalt))
     *
     *   This transaction reveals NOTHING about the chosen candidate.
     *   The vote is effectively encrypted by the secret salt.
     *
     * @param _electionId   Target election ID
     * @param _commitment   keccak256(abi.encodePacked(candidateId, secretSalt))
     * @param _merkleProof  Merkle inclusion proof that msg.sender is in the
     *                      electoral roll committed to in elections[_electionId].merkleRoot
     *                      Proof format: array of sibling hashes from leaf to root.
     */
    function commitVote(
        uint256   _electionId,
        bytes32   _commitment,
        bytes32[] calldata _merkleProof
    ) external {
        Election storage election = elections[_electionId];

        // ── Time-window guard (Phase 1) ───────────────────────
        require(_electionId > 0 && _electionId <= electionCount, "Invalid election ID");
        require(block.timestamp >= election.startTime, "Voting has not started");
        require(block.timestamp <  election.endTime,   "Commit window has closed");
        require(!election.isFinalized,                 "Election already finalized");

        // ── Duplicate commit guard ────────────────────────────
        // A voter gets exactly one commitment slot. Changing your mind
        // is not permitted; preserve pre-election strategic secrecy.
        require(
            voteCommitments[_electionId][msg.sender] == bytes32(0),
            "You have already committed a vote"
        );
        require(_commitment != bytes32(0), "Invalid commitment: zero hash");

        // ── Merkle proof verification ─────────────────────────
        // Derives the leaf from the caller's own address, then walks the
        // proof path up to the root. If it matches the stored root, the
        // caller is provably in the electoral roll.
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(
            _verifyMerkleProof(_merkleProof, election.merkleRoot, leaf),
            "Invalid Merkle proof: address not in electoral roll"
        );

        // ── Store the sealed ballot ───────────────────────────
        voteCommitments[_electionId][msg.sender] = _commitment;

        emit VoteCommitted(_electionId, msg.sender, _commitment);
    }

    // =========================================================
    // PHASE 2 — REVEAL
    // =========================================================

    /**
     * @notice Reveal a previously committed vote to have it tallied.
     *
     *   Must be called after the commit window closes (endTime) and before
     *   the reveal deadline (revealDeadline). Can be called by the voter
     *   themselves or by a trusted relayer acting on their behalf
     *   (the voter's commitment is already on-chain, bound to their address).
     *
     * @dev Security properties of this function:
     *   1. The revealed (candidateId, secretSalt) is hashed and compared to
     *      the stored commitment. Any mismatch reverts — preventing ballot
     *      stuffing or vote-changing in the reveal phase.
     *   2. hasRevealed[electionId][voter] prevents a commitment from being
     *      counted twice even if the function is called multiple times.
     *   3. The voteCount increment only happens here, ensuring tallies
     *      are only built from verified reveals.
     *
     * @param _electionId   Target election ID
     * @param _voterAddress The address whose commitment is being revealed.
     *                      For self-reveals, pass msg.sender.
     *                      Relayers pass the original voter's address.
     * @param _candidateId  The plaintext candidate ID originally committed to
     * @param _secretSalt   The plaintext secret salt originally used to commit
     */
    function revealVote(
        uint256 _electionId,
        address _voterAddress,
        uint256 _candidateId,
        bytes32 _secretSalt
    ) external {
        Election storage election = elections[_electionId];

        // ── Time-window guard (Phase 2) ───────────────────────
        require(_electionId > 0 && _electionId <= electionCount, "Invalid election ID");
        require(block.timestamp >= election.endTime,        "Reveal window not open yet");
        require(block.timestamp <  election.revealDeadline, "Reveal window has closed");
        require(!election.isFinalized,                      "Election already finalized");

        // ── Candidate bounds check ────────────────────────────
        require(
            _candidateId > 0 && _candidateId <= electionCandidateCounts[_electionId],
            "Invalid candidate ID"
        );

        // ── Duplicate reveal guard ────────────────────────────
        require(
            !hasRevealed[_electionId][_voterAddress],
            "Vote for this address already revealed"
        );

        // ── Commitment pre-image check ────────────────────────
        // Re-derive the commitment from the submitted plaintext and
        // compare it to what was stored during Phase 1.
        bytes32 storedCommitment = voteCommitments[_electionId][_voterAddress];
        require(storedCommitment != bytes32(0), "No commitment found for this address");

        bytes32 derivedCommitment = keccak256(
            abi.encodePacked(_candidateId, _secretSalt)
        );
        require(
            derivedCommitment == storedCommitment,
            "Commitment mismatch: candidateId or salt is incorrect"
        );

        // ── Accept and tally the vote ─────────────────────────
        hasRevealed[_electionId][_voterAddress] = true;
        candidates[_electionId][_candidateId].voteCount++;
        election.totalVotes++;

        emit VoteRevealed(_electionId, _voterAddress, _candidateId, block.timestamp);
    }

    // =========================================================
    // DECENTRALIZED FINALIZATION
    // =========================================================

    /**
     * @notice Finalize the election and compute the winner.
     *
     *   This function is PUBLIC and permissionless — ANYONE can call it.
     *   The contract itself enforces the timeline via block.timestamp.
     *   There is no onlyOwner or onlyCreator guard.
     *
     *   Rationale: In a decentralized election, the outcome should not
     *   depend on a central party choosing to (or being coerced into)
     *   calling a function. Any participant, observer, or automated keeper
     *   can trigger finalization once the reveal window closes.
     *
     * @param _electionId  ID of the election to finalize
     */
    function finalizeElection(uint256 _electionId) external {
        require(_electionId > 0 && _electionId <= electionCount, "Invalid election ID");
        Election storage election = elections[_electionId];

        // ── Strictly enforced timeline ────────────────────────
        // The reveal deadline must have passed. No admin override possible.
        require(
            block.timestamp >= election.revealDeadline,
            "Reveal window still open: finalization not yet permitted"
        );
        require(!election.isFinalized, "Election already finalized");

        // ── Determine winner ──────────────────────────────────
        // Simple plurality: highest voteCount wins.
        // Ties: the candidate with the lower ID wins (deterministic).
        uint256 highestVotes = 0;
        uint256 winnerId     = 0;
        uint256 candidateCount = electionCandidateCounts[_electionId];

        for (uint256 i = 1; i <= candidateCount; i++) {
            if (candidates[_electionId][i].voteCount > highestVotes) {
                highestVotes = candidates[_electionId][i].voteCount;
                winnerId     = i;
            }
        }

        // ── Commit finalized state ────────────────────────────
        election.isFinalized        = true;
        election.winningCandidateId = winnerId;

        emit ElectionFinalized(_electionId, winnerId, election.totalVotes);
    }

    // =========================================================
    // INTERNAL — MERKLE PROOF VERIFICATION
    // =========================================================

    /**
     * @notice Standard OpenZeppelin-compatible iterative Merkle proof verifier.
     *
     * @dev Algorithm:
     *   Starting from the leaf, the function iterates over each sibling hash
     *   in the proof array. At each level it combines the current hash with
     *   its sibling in a canonical order (smaller hash first) and hashes the
     *   pair. After all siblings are processed, the result must equal the root.
     *
     *   Canonical ordering (smaller-first) is critical: it makes the tree
     *   structure deterministic regardless of which side the sibling is on,
     *   and matches the output of standard Merkle tree libraries such as
     *   the OZ merkle-tree JS package and murky (Solidity).
     *
     * @param _proof   Array of sibling node hashes from leaf to root
     * @param _root    The Merkle root stored in the election
     * @param _leaf    keccak256(abi.encodePacked(voterAddress)) — computed
     *                 inside commitVote to prevent callers from forging leaves.
     *
     * @return bool    True if the proof is valid for the given root and leaf
     */
    function _verifyMerkleProof(
        bytes32[] calldata _proof,
        bytes32 _root,
        bytes32 _leaf
    ) internal pure returns (bool) {
        bytes32 computedHash = _leaf;

        for (uint256 i = 0; i < _proof.length; i++) {
            bytes32 proofElement = _proof[i];

            // Canonical ordering: ensure deterministic hash regardless of
            // left/right sibling position.
            if (computedHash <= proofElement) {
                // Current node is on the left
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                // Current node is on the right
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }

        return computedHash == _root;
    }

    // =========================================================
    // VIEW / QUERY FUNCTIONS
    // =========================================================

    /**
     * @notice Returns all metadata for a given election.
     */
    function getElection(uint256 _electionId) external view returns (
        uint256 id,
        string  memory title,
        string  memory description,
        uint256 startTime,
        uint256 endTime,
        uint256 revealDeadline,
        bool    isFinalized,
        uint256 totalVotes,
        address creator,
        uint256 winningCandidateId,
        bytes32 merkleRoot
    ) {
        Election storage e = elections[_electionId];
        return (
            e.id, e.title, e.description, e.startTime, e.endTime,
            e.revealDeadline, e.isFinalized, e.totalVotes,
            e.creator, e.winningCandidateId, e.merkleRoot
        );
    }

    /**
     * @notice Returns all candidates for an election.
     * @dev    During the commit phase, voteCount will be 0 for all candidates,
     *         by design. Tallies only become meaningful after reveals.
     */
    function getCandidates(uint256 _electionId) external view returns (Candidate[] memory) {
        uint256 count = electionCandidateCounts[_electionId];
        Candidate[] memory list = new Candidate[](count);
        for (uint256 i = 0; i < count; i++) {
            list[i] = candidates[_electionId][i + 1];
        }
        return list;
    }

    /**
     * @notice Returns the current voting phase for a given election.
     * @return phase  0 = Pre-voting, 1 = Commit (Phase 1), 2 = Reveal (Phase 2),
     *                3 = Awaiting finalization, 4 = Finalized
     */
    function getElectionPhase(uint256 _electionId) external view returns (uint8 phase) {
        Election storage e = elections[_electionId];
        if (e.isFinalized)                           return 4;
        if (block.timestamp >= e.revealDeadline)     return 3;
        if (block.timestamp >= e.endTime)            return 2;
        if (block.timestamp >= e.startTime)          return 1;
        return 0;
    }

    /**
     * @notice Check whether an address has submitted a commitment for an election.
     */
    function hasCommitted(uint256 _electionId, address _voter) external view returns (bool) {
        return voteCommitments[_electionId][_voter] != bytes32(0);
    }
}
