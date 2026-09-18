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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('elections')}>
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  Aegis<span className="text-blue-600">Vote</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {providerMode === 'REAL_BLOCKCHAIN' ? 'Live Web3' : 'Sandbox'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Official E-Voting System</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('elections')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'elections'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Vote className="w-4 h-4" />
              Elections
            </button>

            <button
              onClick={() => setActiveTab('verify')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'verify'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Search className="w-4 h-4" />
              Verify Receipt
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'ledger'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              Ledger Explorer
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Admin Studio
            </button>
          </nav>

          {/* Wallet / Network Controls */}
          <div className="flex items-center gap-2">
            
            {/* Mode Switcher */}
            <div className="flex items-center p-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium">
              <button
                onClick={() => setProviderMode('REAL_BLOCKCHAIN')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                  providerMode === 'REAL_BLOCKCHAIN'
                    ? 'bg-white text-blue-700 font-semibold shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
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
                    ? 'bg-white text-blue-700 font-semibold shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
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
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 hover:border-slate-300 shadow-xs"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="hidden sm:inline font-medium">{realNetworkName || `Chain #${realChainId}`}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </button>

                      {showNetworkDropdown && (
                        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl p-2 z-50">
                          <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Switch Network</p>
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
                                    ? 'bg-blue-50 text-blue-700 font-semibold'
                                    : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <span>{net.chainName}</span>
                                {realChainId === Number(cid) && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Connected Account Pill */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {shortenAddress(realAccount)}
                    </div>
                  </>
                ) : (
                  <button
                    onClick={connectMetaMask}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    Connect MetaMask
                  </button>
                )}

                {/* Contract Config Button */}
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all shadow-xs"
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
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-xs transition-all shadow-xs"
                >
                  <img
                    src={selectedAccount.avatar}
                    alt={selectedAccount.name}
                    className="w-5 h-5 rounded-full object-cover border border-slate-200"
                  />
                  <div className="text-left hidden sm:block">
                    <p className="font-semibold text-slate-800 truncate max-w-[120px]">{selectedAccount.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{shortenAddress(selectedAccount.address)}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                </button>

                {showAccountDropdown && (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Switch Persona</p>
                      <p className="text-xs text-slate-400">Test voter vs administrator roles</p>
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
                              ? 'bg-blue-50 border border-blue-200'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <img src={acc.avatar} alt={acc.name} className="w-7 h-7 rounded-full object-cover border border-slate-200" />
                            <div>
                              <p className="text-xs font-semibold text-slate-800">{acc.name}</p>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                  acc.role === 'Admin' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}>
                                  {acc.role}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">{shortenAddress(acc.address)}</span>
                              </div>
                            </div>
                          </div>
                          {selectedAccount.id === acc.id && (
                            <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-600" />
                Smart Contract Connection
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-500 hover:text-slate-800 text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSaveContractAddress} className="space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Connect to any deployed <code className="text-blue-700 font-mono bg-blue-50 px-1 py-0.5 rounded">DecentralizedVoting.sol</code> contract on Sepolia, Polygon Amoy, or your local Hardhat node.
              </p>

              <div className="space-y-1.5">
                <label className="block text-slate-700 font-semibold uppercase">Contract Address</label>
                <input
                  type="text"
                  value={tempAddress}
                  onChange={(e) => setTempAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 font-mono text-slate-900 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">How to deploy locally:</span>
                <p className="text-slate-600 font-mono text-[11px]">
                  1. Run: <code className="text-blue-700">npx hardhat node</code><br/>
                  2. In another terminal: <code className="text-blue-700">node scripts/deploy.js</code>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
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
