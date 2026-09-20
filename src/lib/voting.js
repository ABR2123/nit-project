/**
 * @file voting.js
 * @description Enterprise-grade ethers.js v6 integration for DecentralizedVoting.sol
 *
 * Implements all three security primitives on the frontend:
 *   1. Merkle Tree voter-eligibility proof generation
 *   2. Commit-Reveal ballot secrecy (salt generation + commitment hashing)
 *   3. Permissionless finalization call
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * DEPENDENCIES
 *   npm install ethers @openzeppelin/merkle-tree
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * USAGE OVERVIEW
 *
 *   // ── 1. Election admin: build the tree and create the election ───────────
 *   import { buildVoterMerkleTree, createElection } from './lib/voting';
 *
 *   const eligibleAddresses = ['0xABC...', '0xDEF...', ...];
 *   const { root, tree }    = buildVoterMerkleTree(eligibleAddresses);
 *   await createElection(contract, signer, { ..., merkleRoot: root });
 *   // Store `tree` in your backend/IPFS so voters can fetch their proofs.
 *
 *   // ── 2. Voter: commit (Phase 1) ──────────────────────────────────────────
 *   import { generateSalt, buildCommitment, getMerkleProof, commitVote } from './lib/voting';
 *
 *   const salt       = generateSalt();              // Random 32-byte hex
 *   const commitment = buildCommitment(candidateId, salt);
 *   localStorage.setItem(`salt:${electionId}`, salt);   // MUST persist the salt!
 *
 *   const proof = getMerkleProof(tree, voterAddress);    // Fetch tree from backend
 *   await commitVote(contract, signer, { electionId, commitment, proof });
 *
 *   // ── 3. Voter: reveal (Phase 2) ──────────────────────────────────────────
 *   import { revealVote } from './lib/voting';
 *
 *   const salt = localStorage.getItem(`salt:${electionId}`);
 *   await revealVote(contract, signer, { electionId, voterAddress, candidateId, salt });
 *
 *   // ── 4. Anyone: finalize after revealDeadline ────────────────────────────
 *   import { finalizeElection } from './lib/voting';
 *   await finalizeElection(contract, signer, electionId);
 */

import { ethers } from 'ethers';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1 — MERKLE TREE VOTER REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build a Merkle tree from an array of eligible voter addresses.
 *
 * Uses StandardMerkleTree from @openzeppelin/merkle-tree, which produces
 * trees with canonical (smaller-first) leaf ordering — matching the
 * _verifyMerkleProof() implementation in the Solidity contract exactly.
 *
 * Leaf encoding: keccak256(abi.encodePacked(voterAddress))
 * This mirrors: `bytes32 leaf = keccak256(abi.encodePacked(msg.sender));`
 * in commitVote().
 *
 * @param {string[]} addresses  Array of checksummed Ethereum voter addresses.
 *                              Must include ALL eligible voters for this election.
 * @returns {{ root: string, tree: StandardMerkleTree }}
 *   root  — The bytes32 hex Merkle root to pass to createElection().
 *   tree  — The full tree object, needed later to generate individual proofs.
 *           Serialize with tree.dump() for storage/IPFS; reload with
 *           StandardMerkleTree.load(dump).
 *
 * @example
 *   const addresses = ['0xAbC...', '0xDeF...'];
 *   const { root, tree } = buildVoterMerkleTree(addresses);
 *   console.log(root); // '0x8a3c...' — pass this to createElection()
 *   await ipfs.add(JSON.stringify(tree.dump())); // publish for voter proof retrieval
 */
export function buildVoterMerkleTree(addresses) {
  if (!addresses || addresses.length === 0) {
    throw new Error('buildVoterMerkleTree: addresses array must not be empty');
  }

  // Checksum and deduplicate addresses to prevent duplicate leaves,
  // which can create proof ambiguity in some tree implementations.
  const checksummed = [...new Set(addresses.map(a => ethers.getAddress(a)))];

  // StandardMerkleTree expects values as arrays of typed values.
  // Our leaf type is a single `address`, so each value is [address].
  const values = checksummed.map(addr => [addr]);

  // Build the tree. The ['address'] type array tells the library to
  // ABI-encode each leaf as a solidity `address`, which matches
  // abi.encodePacked(voterAddress) in the contract.
  const tree = StandardMerkleTree.of(values, ['address']);

  return {
    root: tree.root, // bytes32 hex string matching contract's merkleRoot
    tree,            // Full tree — serialize with tree.dump() for storage
  };
}

/**
 * Get the Merkle inclusion proof for a specific voter address from a tree.
 *
 * The returned proof is an array of bytes32 sibling hashes from the leaf
 * up to (but not including) the root. Pass this array directly to
 * commitVote() as the _merkleProof parameter.
 *
 * @param {StandardMerkleTree} tree     The full Merkle tree (from buildVoterMerkleTree)
 * @param {string}             address  The voter's Ethereum address
 * @returns {string[]}  Array of hex sibling hashes (bytes32[])
 *
 * @throws If the address is not a leaf in the tree (not in the electoral roll)
 *
 * @example
 *   const proof = getMerkleProof(tree, '0xAbC...');
 *   // ['0x1a2b...', '0x3c4d...', ...]
 */
export function getMerkleProof(tree, address) {
  const checksummed = ethers.getAddress(address);

  // StandardMerkleTree.getProof() finds the leaf and returns the sibling path.
  // It throws internally if the value is not in the tree.
  try {
    return tree.getProof([checksummed]);
  } catch {
    throw new Error(
      `getMerkleProof: address ${checksummed} is not in the voter Merkle tree. ` +
      `Ensure the electoral roll was built with this address included.`
    );
  }
}

/**
 * Verify a Merkle proof client-side before sending a transaction.
 * This is a free pre-flight check to avoid wasting gas on invalid proofs.
 *
 * @param {StandardMerkleTree} tree     The full Merkle tree
 * @param {string[]}           proof    The proof to verify (from getMerkleProof)
 * @param {string}             address  The voter address to verify
 * @returns {boolean}
 */
export function verifyMerkleProof(tree, proof, address) {
  const checksummed = ethers.getAddress(address);
  return StandardMerkleTree.verify(tree.root, ['address'], [checksummed], proof);
}


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2 — COMMIT-REVEAL BALLOT SECRECY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a cryptographically secure random secret salt.
 *
 * The salt is a 32-byte random value represented as a 0x-prefixed hex string.
 * It is generated using the Web Crypto API (window.crypto.getRandomValues),
 * which provides CSPRNG-quality randomness — NOT Math.random().
 *
 * CRITICAL: The voter MUST store this salt persistently (e.g., localStorage,
 * encrypted vault, written down). If the salt is lost, the voter cannot
 * reveal their vote during Phase 2, and their commitment becomes unverifiable.
 * A lost salt = a lost vote.
 *
 * @returns {string}  A 0x-prefixed 32-byte hex string (bytes32)
 *
 * @example
 *   const salt = generateSalt();
 *   // '0x4a7f2bc89e1d0f3a...' (64 hex chars after 0x)
 *   localStorage.setItem(`voteSalt:electionId:${electionId}`, salt);
 */
export function generateSalt() {
  // ethers.randomBytes(32) wraps Web Crypto under the hood in v6.
  // It returns a Uint8Array; hexlify converts it to '0x...' format.
  return ethers.hexlify(ethers.randomBytes(32));
}

/**
 * Build the vote commitment hash to submit on-chain during Phase 1 (commit).
 *
 * This function EXACTLY replicates the Solidity expression:
 *   keccak256(abi.encodePacked(candidateId, secretSalt))
 *
 * The commitment hides the candidate choice from all observers.
 * Even a validator watching the mempool sees only an opaque 32-byte hash.
 *
 * Encoding details:
 *   - candidateId: uint256, ABI-packed as 32 bytes (big-endian)
 *   - secretSalt:  bytes32, packed directly as 32 bytes
 *   Total packed bytes: 64 bytes => keccak256 => 32-byte commitment
 *
 * @param {number|bigint} candidateId  The candidate ID (1-indexed, as in the contract)
 * @param {string}        secretSalt   The 0x-prefixed 32-byte hex salt from generateSalt()
 * @returns {string}  The 0x-prefixed 32-byte commitment hash (bytes32)
 *
 * @example
 *   const candidateId = 2;
 *   const salt        = generateSalt();
 *   const commitment  = buildCommitment(candidateId, salt);
 *   // '0xd4f3...' — submit this to commitVote()
 */
export function buildCommitment(candidateId, secretSalt) {
  // ethers.solidityPackedKeccak256 is the v6 equivalent of
  // keccak256(abi.encodePacked(...)) in Solidity.
  // Type 'uint256' encodes as a 32-byte big-endian integer (abi.encodePacked semantics).
  // Type 'bytes32' encodes the salt as-is (32 bytes, no padding).
  return ethers.solidityPackedKeccak256(
    ['uint256', 'bytes32'],
    [BigInt(candidateId), secretSalt]
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3 — CONTRACT INTERACTION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

// ── 3a. Election Creation ────────────────────────────────────────────────

/**
 * Create a new election on-chain.
 *
 * The election admin must build the Merkle tree off-chain first, then pass
 * the root here. The full tree must be published separately (e.g., IPFS) so
 * voters can fetch their individual proofs.
 *
 * @param {ethers.Contract} contract       Connected contract instance (with signer)
 * @param {Object}          params
 * @param {string}          params.title
 * @param {string}          params.description
 * @param {number}          params.startTime      UNIX seconds
 * @param {number}          params.endTime        UNIX seconds (end of commit phase)
 * @param {number}          params.revealDuration Seconds after endTime for reveal window
 * @param {string}          params.merkleRoot     bytes32 hex from buildVoterMerkleTree()
 * @param {string[]}        params.candidateNames
 * @param {string[]}        params.parties
 * @param {string[]}        params.manifestos
 * @param {string[]}        params.avatars
 *
 * @returns {Promise<{tx, receipt, electionId: bigint}>}
 *
 * @example
 *   const { root, tree } = buildVoterMerkleTree(eligibleAddresses);
 *   const { tx, electionId } = await createElection(contract, {
 *     title: 'Student Council 2026',
 *     description: 'Annual student body election',
 *     startTime: Math.floor(Date.now() / 1000) + 3600,
 *     endTime:   Math.floor(Date.now() / 1000) + 86400,
 *     revealDuration: 86400,
 *     merkleRoot: root,
 *     candidateNames: ['Alice', 'Bob'],
 *     parties: ['Party A', 'Party B'],
 *     manifestos: ['Manifesto A', 'Manifesto B'],
 *     avatars: ['ipfs://Qm...', 'ipfs://Qm...'],
 *   });
 *   console.log('Election created:', electionId.toString());
 */
export async function createElection(contract, params) {
  const {
    title, description, startTime, endTime, revealDuration, merkleRoot,
    candidateNames, parties, manifestos, avatars,
  } = params;

  if (!merkleRoot || merkleRoot === ethers.ZeroHash) {
    throw new Error('createElection: merkleRoot must be a non-zero bytes32 value');
  }
  if (revealDuration <= 0) {
    throw new Error('createElection: revealDuration must be > 0 seconds');
  }

  const tx = await contract.createElection(
    title,
    description,
    BigInt(startTime),
    BigInt(endTime),
    BigInt(revealDuration),
    merkleRoot,
    candidateNames,
    parties,
    manifestos,
    avatars,
  );

  const receipt = await tx.wait();

  // Parse ElectionCreated event to get the new electionId.
  const iface = contract.interface;
  const eventTopic = iface.getEvent('ElectionCreated').topicHash;
  const log = receipt.logs.find(l => l.topics[0] === eventTopic);
  const parsed = iface.parseLog(log);
  const electionId = parsed.args.electionId;

  return { tx, receipt, electionId };
}


// ── 3b. Phase 1: Commit Vote ─────────────────────────────────────────────

/**
 * Phase 1: Submit a sealed ballot commitment to the contract.
 *
 * BEFORE calling this function, you MUST:
 *   1. Generate and PERSIST the salt: `const salt = generateSalt()`
 *      Store it somewhere the voter can retrieve it for the reveal phase.
 *   2. Build the commitment: `const commitment = buildCommitment(candidateId, salt)`
 *   3. Fetch the Merkle proof from your backend/IPFS.
 *
 * @param {ethers.Contract} contract       Connected contract instance (with signer)
 * @param {Object}          params
 * @param {number|bigint}   params.electionId
 * @param {string}          params.commitment    bytes32 from buildCommitment()
 * @param {string[]}        params.merkleProof   From getMerkleProof()
 *
 * @returns {Promise<{tx, receipt}>}
 *
 * @example
 *   const candidateId = 1;
 *   const salt        = generateSalt();
 *   localStorage.setItem(`voteSalt:${electionId}`, salt);
 *
 *   const commitment = buildCommitment(candidateId, salt);
 *   const proof      = getMerkleProof(tree, voterAddress);
 *
 *   await commitVote(contract, { electionId: 1n, commitment, merkleProof: proof });
 */
export async function commitVote(contract, params) {
  const { electionId, commitment, merkleProof } = params;

  if (!commitment || commitment === ethers.ZeroHash) {
    throw new Error('commitVote: commitment must be a non-zero bytes32 value');
  }
  if (!merkleProof || merkleProof.length === 0) {
    throw new Error('commitVote: merkleProof cannot be empty');
  }

  const tx      = await contract.commitVote(BigInt(electionId), commitment, merkleProof);
  const receipt = await tx.wait();
  return { tx, receipt };
}


// ── 3c. Phase 2: Reveal Vote ─────────────────────────────────────────────

/**
 * Phase 2: Reveal your sealed ballot to have it tallied.
 *
 * Must be called AFTER the commit window closes (endTime) and BEFORE
 * the revealDeadline. The contract re-derives the commitment and verifies
 * it matches what was submitted in Phase 1.
 *
 * Can be called by:
 *   - The voter themselves (voterAddress = their own address)
 *   - A relayer acting on the voter's behalf (voterAddress = original voter)
 *
 * @param {ethers.Contract} contract       Connected contract instance (with signer)
 * @param {Object}          params
 * @param {number|bigint}   params.electionId
 * @param {string}          params.voterAddress  The address that committed the vote
 * @param {number|bigint}   params.candidateId   The plaintext candidate voted for
 * @param {string}          params.secretSalt    The bytes32 salt used during commit
 *
 * @returns {Promise<{tx, receipt}>}
 *
 * @example
 *   const salt = localStorage.getItem(`voteSalt:${electionId}`);
 *   await revealVote(contract, {
 *     electionId:   1n,
 *     voterAddress: await signer.getAddress(),
 *     candidateId:  1n,
 *     secretSalt:   salt,
 *   });
 */
export async function revealVote(contract, params) {
  const { electionId, voterAddress, candidateId, secretSalt } = params;

  if (!secretSalt || secretSalt === ethers.ZeroHash) {
    throw new Error('revealVote: secretSalt is missing or zero — ballot cannot be revealed');
  }

  // Client-side commitment re-derivation for pre-flight verification.
  // Catches mismatches locally before broadcasting, saving gas.
  const storedCommitment = await contract.voteCommitments(BigInt(electionId), voterAddress);
  if (storedCommitment === ethers.ZeroHash) {
    throw new Error(
      `revealVote: no commitment found on-chain for ${voterAddress} in election ${electionId}`
    );
  }

  const derivedCommitment = buildCommitment(candidateId, secretSalt);
  if (derivedCommitment !== storedCommitment) {
    throw new Error(
      `revealVote: commitment mismatch — the provided candidateId or secretSalt ` +
      `does not match the on-chain commitment. ` +
      `Derived: ${derivedCommitment}, Stored: ${storedCommitment}`
    );
  }

  const tx      = await contract.revealVote(
    BigInt(electionId),
    voterAddress,
    BigInt(candidateId),
    secretSalt,
  );
  const receipt = await tx.wait();
  return { tx, receipt };
}


// ── 3d. Decentralized Finalization ───────────────────────────────────────

/**
 * Finalize the election and compute the winner.
 *
 * This is a PUBLIC function — any address can call it.
 * The contract enforces `block.timestamp >= revealDeadline` internally;
 * this wrapper checks it on the client side first to surface a friendly error
 * rather than a raw on-chain revert.
 *
 * Suitable for integration into:
 *   - A Chainlink Automation keeper (no signer required server-side)
 *   - A simple "Finalize" button in the UI (any connected wallet)
 *   - A cron-job relayer operated by the election admin
 *
 * @param {ethers.Contract} contract     Connected contract instance (with signer)
 * @param {number|bigint}   electionId
 *
 * @returns {Promise<{tx, receipt, winnerId: bigint}>}
 *
 * @example
 *   const { winnerId } = await finalizeElection(contract, 1n);
 *   console.log(`Winner is candidate #${winnerId}`);
 */
export async function finalizeElection(contract, electionId) {
  const electionData   = await contract.getElection(BigInt(electionId));
  const revealDeadline = electionData.revealDeadline; // bigint (seconds)
  const nowSeconds     = BigInt(Math.floor(Date.now() / 1000));

  if (nowSeconds < revealDeadline) {
    const remainingMins = Math.ceil(Number(revealDeadline - nowSeconds) / 60);
    throw new Error(
      `finalizeElection: reveal window is still open. ` +
      `Finalization available in ~${remainingMins} minute(s).`
    );
  }

  if (electionData.isFinalized) {
    throw new Error(`finalizeElection: election ${electionId} is already finalized.`);
  }

  const tx      = await contract.finalizeElection(BigInt(electionId));
  const receipt = await tx.wait();

  // Parse ElectionFinalized event to extract the winner.
  const iface      = contract.interface;
  const eventTopic = iface.getEvent('ElectionFinalized').topicHash;
  const log        = receipt.logs.find(l => l.topics[0] === eventTopic);
  const parsed     = iface.parseLog(log);
  const winnerId   = parsed.args.winningCandidateId;

  return { tx, receipt, winnerId };
}


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4 — UTILITY / READ HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the current election phase as a human-readable string.
 *
 * Maps the contract's getElectionPhase() return values:
 *   0 => 'pre-voting'            (before startTime)
 *   1 => 'commit'                (Phase 1: active voting)
 *   2 => 'reveal'                (Phase 2: tallying window)
 *   3 => 'pending-finalization'  (reveal window closed, not finalized yet)
 *   4 => 'finalized'
 *
 * @param {ethers.Contract} contract
 * @param {number|bigint}   electionId
 * @returns {Promise<string>}
 */
export async function getPhaseLabel(contract, electionId) {
  const phase = await contract.getElectionPhase(BigInt(electionId));
  const labels = ['pre-voting', 'commit', 'reveal', 'pending-finalization', 'finalized'];
  return labels[Number(phase)] ?? 'unknown';
}

/**
 * Check whether an address has already committed a vote.
 *
 * @param {ethers.Contract} contract
 * @param {number|bigint}   electionId
 * @param {string}          voterAddress
 * @returns {Promise<boolean>}
 */
export async function checkHasCommitted(contract, electionId, voterAddress) {
  return contract.hasCommitted(BigInt(electionId), voterAddress);
}

/**
 * Check whether an address has already revealed their vote.
 *
 * @param {ethers.Contract} contract
 * @param {number|bigint}   electionId
 * @param {string}          voterAddress
 * @returns {Promise<boolean>}
 */
export async function checkHasRevealed(contract, electionId, voterAddress) {
  return contract.hasRevealed(BigInt(electionId), voterAddress);
}

