# AegisVote: Decentralized Blockchain E-Voting System (Real Blockchain & EVM Ready)

**AegisVote** is an Ethereum/EVM-native decentralized e-voting system designed to eliminate the systemic flaws inherent in traditional voting mechanisms:
- **Tampering & Single Points of Failure**: Eliminated via distributed EVM ledgers where state changes require cryptographic consensus and are immutable.
- **Double Voting & Sybil Attacks**: Prevented on-chain through cryptographic whitelist enforcement and strict `require(!hasVoted)` smart contract assertions.
- **Lack of End-to-End Auditability**: Solved via Keccak-256 cryptographic ballot receipts, enabling voters to independently verify ballot inclusion on the ledger without revealing their identity.
- **Centralized Tally Manipulation**: Automated winner determination and vote tallies computed transparently in smart contract bytecode.

---

## Real Blockchain Architecture

AegisVote communicates directly with live EVM networks via `ethers.js` v6 and injected Web3 providers (MetaMask, Rabby, Coinbase Wallet):

```
+-----------------------------------------------------------------------------------+
|                            AegisVote React 19 Frontend                            |
+-----------------------------------------+-----------------------------------------+
                                          |
                         +----------------+----------------+
                         |                                 |
                         v                                 v
          +-----------------------------+   +-----------------------------+
          |  MetaMask / Web3 Provider   |   |   Fallback Sandbox Node     |
          |   (EIP-1193 Injected API)   |   |   (Zero-Setup Evaluation)   |
          +--------------+--------------+   +-----------------------------+
                         |
      +------------------+------------------+
      |                  |                  |
      v                  v                  v
+-----------+     +--------------+    +------------+
| Hardhat   |     | Sepolia      |    | Polygon    |
| Localnode |     | Testnet      |    | Amoy       |
| (31337)   |     | (11155111)   |    | (80002)    |
+-----+-----+     +-------+------+    +-----+------+
      |                   |                 |
      +-------------------+-----------------+
                          |
                          v
         +----------------------------------+
         |     DecentralizedVoting.sol      |
         |         Smart Contract           |
         +----------------+-----------------+
                          |
     +--------------------+--------------------+
     |                    |                    |
     v                    v                    v
+--------------+   +---------------+   +---------------+
| castVote()   |   | createElection|   | registerVoters|
| (Receipts &  |   | (Immutable    |   | (Sybil        |
| Tallies)     |   | Lifecycle)    |   | Whitelist)    |
+--------------+   +---------------+   +---------------+
```

---

## Using with a Real Blockchain

### Option A: Real Local Ethereum Blockchain (Hardhat Node)

A local Ethereum blockchain gives you real blocks, real mining, real transactions, and 20 pre-funded test accounts with 10,000 ETH each.

1. **Start the local blockchain node**:
   ```bash
   npm run node:local
   ```
   *(This starts an Ethereum JSON-RPC node on `http://127.0.0.1:8545` with chain ID `31337`)*.

2. **Deploy the smart contract & seed on-chain elections**:
   In another terminal:
   ```bash
   npm run deploy:local
   ```
   This automatically compiles the Solidity contract with `solc`, broadcasts the deployment transaction, seeds an initial election, whitelists test voters, and writes the deployed contract address to `src/contracts/deployedAddress.json`.

3. **Start the Frontend dApp**:
   ```bash
   npm run dev
   ```

4. **Connect MetaMask**:
   - In MetaMask, add or switch to network **Hardhat Localhost**:
     - RPC URL: `http://127.0.0.1:8545`
     - Chain ID: `31337`
     - Currency Symbol: `ETH`
   - Import any of the test private keys printed by `npm run node:local` (e.g. Account #0: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`).
   - Click **Connect MetaMask** in the navbar. AegisVote will interact with the real blockchain!

---

### Option B: Public Testnet (Sepolia, Polygon Amoy)

1. **Deploy to Sepolia**:
   Set your testnet RPC URL and private key:
   ```bash
   $env:RPC_URL="https://rpc.sepolia.org"
   $env:PRIVATE_KEY="your_sepolia_private_key"
   node scripts/deploy.js
   ```

2. **In AegisVote**:
   - Connect your MetaMask wallet.
   - Use the network switcher in the top bar to switch to **Ethereum Sepolia Testnet** or **Polygon Amoy**.
   - Click the **Settings (gear icon)** in the navbar to enter or update your deployed contract address.

---

### Option C: Instant In-Browser Sandbox Mode

If you don't have MetaMask or a local blockchain running, switch to **Sandbox Node** in the top navbar. You get instant access to pre-funded test personas (*Admin*, *Elena Rostova*, *Marcus Chen*, *Aria Vance*) to test voting, receipts, and ledger auditing right in the browser!

---

## Available NPM Scripts

- `npm run dev`: Starts the Vite development server at `http://localhost:3000`.
- `npm run build`: Compiles production assets with zero errors.
- `npm test`: Runs the automated smart contract unit test suite.
- `npm run compile`: Compiles `contracts/DecentralizedVoting.sol` with `solc 0.8.20`.
- `npm run node:local`: Launches a real local Ethereum blockchain node.
- `npm run deploy:local`: Deploys `DecentralizedVoting.sol` and seeds on-chain elections.

---

## Cryptographic Security & Audit Guarantees

| Vulnerability | Traditional Flaw | AegisVote Blockchain Solution |
| :--- | :--- | :--- |
| **Ballot Stuffing** | Malicious officials inject fake ballots | Cryptographic whitelist gating: only registered addresses can cast, exactly once |
| **Retroactive Alteration** | Database or boxes altered after close | Cryptographically chained blocks with Keccak-256 state roots make modification mathematically impossible |
| **Voter Privacy vs Auditability** | Central databases compromise secret ballot | Keccak-256 ballot receipts prove inclusion without revealing candidate selection to third parties |
| **Central Single Point of Failure** | Central server outage halts election | Distributed EVM peer consensus ensures zero downtime and resilient state replication |
