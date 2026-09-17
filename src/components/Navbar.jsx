import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { 
  ShieldCheck, 
  Vote, 
  Search, 
  Layers, 
  PlusCircle, 
  Wallet, 
  ChevronDown, 
  RotateCcw,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Settings,
  Radio,
  Copy
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { 
    providerMode, 
    setProviderMode, 
    contractAddress,
    setContractAddress,
    selectedAccount, 
    setSelectedAccount, 
    testAccounts,
    realAccount,
    realChainId,
    realNetworkName,
    connectMetaMask,
    switchNetwork,
    supportedNetworks,
    blocks,
    isOnChainLoaded,
    onChainError
  } = useWeb3();

  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempAddress, setTempAddress] = useState(contractAddress);
  const [copied, setCopied] = useState(false);

  const shortenAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleSaveContractAddress = (e) => {
    e.preventDefault();
    if (tempAddress.trim()) {
      setContractAddress(tempAddress.trim());
      setShowConfigModal(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('elections')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 shadow-lg shadow-cyan-500/20 text-white">
              <ShieldCheck className="w-5 h-5" />
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  Aegis<span className="text-cyan-400">Vote</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {providerMode === 'REAL_BLOCKCHAIN' ? 'Live Web3' : 'Sandbox'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Decentralized E-Voting Protocol</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('elections')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'elections'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Vote className="w-4 h-4" />
              Elections
            </button>

            <button
              onClick={() => setActiveTab('verify')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'verify'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Search className="w-4 h-4" />
              Verify Receipt
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'ledger'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              Ledger Explorer
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Admin Studio
            </button>
          </nav>

          {/* Wallet / Network Controls */}
          <div className="flex items-center gap-2">
            
            {/* Mode Switcher */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium">
              <button
                onClick={() => setProviderMode('REAL_BLOCKCHAIN')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                  providerMode === 'REAL_BLOCKCHAIN'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Connect real blockchain (MetaMask / Local Hardhat Node / Sepolia)"
              >
                <Radio className="w-3 h-3" />
                Real Blockchain
              </button>
              <button
                onClick={() => setProviderMode('SIMULATED')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  providerMode === 'SIMULATED'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Instant zero-setup in-browser sandbox node"
              >
                Sandbox
              </button>
            </div>

            {/* REAL BLOCKCHAIN MODE CONTROLS */}
            {providerMode === 'REAL_BLOCKCHAIN' ? (
              <div className="flex items-center gap-2">
                {realAccount ? (
                  <>
                    {/* Network Switcher Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:border-cyan-500/40"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="hidden sm:inline font-medium">{realNetworkName || `Chain #${realChainId}`}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </button>

                      {showNetworkDropdown && (
                        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50">
                          <p className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Switch Real Network</p>
                          <div className="space-y-1">
                            {Object.entries(supportedNetworks).map(([cid, net]) => (
                              <button
                                key={cid}
                                onClick={() => {
                                  switchNetwork(Number(cid));
                                  setShowNetworkDropdown(false);
                                }}
                                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs text-left ${
                                  realChainId === Number(cid)
                                    ? 'bg-cyan-500/10 text-cyan-400 font-semibold'
                                    : 'text-slate-300 hover:bg-slate-800'
                                }`}
                              >
                                <span>{net.chainName}</span>
                                {realChainId === Number(cid) && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Connected Account Pill */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      {shortenAddress(realAccount)}
                    </div>
                  </>
                ) : (
                  <button
                    onClick={connectMetaMask}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    Connect MetaMask
                  </button>
                )}

                {/* Contract Config Button */}
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all"
                  title="Configure Smart Contract Address"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* SIMULATED SANDBOX MODE CONTROLS */
              <div className="relative">
                <button
                  onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 hover:border-cyan-500/40 text-xs transition-all shadow-sm"
                >
                  <img
                    src={selectedAccount.avatar}
                    alt={selectedAccount.name}
                    className="w-5 h-5 rounded-full object-cover border border-cyan-500/30"
                  />
                  <div className="text-left hidden sm:block">
                    <p className="font-semibold text-slate-200 truncate max-w-[120px]">{selectedAccount.name}</p>
                    <p className="text-[10px] text-cyan-400 font-mono">{shortenAddress(selectedAccount.address)}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                </button>

                {showAccountDropdown && (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Switch Persona</p>
                      <p className="text-xs text-slate-500">Test voter vs commissioner roles</p>
                    </div>
                    <div className="py-1 space-y-1">
                      {testAccounts.map((acc) => (
                        <button
                          key={acc.id}
                          onClick={() => {
                            setSelectedAccount(acc);
                            setShowAccountDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${
                            selectedAccount.id === acc.id
                              ? 'bg-cyan-500/10 border border-cyan-500/30'
                              : 'hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <img src={acc.avatar} alt={acc.name} className="w-7 h-7 rounded-full object-cover" />
                            <div>
                              <p className="text-xs font-semibold text-slate-200">{acc.name}</p>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                  acc.role === 'Admin' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                                }`}>
                                  {acc.role}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">{shortenAddress(acc.address)}</span>
                              </div>
                            </div>
                          </div>
                          {selectedAccount.id === acc.id && (
                            <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Contract Address Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-400" />
                Smart Contract Connection
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveContractAddress} className="space-y-4 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Connect AegisVote to any deployed <code className="text-cyan-400">DecentralizedVoting.sol</code> contract on Sepolia, Polygon Amoy, or your local Hardhat node.
              </p>

              <div className="space-y-1.5">
                <label className="block text-slate-400 font-semibold uppercase">Contract Address</label>
                <input
                  type="text"
                  value={tempAddress}
                  onChange={(e) => setTempAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-cyan-300 text-xs focus:ring-2 focus:ring-cyan-500/50 outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">How to deploy locally:</span>
                <p className="text-slate-400 font-mono text-[11px]">
                  1. Run: <code className="text-cyan-400">npx hardhat node</code><br/>
                  2. In another terminal: <code className="text-cyan-400">node scripts/deploy.js</code>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
