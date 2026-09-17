import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import StatsBar from './StatsBar';
import ElectionCard from './ElectionCard';
import { Search, Filter, Vote, ShieldCheck, Sparkles, PlusCircle } from 'lucide-react';

export default function ElectionsView({ onVoteClick, onViewResultsClick, onGoToAdmin }) {
  const { 
    elections, 
    providerMode, 
    realAccount, 
    realNetworkName, 
    realChainId, 
    contractAddress, 
    onChainError, 
    isOnChainLoaded,
    connectMetaMask 
  } = useWeb3();
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'CONCLUDED'
  const [searchQuery, setSearchQuery] = useState('');

  const now = Math.floor(Date.now() / 1000);

  const filteredElections = elections.filter(e => {
    const isClosed = now > e.endTime || e.isFinalized;
    const isUpcoming = now < e.startTime;
    const isActive = !isClosed && !isUpcoming;

    if (filter === 'ACTIVE' && !isActive) return false;
    if (filter === 'CONCLUDED' && !isClosed) return false;
    if (filter === 'UPCOMING' && !isUpcoming) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = e.title.toLowerCase().includes(q);
      const matchDesc = e.description.toLowerCase().includes(q);
      const matchCand = e.candidates.some(c => c.name.toLowerCase().includes(q) || c.party.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchCand;
    }

    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Real Blockchain Network Status Callout */}
      {providerMode === 'REAL_BLOCKCHAIN' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-white font-semibold">Real Blockchain Active:</strong>
                <span className="text-cyan-400 font-mono">{realNetworkName || `Chain ID ${realChainId || 'Detecting...'}`}</span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5 font-mono truncate max-w-xl">
                Contract: {contractAddress}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!realAccount ? (
              <button
                onClick={connectMetaMask}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all"
              >
                Connect MetaMask
              </button>
            ) : (
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-[11px]">
                Wallet: {realAccount.slice(0, 6)}...{realAccount.slice(-4)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden glass-panel p-6 sm:p-10 border border-slate-800">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-gradient-to-br from-cyan-500/20 via-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <ShieldCheck className="w-4 h-4" />
            Decentralized Governance & Cryptographic Assurance
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Transparent, Tamper-Proof & <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">Verifiable Elections</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Empowered by distributed ledgers and Ethereum smart contracts. Elimination of single points of failure, automated Sybil prevention, and mathematical ballot proof for every citizen.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                const firstActive = elections.find(e => {
                  const curr = Math.floor(Date.now() / 1000);
                  return curr >= e.startTime && curr <= e.endTime && !e.isFinalized;
                });
                if (firstActive) onVoteClick(firstActive);
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all active:scale-[0.98]"
            >
              <Vote className="w-4 h-4" />
              Explore Ballot Booth
            </button>

            <button
              onClick={onGoToAdmin}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
            >
              <PlusCircle className="w-4 h-4 text-cyan-400" />
              Deploy New Election
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time Stats Bar */}
      <StatsBar />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 w-fit">
          {[
            { id: 'ALL', label: 'All Elections' },
            { id: 'ACTIVE', label: 'Active Now' },
            { id: 'CONCLUDED', label: 'Concluded' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === tab.id
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search elections, candidates..."
            className="w-full px-4 py-2 pl-9 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Elections Grid */}
      {filteredElections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredElections.map((election) => (
            <ElectionCard
              key={election.id}
              election={election}
              onVoteClick={onVoteClick}
              onViewResultsClick={onViewResultsClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 p-6 rounded-2xl glass-card border border-slate-800 space-y-3">
          <Vote className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Elections Match Your Criteria</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search keywords or filter tab, or deploy a new election from the Admin Studio.
          </p>
        </div>
      )}

    </div>
  );
}
