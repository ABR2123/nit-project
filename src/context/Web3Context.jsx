import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { 
  DECENTRALIZED_VOTING_ABI, 
  DEFAULT_CONTRACT_ADDRESS,
  CONTRACT_BYTECODE
} from '../contracts/DecentralizedVotingABI';

const Web3Context = createContext(null);

export const TEST_ACCOUNTS = [
  {
    id: 'admin',
    name: 'Election Official (Admin)',
    role: 'Admin',
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    balance: '100.00 ETH',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
  },
  {
    id: 'voter1',
    name: 'Elena Rostova',
    role: 'Registered Voter',
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    balance: '25.50 ETH',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100'
  },
  {
    id: 'voter2',
    name: 'Marcus Chen',
    role: 'Registered Voter',
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    balance: '14.20 ETH',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'
  },
  {
    id: 'voter3',
    name: 'Aria Vance',
    role: 'Unregistered Citizen',
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    balance: '8.75 ETH',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'
  }
];

export const SUPPORTED_NETWORKS = {
  31337: {
    chainId: '0x7a69',
    chainName: 'Hardhat Localhost',
    rpcUrls: ['http://127.0.0.1:8545'],
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: null
  },
  11155111: {
    chainId: '0xaa36a7',
    chainName: 'Ethereum Sepolia Testnet',
    rpcUrls: ['https://rpc.sepolia.org'],
    nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://sepolia.etherscan.io']
  },
  80002: {
    chainId: '0x13882',
    chainName: 'Polygon Amoy Testnet',
    rpcUrls: ['https://rpc-amoy.polygon.technology'],
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    blockExplorerUrls: ['https://amoy.polygonscan.com']
  }
};

const INITIAL_SIMULATED_ELECTIONS = [
  {
    id: 1,
    title: 'Global Open Source Protocol Board Election 2026',
    description: 'Elect the executive governance council responsible for approving protocol upgrades, grants distribution, and zero-knowledge privacy infrastructure.',
    startTime: Math.floor(Date.now() / 1000) - 86400,
    endTime: Math.floor(Date.now() / 1000) + 86400 * 3,
    isFinalized: false,
    totalVotes: 3,
    creator: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    winningCandidateId: 0,
    candidates: [
      {
        id: 1,
        name: 'Dr. Sarah Lin',
        party: 'Scaling & Cryptography Alliance',
        manifesto: 'Leading core Ethereum researcher focused on ZK-rollups, post-quantum signatures, and sub-second decentralized finality.',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300',
        voteCount: 2
      },
      {
        id: 2,
        name: 'Jonathan Hayes',
        party: 'Smart Contract Security Council',
        manifesto: 'Formal verification pioneer committed to zero-exploit standards, automated audits, and bug bounty treasuries.',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
        voteCount: 1
      },
      {
        id: 3,
        name: 'Maya Patel',
        party: 'Public Goods & Quadratic DAO',
        manifesto: 'Empowering open-source developers with retroactive public goods funding and sybil-resistant democratic voting protocols.',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
        voteCount: 0
      }
    ],
    whitelisted: {
      '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266': true,
      '0x70997970c51812dc3a010c7d01b50e0d17dc79c8': true,
      '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc': true
    },
    hasVoted: {
      '0x70997970c51812dc3a010c7d01b50e0d17dc79c8': true,
      '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc': true,
      '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266': true
    }
  },
  {
    id: 2,
    title: 'Decentralized AI Safety Governance 2026',
    description: 'Establish ethical guidelines, computational verification bounds, and transparent training data attestations for distributed artificial intelligence.',
    startTime: Math.floor(Date.now() / 1000) - 10000,
    endTime: Math.floor(Date.now() / 1000) + 86400 * 5,
    isFinalized: false,
    totalVotes: 0,
    creator: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    winningCandidateId: 0,
    candidates: [
      {
        id: 1,
        name: 'Alex Rivera',
        party: 'Open Weights Alliance',
        manifesto: 'Advocating for fully auditable open-source model weights, distributed checkpoint validation, and anti-monopoly AI licensing.',
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300',
        voteCount: 0
      },
      {
        id: 2,
        name: 'Sophia Kim',
        party: 'Zero-Knowledge Alignment Lab',
        manifesto: 'Deploying cryptographic zk-proofs of training alignment, privacy-preserving fine-tuning, and algorithmic accountability.',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
        voteCount: 0
      }
    ],
    whitelisted: {
      '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266': true,
      '0x70997970c51812dc3a010c7d01b50e0d17dc79c8': true,
      '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc': true
    },
    hasVoted: {}
  }
];

export function Web3Provider({ children }) {
  // Provider mode: 'REAL_BLOCKCHAIN' (MetaMask / injected Web3 / local RPC) or 'SIMULATED'
  const [providerMode, setProviderMode] = useState(() => {
    return localStorage.getItem('aegisvote_mode') || 'REAL_BLOCKCHAIN';
  });

  // Configurable contract address
  const [contractAddress, setContractAddress] = useState(() => {
    return localStorage.getItem('aegisvote_contract_address') || DEFAULT_CONTRACT_ADDRESS;
  });

  // Real Web3 state
  const [realProvider, setRealProvider] = useState(null);
  const [realSigner, setRealSigner] = useState(null);
  const [realAccount, setRealAccount] = useState(null);
  const [realChainId, setRealChainId] = useState(null);
  const [realNetworkName, setRealNetworkName] = useState('');
  const [isOnChainLoaded, setIsOnChainLoaded] = useState(false);
  const [onChainError, setOnChainError] = useState(null);

  // Simulated state
  const [selectedAccount, setSelectedAccount] = useState(TEST_ACCOUNTS[0]);

  // Blockchain state (both real and simulated)
  const [elections, setElections] = useState(INITIAL_SIMULATED_ELECTIONS);
  const [blocks, setBlocks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [receipts, setReceipts] = useState(() => {
    const cached = localStorage.getItem('aegisvote_receipts');
    return cached ? JSON.parse(cached) : {};
  });

  // Save config
  useEffect(() => {
    localStorage.setItem('aegisvote_mode', providerMode);
  }, [providerMode]);

  useEffect(() => {
    localStorage.setItem('aegisvote_contract_address', contractAddress);
  }, [contractAddress]);

  useEffect(() => {
    localStorage.setItem('aegisvote_receipts', JSON.stringify(receipts));
  }, [receipts]);

  // Active address & role determination
  const activeAddress = providerMode === 'REAL_BLOCKCHAIN'
    ? (realAccount || '0x0000000000000000000000000000000000000000')
    : selectedAccount.address;

  const activeRole = providerMode === 'REAL_BLOCKCHAIN'
    ? (realAccount ? 'MetaMask Signer' : 'Disconnected')
    : selectedAccount.role;

  // Initialize Real Web3 Provider from window.ethereum if available
  useEffect(() => {
    const initWeb3 = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const browserProvider = new ethers.BrowserProvider(window.ethereum);
          setRealProvider(browserProvider);

          const network = await browserProvider.getNetwork();
          const chainIdNum = Number(network.chainId);
          setRealChainId(chainIdNum);
          setRealNetworkName(network.name || (SUPPORTED_NETWORKS[chainIdNum]?.chainName) || `Chain #${chainIdNum}`);

          const accounts = await browserProvider.listAccounts();
          if (accounts.length > 0) {
            const signer = await browserProvider.getSigner();
            setRealSigner(signer);
            setRealAccount(accounts[0].address);
          }

          // Listener for account changes
          window.ethereum.on('accountsChanged', async (accs) => {
            if (accs.length > 0) {
              const signer = await browserProvider.getSigner();
              setRealSigner(signer);
              setRealAccount(accs[0]);
            } else {
              setRealSigner(null);
              setRealAccount(null);
            }
          });

          // Listener for chain changes
          window.ethereum.on('chainChanged', async () => {
            window.location.reload();
          });
        } catch (err) {
          console.warn('Real Web3 initialization error:', err);
        }
      }
    };

    initWeb3();
  }, []);

  // Connect MetaMask
  const connectMetaMask = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert('MetaMask or Web3 wallet extension not detected in your browser. You can install MetaMask from metamask.io, or use the built-in Sandbox Node mode.');
      return false;
    }
    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        const signer = await browserProvider.getSigner();
        const network = await browserProvider.getNetwork();
        setRealProvider(browserProvider);
        setRealSigner(signer);
        setRealAccount(accounts[0]);
        setRealChainId(Number(network.chainId));
        setRealNetworkName(network.name);
        setProviderMode('REAL_BLOCKCHAIN');
        return true;
      }
    } catch (err) {
      console.error('MetaMask connection error:', err);
      alert(`Wallet connection failed: ${err.message}`);
      return false;
    }
  };

  // Switch network
  const switchNetwork = async (targetChainId) => {
    if (!window.ethereum) return;
    const netConfig = SUPPORTED_NETWORKS[targetChainId];
    if (!netConfig) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: netConfig.chainId }],
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [netConfig],
          });
        } catch (addError) {
          console.error('Failed to add network:', addError);
        }
      } else {
        console.error('Failed to switch network:', switchError);
      }
    }
  };

  // Fetch real on-chain contract state
  const refreshOnChainData = useCallback(async () => {
    if (!realProvider || !ethers.isAddress(contractAddress)) return;

    try {
      setOnChainError(null);
      const contract = new ethers.Contract(
        contractAddress,
        DECENTRALIZED_VOTING_ABI,
        realSigner || realProvider
      );

      // Verify contract bytecode exists at address
      const code = await realProvider.getCode(contractAddress);
      if (code === '0x' || code === '') {
        setOnChainError(`No smart contract bytecode deployed at address ${contractAddress} on current network.`);
        return;
      }

      const countBN = await contract.electionCount();
      const count = Number(countBN);
      const fetchedElections = [];

      for (let i = 1; i <= count; i++) {
        const electionData = await contract.getElection(i);
        const candidatesData = await contract.getCandidates(i);

        let userWhitelisted = false;
        let userHasVoted = false;

        if (realAccount) {
          try {
            userWhitelisted = await contract.isWhitelisted(i, realAccount);
            userHasVoted = await contract.hasVoted(i, realAccount);
          } catch (e) {
            // non-fatal
          }
        }

        const formattedCandidates = candidatesData.map(c => ({
          id: Number(c.id),
          name: c.name,
          party: c.party,
          manifesto: c.manifesto,
          avatarUrl: c.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
          voteCount: Number(c.voteCount)
        }));

        fetchedElections.push({
          id: Number(electionData.id),
          title: electionData.title,
          description: electionData.description,
          startTime: Number(electionData.startTime),
          endTime: Number(electionData.endTime),
          isFinalized: electionData.isFinalized,
          totalVotes: Number(electionData.totalVotes),
          creator: electionData.creator,
          winningCandidateId: Number(electionData.winningCandidateId),
          candidates: formattedCandidates,
          whitelisted: realAccount ? { [realAccount.toLowerCase()]: userWhitelisted } : {},
          hasVoted: realAccount ? { [realAccount.toLowerCase()]: userHasVoted } : {}
        });
      }

      setElections(fetchedElections.length > 0 ? fetchedElections : INITIAL_SIMULATED_ELECTIONS);
      setIsOnChainLoaded(true);

      // Fetch on-chain block height & recent blocks
      const currentBlockNum = await realProvider.getBlockNumber();
      const loadedBlocks = [];
      const blocksToFetch = Math.min(5, currentBlockNum + 1);

      for (let b = currentBlockNum; b > currentBlockNum - blocksToFetch && b >= 0; b--) {
        const blk = await realProvider.getBlock(b);
        if (blk) {
          loadedBlocks.push({
            number: blk.number,
            hash: blk.hash,
            parentHash: blk.parentHash,
            timestamp: blk.timestamp,
            txCount: blk.transactions.length,
            validator: blk.miner || '0xValidator',
            gasUsed: `${blk.gasUsed.toString()} Gwei`
          });
        }
      }
      if (loadedBlocks.length > 0) setBlocks(loadedBlocks);

      // Fetch contract events for transaction explorer
      try {
        const voteEvents = await contract.queryFilter(contract.filters.VoteCast());
        const createEvents = await contract.queryFilter(contract.filters.ElectionCreated());

        const onChainTxs = [];
        for (const ev of [...voteEvents, ...createEvents]) {
          const blk = await ev.getBlock();
          const isVote = ev.fragment.name === 'VoteCast';
          onChainTxs.push({
            txHash: ev.transactionHash,
            blockNumber: ev.blockNumber,
            from: isVote ? ev.args[1] : ev.args[4],
            to: contractAddress,
            method: ev.fragment.name === 'VoteCast' ? 'castVote' : 'createElection',
            details: isVote 
              ? `Real Vote in Election #${ev.args[0]} for Candidate #${ev.args[2]}`
              : `Real Election #${ev.args[0]} created: "${ev.args[1]}"`,
            receiptHash: isVote ? ev.args[3] : undefined,
            timestamp: blk ? blk.timestamp : Math.floor(Date.now() / 1000),
            status: 'Confirmed',
            gasUsed: '84,520'
          });
        }
        if (onChainTxs.length > 0) setTransactions(onChainTxs.reverse());
      } catch (e) {
        console.warn('Could not query contract event filter:', e);
      }

    } catch (err) {
      console.warn('Failed to load on-chain smart contract data:', err);
      setOnChainError(`Could not load smart contract: ${err.message}`);
    }
  }, [realProvider, realSigner, realAccount, contractAddress]);

  // Trigger on-chain data fetch when connected
  useEffect(() => {
    if (providerMode === 'REAL_BLOCKCHAIN' && realProvider) {
      refreshOnChainData();
    }
  }, [providerMode, realProvider, realAccount, contractAddress, refreshOnChainData]);

  // Cast vote on real blockchain or simulated
  const castVote = async (electionId, candidateId) => {
    const election = elections.find(e => e.id === Number(electionId));
    if (!election) throw new Error('Election not found');

    const lowerAddr = activeAddress.toLowerCase();
    const now = Math.floor(Date.now() / 1000);

    if (now < election.startTime) throw new Error('Voting has not started yet for this election');
    if (now > election.endTime) throw new Error('Voting period has expired');
    if (election.isFinalized) throw new Error('This election has already been finalized and certified');

    // Generate cryptographic receipt hash: Keccak256(electionId + voter + candidateId + timestamp + salt)
    const salt = ethers.hexlify(ethers.randomBytes(16));
    const receiptData = `${electionId}:${lowerAddr}:${candidateId}:${Date.now()}:${salt}`;
    const receiptHash = ethers.keccak256(ethers.toUtf8Bytes(receiptData));
    const candidate = election.candidates.find(c => c.id === Number(candidateId));

    // REAL BLOCKCHAIN EXECUTION
    if (providerMode === 'REAL_BLOCKCHAIN') {
      if (!realSigner) {
        throw new Error('Please connect your MetaMask wallet to cast a vote on the real blockchain.');
      }
      const contract = new ethers.Contract(contractAddress, DECENTRALIZED_VOTING_ABI, realSigner);

      // Call on-chain castVote
      const tx = await contract.castVote(electionId, candidateId, receiptHash);
      const receiptMined = await tx.wait(1);

      const receiptObj = {
        receiptHash,
        electionId: Number(electionId),
        electionTitle: election.title,
        voter: activeAddress,
        candidateId: Number(candidateId),
        candidateName: candidate ? candidate.name : `Candidate #${candidateId}`,
        txHash: tx.hash,
        blockNumber: receiptMined.blockNumber,
        timestamp: Math.floor(Date.now() / 1000),
        isRealBlockchain: true
      };

      setReceipts(prev => ({ ...prev, [receiptHash]: receiptObj }));
      await refreshOnChainData();
      return receiptObj;
    }

    // SIMULATED EXECUTION
    if (!election.whitelisted || !election.whitelisted[lowerAddr]) {
      throw new Error(`Address ${activeAddress.slice(0, 8)}... is not registered on the voter whitelist. Please register with the election official.`);
    }
    if (election.hasVoted && election.hasVoted[lowerAddr]) {
      throw new Error('Double voting strictly prevented! Your ballot has already been recorded on the ledger.');
    }

    await new Promise(r => setTimeout(r, 600));

    const simulatedTxHash = ethers.keccak256(ethers.toUtf8Bytes(`tx-${Date.now()}-${receiptHash}`));
    const simulatedBlockNum = (blocks[0]?.number || 100000) + 1;

    const receiptObj = {
      receiptHash,
      electionId: Number(electionId),
      electionTitle: election.title,
      voter: activeAddress,
      candidateId: Number(candidateId),
      candidateName: candidate ? candidate.name : `Candidate #${candidateId}`,
      txHash: simulatedTxHash,
      blockNumber: simulatedBlockNum,
      timestamp: Math.floor(Date.now() / 1000),
      isRealBlockchain: false
    };

    setElections(prev => prev.map(el => {
      if (el.id !== Number(electionId)) return el;
      return {
        ...el,
        totalVotes: el.totalVotes + 1,
        candidates: el.candidates.map(c => c.id === Number(candidateId) ? { ...c, voteCount: c.voteCount + 1 } : c),
        hasVoted: { ...el.hasVoted, [lowerAddr]: true }
      };
    }));

    setReceipts(prev => ({ ...prev, [receiptHash]: receiptObj }));
    return receiptObj;
  };

  // Create election on real blockchain or simulated
  const createElection = async ({ title, description, startTime, endTime, candidates }) => {
    if (!title) throw new Error('Election title is required');
    if (endTime <= startTime) throw new Error('End time must be after start time');
    if (candidates.length < 2) throw new Error('At least 2 candidates are required');

    const names = candidates.map(c => c.name);
    const parties = candidates.map(c => c.party || 'Independent');
    const manifestos = candidates.map(c => c.manifesto || '');
    const avatars = candidates.map((c, i) => c.avatarUrl || `https://images.unsplash.com/photo-${1534528741775 + i}?w=200`);

    // REAL BLOCKCHAIN EXECUTION
    if (providerMode === 'REAL_BLOCKCHAIN') {
      if (!realSigner) throw new Error('Please connect your MetaMask wallet to deploy an election on-chain.');
      const contract = new ethers.Contract(contractAddress, DECENTRALIZED_VOTING_ABI, realSigner);

      const tx = await contract.createElection(
        title,
        description,
        startTime,
        endTime,
        names,
        parties,
        manifestos,
        avatars
      );
      await tx.wait(1);
      await refreshOnChainData();
      return 'Real Blockchain Confirmed';
    }

    // SIMULATED EXECUTION
    const newId = elections.length > 0 ? Math.max(...elections.map(e => e.id)) + 1 : 1;
    const formattedCandidates = candidates.map((c, idx) => ({
      id: idx + 1,
      name: c.name,
      party: c.party || 'Independent',
      manifesto: c.manifesto || '',
      avatarUrl: c.avatarUrl || `https://images.unsplash.com/photo-${1534528741775 + idx}?w=200`,
      voteCount: 0
    }));

    const newElection = {
      id: newId,
      title,
      description,
      startTime: Number(startTime),
      endTime: Number(endTime),
      isFinalized: false,
      totalVotes: 0,
      creator: activeAddress,
      winningCandidateId: 0,
      candidates: formattedCandidates,
      whitelisted: {
        [activeAddress.toLowerCase()]: true,
        '0x70997970c51812dc3a010c7d01b50e0d17dc79c8': true,
        '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc': true
      },
      hasVoted: {}
    };

    setElections(prev => [newElection, ...prev]);
    return newId;
  };

  // Register voters
  const registerVoters = async (electionId, addresses) => {
    const validAddresses = addresses.filter(a => ethers.isAddress(a));
    if (validAddresses.length === 0) throw new Error('No valid Ethereum addresses provided');

    if (providerMode === 'REAL_BLOCKCHAIN') {
      if (!realSigner) throw new Error('Please connect your MetaMask wallet to whitelist voters on-chain.');
      const contract = new ethers.Contract(contractAddress, DECENTRALIZED_VOTING_ABI, realSigner);
      const tx = await contract.registerVoters(electionId, validAddresses);
      await tx.wait(1);
      await refreshOnChainData();
      return validAddresses.length;
    }

    // Simulated
    setElections(prev => prev.map(el => {
      if (el.id !== Number(electionId)) return el;
      const updatedWhitelisted = { ...el.whitelisted };
      validAddresses.forEach(a => {
        updatedWhitelisted[a.toLowerCase()] = true;
      });
      return { ...el, whitelisted: updatedWhitelisted };
    }));
    return validAddresses.length;
  };

  // Finalize election
  const finalizeElection = async (electionId) => {
    if (providerMode === 'REAL_BLOCKCHAIN') {
      if (!realSigner) throw new Error('Please connect your MetaMask wallet.');
      const contract = new ethers.Contract(contractAddress, DECENTRALIZED_VOTING_ABI, realSigner);
      const tx = await contract.finalizeElection(electionId);
      await tx.wait(1);
      await refreshOnChainData();
      return true;
    }

    // Simulated
    const election = elections.find(e => e.id === Number(electionId));
    if (!election) throw new Error('Election not found');
    let maxVotes = -1;
    let winningId = 0;
    election.candidates.forEach(c => {
      if (c.voteCount > maxVotes) {
        maxVotes = c.voteCount;
        winningId = c.id;
      }
    });
    setElections(prev => prev.map(el => el.id === Number(electionId) ? { ...el, isFinalized: true, winningCandidateId: winningId } : el));
    return winningId;
  };

  // Verify receipt
  const verifyReceipt = async (receiptHash) => {
    if (!receiptHash) return null;
    const cleanHash = receiptHash.trim();

    // Check local receipts
    if (receipts[cleanHash]) return receipts[cleanHash];

    // If connected to real blockchain, verify directly on smart contract
    if (providerMode === 'REAL_BLOCKCHAIN' && realProvider && ethers.isAddress(contractAddress)) {
      try {
        const contract = new ethers.Contract(contractAddress, DECENTRALIZED_VOTING_ABI, realProvider);
        // Check across elections
        const countBN = await contract.electionCount();
        for (let i = 1; i <= Number(countBN); i++) {
          const isValid = await contract.verifyReceipt(i, cleanHash);
          if (isValid) {
            const election = await contract.getElection(i);
            return {
              receiptHash: cleanHash,
              electionId: i,
              electionTitle: election.title,
              voter: 'Verified Anonymous Voter',
              candidateName: 'Verified On-Chain',
              txHash: 'Confirmed In Block',
              blockNumber: 'Mined',
              timestamp: Math.floor(Date.now() / 1000),
              isRealBlockchain: true
            };
          }
        }
      } catch (err) {
        console.warn('Real contract receipt verification query failed:', err);
      }
    }

    return null;
  };

  return (
    <Web3Context.Provider
      value={{
        providerMode,
        setProviderMode,
        contractAddress,
        setContractAddress,
        selectedAccount,
        setSelectedAccount,
        testAccounts: TEST_ACCOUNTS,
        realAccount,
        realSigner,
        realChainId,
        realNetworkName,
        connectMetaMask,
        switchNetwork,
        supportedNetworks: SUPPORTED_NETWORKS,
        activeAddress,
        activeRole,
        elections,
        blocks,
        transactions,
        receipts,
        isOnChainLoaded,
        onChainError,
        refreshOnChainData,
        castVote,
        createElection,
        registerVoters,
        finalizeElection,
        verifyReceipt
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) throw new Error('useWeb3 must be used within a Web3Provider');
  return context;
};
