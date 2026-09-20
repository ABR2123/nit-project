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
    <div className="min-h-screen bg-[#F0F2F7] text-slate-900 flex flex-col selection:bg-blue-100 selection:text-blue-900">

      {/* Top Navbar — hidden during voting to lock the kiosk to the task */}
      {!currentVotingElection && (
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      {/* Persona Context Pill — hidden during voting */}
      {providerMode === 'SIMULATED' && !currentVotingElection && (
        <div className="bg-blue-50/80 border-b border-blue-100 py-2 px-4 text-center text-xs text-slate-600">
          <span className="text-blue-700 font-semibold">Active Persona:</span>{' '}
          <strong className="text-slate-900 font-semibold">{selectedAccount.name}</strong> ({selectedAccount.role})
          {' '}&bull;{' '}
          <span className="text-slate-500">Address: </span>
          <span className="font-mono text-blue-800 bg-white px-1.5 py-0.5 rounded border border-blue-200">{activeAddress.slice(0, 8)}...{activeAddress.slice(-4)}</span>
          {' '}&bull;{' '}
          <span className="text-slate-500 text-[11px]">Use the identity selector in the navigation bar to test voter vs administrator permissions.</span>
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
      <footer className="border-t border-slate-200 bg-white mt-16 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-semibold text-slate-800">Mudra Web3 Architecture</span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-slate-500">Cryptographic Ballot Receipts & Smart Contract Verification</span>
          </div>

          <div className="flex items-center gap-6 text-slate-500 text-xs">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              Sybil Attack Protected
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Tamper-Proof Ledger
            </span>
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              100% Audit Verifiable
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
