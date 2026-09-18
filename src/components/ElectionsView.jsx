import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import StatsBar from './StatsBar';
import ElectionCard from './ElectionCard';
import { Search, Filter, Vote, ShieldCheck, PlusCircle } from 'lucide-react';

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
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-slate-900 font-semibold">Live Blockchain Connected:</strong>
                <span className="text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{realNetworkName || `Chain ID ${realChainId || 'Detecting...'}`}</span>
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5 font-mono truncate max-w-xl">
                Contract: {contractAddress}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!realAccount ? (
              <button
                onClick={connectMetaMask}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all"
              >
                Connect MetaMask
              </button>
            ) : (
              <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[11px]">
                Wallet: {realAccount.slice(0, 6)}...{realAccount.slice(-4)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden bg-white p-6 sm:p-10 border border-slate-200 shadow-xs">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck className="w-4 h-4" />
            Official Decentralized E-Voting System
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
            Transparent, Tamper-Proof & Verifiable Voting
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
            A trusted electoral framework backed by Ethereum smart contracts. Guarantees immutable ballot tallying, automated duplicate vote prevention, and individual cryptographic audit receipts for all registered voters.
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
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all"
            >
              <Vote className="w-4 h-4" />
              Open Ballot Booth
            </button>

            <button
              onClick={onGoToAdmin}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-all"
            >
              <PlusCircle className="w-4 h-4 text-slate-600" />
              Create Election
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time Stats Bar */}
      <StatsBar />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center p-1 rounded-lg bg-slate-100 border border-slate-200 w-fit">
          {[
            { id: 'ALL', label: 'All Elections' },
            { id: 'ACTIVE', label: 'Active Now' },
            { id: 'CONCLUDED', label: 'Concluded' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                filter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
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
            className="w-full px-4 py-2 pl-9 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-xs transition-all"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
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
        <div className="text-center py-16 p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
          <Vote className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Elections Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search criteria or switch filter tabs, or create a new election from the Admin Studio.
          </p>
        </div>
      )}

    </div>
  );
}
