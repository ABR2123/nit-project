import React, { useState } from 'react';
import { useWeb3 } from './context/Web3Context';
import Navbar from './components/Navbar';
import ElectionsView from './components/ElectionsView';
import ReceiptVerifier from './components/ReceiptVerifier';
import BlockchainLedger from './components/BlockchainLedger';
import AdminPanel from './components/AdminPanel';
import BallotModal from './components/BallotModal';
import ResultsModal from './components/ResultsModal';
import { ShieldCheck, Lock, CheckCircle2, Layers } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('elections'); // 'elections' | 'verify' | 'ledger' | 'admin'
  const [votingModalElection, setVotingModalElection] = useState(null);
  const [resultsModalElection, setResultsModalElection] = useState(null);
  const { elections, selectedAccount, providerMode, activeAddress } = useWeb3();

  // Keep modal elections synchronized with Web3 state updates
  const currentVotingElection = votingModalElection
    ? elections.find(e => e.id === votingModalElection.id) || votingModalElection
    : null;

  const currentResultsElection = resultsModalElection
    ? elections.find(e => e.id === resultsModalElection.id) || resultsModalElection
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Persona Context Pill (Subtle hint for sandbox mode) */}
      {providerMode === 'SIMULATED' && (
        <div className="bg-slate-900/60 border-b border-slate-800/60 py-1.5 px-4 text-center text-xs text-slate-400">
          <span className="text-cyan-400 font-semibold">Active Persona:</span>{' '}
          <strong className="text-white">{selectedAccount.name}</strong> ({selectedAccount.role})
          {' '}&bull;{' '}
          <span className="text-slate-400">Address: </span>
          <span className="font-mono text-cyan-300">{activeAddress.slice(0, 8)}...{activeAddress.slice(-4)}</span>
          {' '}&bull;{' '}
          <span className="text-slate-500 text-[11px]">Use the identity dropdown in the top right to test voter vs commissioner permissions.</span>
        </div>
      )}

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'elections' && (
          <ElectionsView
            onVoteClick={(election) => setVotingModalElection(election)}
            onViewResultsClick={(election) => setResultsModalElection(election)}
            onGoToAdmin={() => setActiveTab('admin')}
          />
        )}

        {activeTab === 'verify' && (
          <ReceiptVerifier />
        )}

        {activeTab === 'ledger' && (
          <BlockchainLedger />
        )}

        {activeTab === 'admin' && (
          <AdminPanel
            onElectionCreated={(newId) => {
              setActiveTab('elections');
            }}
          />
        )}
      </main>

      {/* Ballot Modal */}
      {currentVotingElection && (
        <BallotModal
          election={currentVotingElection}
          onClose={() => setVotingModalElection(null)}
          onReceiptReady={(receipt) => {
            // Option to seamlessly view in verify tab
          }}
        />
      )}

      {/* Results & Audit Modal */}
      {currentResultsElection && (
        <ResultsModal
          election={currentResultsElection}
          onClose={() => setResultsModalElection(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 mt-16 py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-200">AegisVote Decentralized Protocol</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-slate-400">EVM Smart Contracts & Keccak-256 Receipts</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400 text-xs">
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              Sybil Attack Protected
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Tamper-Proof Ledger
            </span>
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              100% Audit Verifiable
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
