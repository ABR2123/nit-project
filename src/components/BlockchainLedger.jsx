import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { 
  Layers, 
  Hash, 
  Clock, 
  ArrowRight, 
  FileText, 
  Download, 
  Copy, 
  CheckCircle2, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Database,
  Search,
  Filter
} from 'lucide-react';

export default function BlockchainLedger() {
  const { blocks, transactions, contractAddress } = useWeb3();
  const [selectedTx, setSelectedTx] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [activeView, setActiveView] = useState('transactions'); // 'transactions' | 'blocks'
  const [filterMethod, setFilterMethod] = useState('ALL');
  const [copied, setCopied] = useState(false);

  const shortenHash = (h) => {
    if (!h) return '';
    return `${h.slice(0, 10)}...${h.slice(-8)}`;
  };

  const filteredTxs = transactions.filter(tx => {
    if (filterMethod === 'ALL') return true;
    return tx.method === filterMethod;
  });

  const exportLedgerJson = () => {
    const data = {
      protocol: "AegisVote Decentralized E-Voting Protocol",
      contractAddress,
      exportTimestamp: new Date().toISOString(),
      blockHeight: blocks[blocks.length - 1]?.number || 100000,
      blocks,
      transactions
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AegisVote-Ledger-Audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Decentralized Ledger Explorer
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Live blockchain state and verifiable audit logs. Every ballot submission, election definition, and voter authorization is permanently immured in distributed blocks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportLedgerJson}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export Audit Logs (JSON)
          </button>
        </div>
      </div>

      {/* Contract & Network Meta Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl glass-card border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Target Smart Contract</span>
            <span className="font-mono text-xs text-cyan-400 font-medium">{shortenHash(contractAddress)}</span>
          </div>
          <Database className="w-5 h-5 text-slate-600" />
        </div>

        <div className="p-4 rounded-xl glass-card border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Consensus Mechanism</span>
            <span className="text-xs text-slate-200 font-semibold">Proof of Stake / Byzantine Fault Tolerant</span>
          </div>
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
        </div>

        <div className="p-4 rounded-xl glass-card border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Recorded Transactions</span>
            <span className="text-xs text-slate-200 font-bold font-mono">{transactions.length} Verified Txs</span>
          </div>
          <Hash className="w-5 h-5 text-indigo-400" />
        </div>
      </div>

      {/* Toggle View & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 w-fit">
          <button
            onClick={() => setActiveView('transactions')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'transactions'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Transactions ({transactions.length})
          </button>
          <button
            onClick={() => setActiveView('blocks')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'blocks'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Blocks ({blocks.length})
          </button>
        </div>

        {activeView === 'transactions' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Method:
            </span>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Methods</option>
              <option value="castVote">castVote</option>
              <option value="createElection">createElection</option>
              <option value="registerVoters">registerVoters</option>
              <option value="finalizeElection">finalizeElection</option>
            </select>
          </div>
        )}
      </div>

      {/* TRANSACTIONS VIEW */}
      {activeView === 'transactions' && (
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Tx Hash</th>
                  <th className="px-5 py-3.5 font-semibold">Method</th>
                  <th className="px-5 py-3.5 font-semibold">Block</th>
                  <th className="px-5 py-3.5 font-semibold">From</th>
                  <th className="px-5 py-3.5 font-semibold">Timestamp</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredTxs.map((tx) => {
                  let methodBadge = 'bg-slate-800 text-slate-300';
                  if (tx.method === 'castVote') methodBadge = 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
                  if (tx.method === 'createElection') methodBadge = 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
                  if (tx.method === 'registerVoters') methodBadge = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
                  if (tx.method === 'finalizeElection') methodBadge = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';

                  return (
                    <tr key={tx.txHash} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 text-cyan-400">
                        {shortenHash(tx.txHash)}
                      </td>
                      <td className="px-5 py-4 font-sans font-semibold">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${methodBadge}`}>
                          {tx.method}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        #{tx.blockNumber}
                      </td>
                      <td className="px-5 py-4 text-slate-400">
                        {shortenHash(tx.from)}
                      </td>
                      <td className="px-5 py-4 text-slate-400 font-sans">
                        {new Date(tx.timestamp * 1000).toLocaleTimeString()}
                      </td>
                      <td className="px-5 py-4 font-sans">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-sans">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BLOCKS VIEW */}
      {activeView === 'blocks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...blocks].reverse().map((b) => (
            <div
              key={b.hash}
              onClick={() => setSelectedBlock(b)}
              className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-bold text-white font-mono">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Block #{b.number}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(b.timestamp * 1000).toLocaleTimeString()}
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Block Hash:</span>
                  <span className="font-mono text-cyan-300">{shortenHash(b.hash)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Parent Hash:</span>
                  <span className="font-mono text-slate-500">{shortenHash(b.parentHash)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Gas Consumed:</span>
                  <span className="font-mono text-slate-300">{b.gasUsed}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Transactions in Block:</span>
                  <span className="font-semibold text-emerald-400">{b.txCount} tx</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span>Validator: {shortenHash(b.validator)}</span>
                <span className="text-cyan-400 font-semibold flex items-center gap-1">
                  Inspect Block <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TX DETAIL MODAL */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Transaction Inspector</h3>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Tx Hash</span>
                <span className="font-mono text-cyan-400 break-all">{selectedTx.txHash}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Block Number</span>
                  <span className="font-mono text-slate-200">#{selectedTx.blockNumber}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Method</span>
                  <span className="font-semibold text-emerald-400">{selectedTx.method}()</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Execution Details</span>
                <p className="text-slate-300 mt-1">{selectedTx.details}</p>
              </div>

              {selectedTx.receiptHash && (
                <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30">
                  <span className="text-[10px] text-cyan-400 uppercase block font-semibold">Emitted Receipt Hash</span>
                  <span className="font-mono text-cyan-300 break-all">{selectedTx.receiptHash}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-slate-400">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">From Sender</span>
                  <span className="font-mono text-slate-300 break-all">{selectedTx.from}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">To Contract</span>
                  <span className="font-mono text-slate-300 break-all">{selectedTx.to}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BLOCK DETAIL MODAL */}
      {selectedBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Block #{selectedBlock.number} Metadata</h3>
              <button
                onClick={() => setSelectedBlock(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Block Hash</span>
                <span className="font-mono text-cyan-400 break-all">{selectedBlock.hash}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Parent Block Hash</span>
                <span className="font-mono text-slate-400 break-all">{selectedBlock.parentHash}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Validator / Proposer</span>
                <span className="font-mono text-slate-300">{selectedBlock.validator}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
