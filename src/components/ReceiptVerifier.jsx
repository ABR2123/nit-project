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
      <div className="relative rounded-xl overflow-hidden bg-white p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Fingerprint className="w-4 h-4" />
            Cryptographic Audit Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Verify Ballot Inclusion on the Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            In traditional systems, citizens have no direct way to prove their ballot was actually recorded and counted. Under this decentralized framework, every ballot submission generates an immutable Keccak-256 hash receipt sealed into a block. Use this portal to independently verify your ballot receipt.
          </p>
        </div>
      </div>

      {/* Input Search Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Enter Cryptographic Receipt Hash (Keccak-256 / SHA-256)
        </label>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputHash}
              onChange={(e) => setInputHash(e.target.value)}
              placeholder="0x7a82b992dc7a02e6462719582736184920472619582910482910481920581920..."
              className="w-full px-4 py-2.5 pl-11 rounded-lg bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all shadow-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>

          <button
            onClick={() => handleVerify()}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            Verify on Ledger
          </button>
        </div>

        {/* Quick sample chips */}
        {sampleReceipts.length > 0 && (
          <div className="pt-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Sample Verified Receipts (Click to test):
            </p>
            <div className="flex flex-wrap gap-2">
              {sampleReceipts.map((hash, i) => (
                <button
                  key={hash}
                  onClick={() => {
                    setInputHash(hash);
                    handleVerify(hash);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-[11px] font-mono text-slate-700 border border-slate-200 transition-all flex items-center gap-1.5"
                >
                  <Hash className="w-3 h-3 text-slate-400" />
                  Receipt #{i + 1} ({hash.slice(0, 10)}...)
                  <ArrowRight className="w-3 h-3 text-slate-400" />
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
            <div className="bg-emerald-50/40 rounded-xl p-6 border border-emerald-200 space-y-6 shadow-xs">
              
              {/* Status Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      <CheckCircle2 className="w-3 h-3" />
                      Cryptographically Valid & Confirmed
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">
                      Ballot Inclusion Verified on Blockchain
                    </h2>
                    <p className="text-xs text-slate-600">
                      Receipt matches official consensus state of the decentralized voting smart contract.
                    </p>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <span className="text-[11px] text-slate-400 block uppercase font-mono">Consensus State</span>
                  <span className="text-xs font-bold text-emerald-700 font-mono">100% Tamper-Proof</span>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Election</span>
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {result.electionTitle || `Election #${result.electionId}`}
                  </p>
                  <p className="text-xs text-blue-700 font-mono">Election Index: #{result.electionId}</p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Block Inclusion</span>
                  <p className="text-sm font-bold text-slate-900 font-mono">
                    Block #{result.blockNumber}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">
                    {new Date(result.timestamp * 1000).toLocaleString()}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1 md:col-span-2 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Receipt Hash (Keccak-256)</span>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-mono text-slate-800 break-all">
                      {result.receiptHash}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(result.receiptHash);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-all flex-shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1 md:col-span-2 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Transaction Hash</span>
                  <p className="text-xs font-mono text-slate-600 break-all">
                    {result.txHash}
                  </p>
                </div>
              </div>

              {/* Security Guarantee Note */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 space-y-1 shadow-xs">
                <p className="font-semibold text-blue-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  Non-Repudiation Assurance
                </p>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Because the hash was calculated through a one-way collision-resistant hash function and stored inside the smart contract during the active election period, no administrator or central server can alter or replace this ballot without invalidating the entire cryptographic ledger chain.
                </p>
              </div>

            </div>
          ) : (
            <div className="bg-rose-50/50 rounded-xl p-6 border border-rose-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-rose-100 text-rose-700 border border-rose-200">
                  <XCircle className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Receipt Hash Not Found on Ledger
                  </h2>
                  <p className="text-xs text-rose-700">
                    The provided receipt hash does not match any confirmed ballot recorded in the contract registry.
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Check that you copied the complete hexadecimal hash string starting with <code className="text-slate-900 font-mono bg-slate-100 px-1 py-0.5 rounded">0x</code>. If this receipt was generated outside this network or rejected due to a double-voting attempt, it will not exist on-chain.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Audit Explainer Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="bg-white p-5 rounded-xl space-y-2 border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center font-bold text-xs">
            1
          </div>
          <h3 className="text-sm font-bold text-slate-900">Ballot Sealing</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every submitted ballot generates a unique cryptographic commitment combining election parameters, voter authorization, and entropy.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl space-y-2 border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-xs">
            2
          </div>
          <h3 className="text-sm font-bold text-slate-900">Decentralized Consensus</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Transactions are ordered into immutable blocks confirmed by validator nodes, removing single points of failure.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl space-y-2 border border-slate-200 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-xs">
            3
          </div>
          <h3 className="text-sm font-bold text-slate-900">Public Verifiability</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Independent observers and voters can mathematically verify that the election outcome is the true sum of all un-tampered ballots.
          </p>
        </div>
      </div>

    </div>
  );
}
