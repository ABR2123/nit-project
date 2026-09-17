import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Fingerprint, 
  Clock, 
  Layers, 
  Hash, 
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function ReceiptVerifier() {
  const { verifyReceipt, receipts, elections } = useWeb3();
  const [inputHash, setInputHash] = useState('');
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleVerify = (hashToVerify) => {
    const target = (hashToVerify || inputHash).trim();
    if (!target) return;
    setSearched(true);
    const verified = verifyReceipt(target);
    setResult(verified);
  };

  const sampleReceipts = Object.keys(receipts);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="relative rounded-2xl overflow-hidden glass-panel p-6 sm:p-8 border border-cyan-500/20">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Fingerprint className="w-4 h-4" />
            Zero-Knowledge Cryptographic Audit
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Verify Ballot Inclusion on the Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Traditional paper and electronic voting lack voter-verifiable guarantees. In this decentralized architecture, each ballot generates a cryptographic Keccak-256 hash receipt recorded immutably on-chain. Verify that your vote was tallied without revealing your secret identity.
          </p>
        </div>
      </div>

      {/* Input Search Card */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Enter Cryptographic Receipt Hash (SHA-256 / Keccak-256)
        </label>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputHash}
              onChange={(e) => setInputHash(e.target.value)}
              placeholder="0x7a82b992dc7a02e6462719582736184920472619582910482910481920581920..."
              className="w-full px-4 py-3 pl-11 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-600 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
          </div>

          <button
            onClick={() => handleVerify()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98]"
          >
            <ShieldCheck className="w-4 h-4" />
            Verify on Ledger
          </button>
        </div>

        {/* Quick sample chips */}
        {sampleReceipts.length > 0 && (
          <div className="pt-2">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Quick Test Receipts (Click to populate):
            </p>
            <div className="flex flex-wrap gap-2">
              {sampleReceipts.map((hash, i) => (
                <button
                  key={hash}
                  onClick={() => {
                    setInputHash(hash);
                    handleVerify(hash);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-mono text-cyan-400 border border-slate-800 hover:border-cyan-500/30 transition-all flex items-center gap-1.5"
                >
                  <Hash className="w-3 h-3 text-slate-500" />
                  Receipt #{i + 1} ({hash.slice(0, 10)}...)
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Verification Results Display */}
      {searched && (
        <div className="animate-in fade-in zoom-in-95 duration-200">
          {result ? (
            <div className="glass-card rounded-2xl p-6 border border-emerald-500/30 bg-emerald-950/10 space-y-6">
              
              {/* Status Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      <CheckCircle2 className="w-3 h-3" />
                      Cryptographically Valid & Sealed
                    </span>
                    <h2 className="text-xl font-bold text-white mt-1">
                      Ballot Inclusion Verified on Smart Contract
                    </h2>
                    <p className="text-xs text-slate-300">
                      Receipt matches active state root of decentralized voting ledger.
                    </p>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <span className="text-[11px] text-slate-400 block uppercase font-mono">Consensus State</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">100% Tamper-Proof</span>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Election</span>
                  <p className="text-sm font-bold text-slate-100 truncate">
                    {result.electionTitle || `Election #${result.electionId}`}
                  </p>
                  <p className="text-xs text-cyan-400 font-mono">Election Index: #{result.electionId}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Block Inclusion</span>
                  <p className="text-sm font-bold text-slate-100 font-mono">
                    Block #{result.blockNumber}
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    {new Date(result.timestamp * 1000).toLocaleString()}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 md:col-span-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Receipt Hash (Keccak-256)</span>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-mono text-cyan-300 break-all">
                      {result.receiptHash}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(result.receiptHash);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all flex-shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 md:col-span-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Transaction Hash</span>
                  <p className="text-xs font-mono text-slate-300 break-all">
                    {result.txHash}
                  </p>
                </div>
              </div>

              {/* Security Guarantee Note */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-1">
                <p className="font-semibold text-cyan-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Cryptographic Non-Repudiation Guarantee
                </p>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Because the hash was generated via a one-way collision-resistant function and committed inside the smart contract during the voting window, no central authority or server administrator can remove, alter, or replace this ballot without invalidating the entire blockchain history.
                </p>
              </div>

            </div>
          ) : (
            <div className="glass-card rounded-2xl p-6 border border-rose-500/30 bg-rose-950/10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <XCircle className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Receipt Hash Not Found in Ledger
                  </h2>
                  <p className="text-xs text-rose-300/80">
                    The provided receipt hash does not match any confirmed ballot recorded in the contract registry.
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Check that you copied the complete hexadecimal hash string starting with <code className="text-slate-200">0x</code>. If this receipt was generated outside this network or rejected due to a double-voting attempt, it will not exist on-chain.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Audit Explainer Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="glass-card p-4 rounded-xl space-y-2 border border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-xs">
            1
          </div>
          <h3 className="text-sm font-bold text-white">Ballot Sealing</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every cast vote generates a unique cryptographic commitment combining election parameters, voter authorization, and entropy.
          </p>
        </div>

        <div className="glass-card p-4 rounded-xl space-y-2 border border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
            2
          </div>
          <h3 className="text-sm font-bold text-white">Decentralized Consensus</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Transactions are batched into immutable blocks validated by network peers, eliminating single points of failure.
          </p>
        </div>

        <div className="glass-card p-4 rounded-xl space-y-2 border border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
            3
          </div>
          <h3 className="text-sm font-bold text-white">Public Auditability</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Anyone in the world can mathematically prove the final tally is the exact sum of all valid, un-tampered ballots.
          </p>
        </div>
      </div>

    </div>
  );
}
