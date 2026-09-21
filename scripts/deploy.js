import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ethers } from 'ethers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load compiled artifact
const artifactPath = path.resolve(__dirname, '../src/contracts/DecentralizedVoting.json');
if (!fs.existsSync(artifactPath)) {
  console.error('Artifact not found! Run "node scripts/compile.js" first.');
  process.exit(1);
}
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

// Default Hardhat / Localhost Account #0 private key
const DEFAULT_LOCAL_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
const privateKey = process.env.PRIVATE_KEY || DEFAULT_LOCAL_KEY;

async function main() {
  console.log(`Connecting to real Ethereum blockchain RPC at: ${rpcUrl}...`);
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  let network;
  try {
    network = await provider.getNetwork();
    console.log(`Connected to chain ID: ${network.chainId} (Name: ${network.name})`);
  } catch (err) {
    console.error(`Could not connect to RPC node at ${rpcUrl}. Is your local node or testnet reachable?`);
    console.error(`Error: ${err.message}`);
    console.log('\nTip: To run a local blockchain node with 20 pre-funded accounts, run:\n  npx hardhat node\n');
    process.exit(1);
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  console.log(`Deploying with account address: ${wallet.address}`);
  const balance = await provider.getBalance(wallet.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    console.error('Account has 0 balance! Please fund the account or check private key.');
    process.exit(1);
  }

  console.log('Broadcasting contract deployment transaction to real blockchain...');
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const deployedAddress = await contract.getAddress();
  console.log(`✔ Contract successfully deployed to real blockchain!`);
  console.log(`  Address: ${deployedAddress}`);

  // Create initial demo election directly on-chain
  console.log('\nSeeding initial on-chain election...');
  const now = Math.floor(Date.now() / 1000);
  const startTime = now - 60;
  const endTime = now + 86400 * 5;

  const tx = await contract.createElection(
    'Decentralized AI Safety Governance 2026',
    'Establish ethical guidelines and transparent training data attestations for distributed artificial intelligence.',
    startTime,
    endTime,
    ['Alex Rivera', 'Sophia Kim'],
    ['Open Weights Alliance', 'Zero-Knowledge Alignment Lab'],
    ['Auditable open model weights and decentralized compute', 'Cryptographic zk-proofs of alignment'],
    [
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300'
    ]
  );
  await tx.wait();
  console.log('✔ Initial on-chain election created! Tx:', tx.hash);

  // Whitelist test accounts
  const voterAccounts = [
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    '0x90F79bf6EB2c4f870365E785982E1f101E93b906'
  ];
  const wlTx = await contract.registerVoters(1, voterAccounts);
  await wlTx.wait();
  console.log(`✔ Whitelisted ${voterAccounts.length} test voters on-chain! Tx:`, wlTx.hash);

  // Write deployment info to frontend
  const deployInfo = {
    contractAddress: deployedAddress,
    chainId: Number(network.chainId),
    networkName: network.name,
    deployedAt: new Date().toISOString(),
    rpcUrl
  };

  const outputPath = path.resolve(__dirname, '../src/contracts/deployedAddress.json');
  fs.writeFileSync(outputPath, JSON.stringify(deployInfo, null, 2));
  console.log(`✔ Saved deployment config to: src/contracts/deployedAddress.json`);
}

main().catch(err => {
  console.error('Deployment error:', err);
  process.exit(1);
});
