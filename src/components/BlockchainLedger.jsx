import React, { useState, useEffect, useRef } from 'react';
import { useWeb3 } from '../context/Web3Context';
import {
  Download,
  CheckCircle2,
  ChevronRight,
  Database,
  Filter,
  Hash,
  Layers,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export default function BlockchainLedger() {
  const { blocks, transactions, contractAddress } = useWeb3();
  const [selectedTx, setSelectedTx] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [activeView, setActiveView] = useState('transactions');
  const [filterMethod, setFilterMethod] = useState('ALL');
  const [tick, setTick] = useState(true);
  const feedRef = useRef(null);

  // Blinking cursor ticker
  useEffect(() => {
    const t = setInterval(() => setTick((p) => !p), 530);
    return () => clearInterval(t);
  }, []);

  // Auto-scroll the table to bottom when new txs arrive
  useEffect(() => {
    if (feedRef.current)
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [transactions.length]);

  const shortenHash = (h) => {
    if (!h) return '—';
    return `${h.slice(0, 10)}…${h.slice(-8)}`;
  };

  const filteredTxs = transactions.filter((tx) => {
    if (filterMethod === 'ALL') return true;
    return tx.method === filterMethod;
  });

  const exportLedgerJson = () => {
    const data = {
      protocol: 'Mudra Web3 Architecture — Decentralized E-Voting',
      contractAddress,
      exportTimestamp: new Date().toISOString(),
      blockHeight: blocks[blocks.length - 1]?.number || 0,
      blocks,
      transactions,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LedgerAudit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Method badge colours
  const methodBadge = (method) => {
    if (method === 'castVote')
      return 'bg-[#003318] text-[#00E676] border border-[#00E676]/25';
    if (method === 'createElection')
      return 'bg-[#1A1A40] text-[#7B68EE] border border-[#7B68EE]/25';
    if (method === 'registerVoters')
      return 'bg-[#001A3A] text-[#00BFFF] border border-[#00BFFF]/25';
    if (method === 'finalizeElection')
      return 'bg-[#1A3300] text-[#ADFF2F] border border-[#ADFF2F]/25';
    if (method === 'commitVote')
      return 'bg-[#003318] text-[#00E676] border border-[#00E676]/25';
    if (method === 'revealVote')
      return 'bg-[#1A0D00] text-[#FF9933] border border-[#FF9933]/25';
    return 'bg-[#0D1321] text-[#4A7AAA] border border-[#1A3050]';
  };

  return (
    <div className="font-mono bg-[#060D1A] min-h-screen text-[#C8D8E8]">

      {/* ── Terminal header bar ─────────────────────────────────────────── */}
      <div className="bg-[#0A1628] border-b border-[#1A3050] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Live indicator */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E676] animate-pulse shadow-[0_0_6px_#00E676]" />
            <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#00E676]">
              LIVE FEED
            </span>
          </div>
          <span className="text-[#1A3050]">|</span>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#4A7AAA]" />
            <span className="text-sm font-bold text-white tracking-wider">
              BLOCKCHAIN INTEGRITY MONITOR
              <span
                className="ml-1 border-r-2 border-[#00E676] text-transparent"
                style={{ opacity: tick ? 1 : 0 }}
              >
                |
              </span>
            </span>
          </div>
        </div>

        <button
          onClick={exportLedgerJson}
          className="flex items-center gap-2 px-4 py-2 border border-[#00E676]/40 hover:border-[#00E676] bg-[#003318]/40 hover:bg-[#003318]/70 text-[#00E676] text-xs font-bold tracking-widest uppercase transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          [ EXPORT LOG ]
        </button>
      </div>

      {/* Description */}
      <div className="bg-[#0A1628] border-b border-[#1A3050] px-6 py-2">
        <p className="text-[11px] text-[#3A5A7A] leading-relaxed">
          {'> '} Distributed ledger immutability verified. All ballot commitments, election lifecycle events,
          and cryptographic proofs are permanently sealed below.
        </p>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Contract address */}
        <div className="bg-[#0D1A2E] border border-[#1A3050] p-4 flex items-center justify-between">
          <div>
            <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-[#3A6080] mb-1">
              Target Contract
            </span>
            <span className="text-[#00BFFF] text-xs">{shortenHash(contractAddress)}</span>
          </div>
          <Database className="w-5 h-5 text-[#1A3050]" />
        </div>

        {/* Consensus */}
        <div className="bg-[#0D1A2E] border border-[#1A3050] p-4 flex items-center justify-between">
          <div>
            <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-[#3A6080] mb-1">
              Consensus Mechanism
            </span>
            <span className="text-[#00E676] text-xs">Proof-of-Stake / BFT</span>
          </div>
          <ShieldCheck className="w-5 h-5 text-[#00E676]/30" />
        </div>

        {/* Tx count */}
        <div className="bg-[#0D1A2E] border border-[#1A3050] p-4 flex items-center justify-between">
          <div>
            <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-[#3A6080] mb-1">
              Recorded Transactions
            </span>
            <span className="text-white text-xs font-bold">
              {transactions.length}{' '}
              <span className="text-[#4A7AAA] font-normal">verified txs</span>
            </span>
          </div>
          <Hash className="w-5 h-5 text-[#1A3050]" />
        </div>
      </div>

      {/* ── View toggle + filter ─────────────────────────────────────────── */}
      <div className="px-6 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Toggle */}
        <div className="flex items-center p-0.5 bg-[#0D1A2E] border border-[#1A3050]">
          <button
            onClick={() => setActiveView('transactions')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
              activeView === 'transactions'
                ? 'bg-[#00E676] text-[#060D1A]'
                : 'text-[#4A7AAA] hover:text-[#00E676]'
            }`}
          >
            Transactions ({transactions.length})
          </button>
          <button
            onClick={() => setActiveView('blocks')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
              activeView === 'blocks'
                ? 'bg-[#00E676] text-[#060D1A]'
                : 'text-[#4A7AAA] hover:text-[#00E676]'
            }`}
          >
            Blocks ({blocks.length})
          </button>
        </div>

        {/* Method filter */}
        {activeView === 'transactions' && (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#3A6080]" />
            <span className="text-[10px] text-[#3A6080] uppercase tracking-widest">Method:</span>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="px-3 py-1.5 bg-[#0D1A2E] border border-[#1A3050] text-[#00E676] text-xs focus:outline-none focus:border-[#00E676] appearance-none cursor-pointer"
            >
              <option value="ALL">ALL</option>
              <option value="castVote">castVote</option>
              <option value="commitVote">commitVote</option>
              <option value="revealVote">revealVote</option>
              <option value="createElection">createElection</option>
              <option value="registerVoters">registerVoters</option>
              <option value="finalizeElection">finalizeElection</option>
            </select>
          </div>
        )}
      </div>

      {/* ── TRANSACTIONS VIEW ────────────────────────────────────────────── */}
      {activeView === 'transactions' && (
        <div className="px-6 pb-8">
          <div className="border border-[#1A3050] overflow-hidden">
            {/* Table scroll wrapper */}
            <div className="overflow-x-auto max-h-[55vh] overflow-y-auto" ref={feedRef}>
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#060D1A] border-b border-[#1A3050] text-[#3A6080] text-[10px] uppercase tracking-widest">
                    <th className="px-4 py-3 font-bold">Ledger Seal (Tx Hash)</th>
                    <th className="px-4 py-3 font-bold">Method</th>
                    <th className="px-4 py-3 font-bold">Block</th>
                    <th className="px-4 py-3 font-bold">From</th>
                    <th className="px-4 py-3 font-bold">Time</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0D1A2E]">
                  {filteredTxs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-[#2A4060]">
                        {'> '} No transactions recorded yet. Awaiting ledger activity…
                        <span className={`border-r border-[#4A7AAA] ml-1 ${tick ? 'opacity-100' : 'opacity-0'}`}>
                          &nbsp;
                        </span>
                      </td>
                    </tr>
                  ) : (
                    filteredTxs.map((tx) => (
                      <tr
                        key={tx.txHash}
                        className="bg-[#0A1628] hover:bg-[#0D1F38] transition-colors cursor-default"
                      >
                        <td className="px-4 py-3 text-[#00BFFF] font-semibold">
                          {shortenHash(tx.txHash)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-[10px] font-bold ${methodBadge(tx.method)}`}>
                            {tx.method}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#4A7AAA]">#{tx.blockNumber}</td>
                        <td className="px-4 py-3 text-[#3A6080]">{shortenHash(tx.from)}</td>
                        <td className="px-4 py-3 text-[#3A6080] font-sans text-[11px]">
                          {new Date(tx.timestamp * 1000).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-[10px] text-[#00E676] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setSelectedTx(tx)}
                            className="px-2.5 py-1 border border-[#1A3050] hover:border-[#00BFFF]/50 bg-transparent hover:bg-[#001A3A] text-[#4A7AAA] hover:text-[#00BFFF] transition-all text-[10px] font-bold uppercase tracking-widest"
                          >
                            [detail]
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── BLOCKS VIEW ─────────────────────────────────────────────────── */}
      {activeView === 'blocks' && (
        <div className="px-6 pb-8 grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...blocks].reverse().map((b) => (
            <div
              key={b.hash}
              onClick={() => setSelectedBlock(b)}
              className="bg-[#0D1A2E] border border-[#1A3050] hover:border-[#00BFFF]/40 p-5 cursor-pointer transition-all hover:bg-[#0F1F38] space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-bold text-white">
                  <Layers className="w-4 h-4 text-[#00BFFF]" />
                  Block #{b.number}
                </span>
                <span className="text-[10px] text-[#3A6080] font-sans">
                  {new Date(b.timestamp * 1000).toLocaleTimeString()}
                </span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#3A6080]">Block Hash:</span>
                  <span className="text-[#00BFFF]">{shortenHash(b.hash)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#3A6080]">Parent Hash:</span>
                  <span className="text-[#2A5070]">{shortenHash(b.parentHash)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#3A6080]">Gas Consumed:</span>
                  <span className="text-[#4A7AAA]">{b.gasUsed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#3A6080]">Transactions:</span>
                  <span className="text-[#00E676] font-bold">{b.txCount} tx</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#1A3050] flex items-center justify-between text-[10px]">
                <span className="text-[#2A4060]">Validator: {shortenHash(b.validator)}</span>
                <span className="text-[#00BFFF] flex items-center gap-1 font-bold">
                  Inspect <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}

          {blocks.length === 0 && (
            <div className="col-span-2 py-12 text-center text-[#2A4060]">
              {'> '} No blocks mined yet. Awaiting first transaction…
            </div>
          )}
        </div>
      )}

      {/* ── TX DETAIL MODAL ──────────────────────────────────────────────── */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#060D1A]/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-[#0A1628] border border-[#1A3050] shadow-2xl shadow-[#00BFFF]/5 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1A3050] pb-3">
              <h3 className="text-sm font-bold text-white tracking-widest uppercase">
                {'> '} Transaction Inspector
              </h3>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-[#3A6080] hover:text-[#00E676] text-xs px-3 py-1 border border-[#1A3050] hover:border-[#00E676]/40 transition-all uppercase tracking-widest"
              >
                [close]
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 bg-[#060D1A] border border-[#1A3050]">
                <span className="block text-[9px] uppercase tracking-widest text-[#3A6080] mb-1 font-bold">
                  Ledger Seal (Tx Hash)
                </span>
                <span className="text-[#00BFFF] break-all">{selectedTx.txHash}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-[#060D1A] border border-[#1A3050]">
                  <span className="block text-[9px] uppercase tracking-widest text-[#3A6080] mb-1 font-bold">
                    Block Number
                  </span>
                  <span className="text-white font-bold">#{selectedTx.blockNumber}</span>
                </div>
                <div className="p-2.5 bg-[#060D1A] border border-[#1A3050]">
                  <span className="block text-[9px] uppercase tracking-widest text-[#3A6080] mb-1 font-bold">
                    Method
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 ${methodBadge(selectedTx.method)}`}>
                    {selectedTx.method}()
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-[#060D1A] border border-[#1A3050]">
                <span className="block text-[9px] uppercase tracking-widest text-[#3A6080] mb-1 font-bold">
                  Execution Details
                </span>
                <p className="text-[#7AAED4]">{selectedTx.details}</p>
              </div>

              {selectedTx.receiptHash && (
                <div className="p-2.5 bg-[#001A3A] border border-[#00BFFF]/25">
                  <span className="block text-[9px] uppercase tracking-widest text-[#00BFFF]/70 mb-1 font-bold">
                    Cryptographic Ballot Receipt
                  </span>
                  <span className="text-[#00BFFF] break-all">{selectedTx.receiptHash}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-[#060D1A] border border-[#1A3050]">
                  <span className="block text-[9px] uppercase tracking-widest text-[#3A6080] mb-1 font-bold">
                    From Sender
                  </span>
                  <span className="text-[#4A7AAA] break-all">{selectedTx.from}</span>
                </div>
                <div className="p-2.5 bg-[#060D1A] border border-[#1A3050]">
                  <span className="block text-[9px] uppercase tracking-widest text-[#3A6080] mb-1 font-bold">
                    To Contract
                  </span>
                  <span className="text-[#4A7AAA] break-all">{selectedTx.to}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BLOCK DETAIL MODAL ───────────────────────────────────────────── */}
      {selectedBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#060D1A]/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-[#0A1628] border border-[#1A3050] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1A3050] pb-3">
              <h3 className="text-sm font-bold text-white tracking-widest uppercase">
                {'> '} Block #{selectedBlock.number} Metadata
              </h3>
              <button
                onClick={() => setSelectedBlock(null)}
                className="text-[#3A6080] hover:text-[#00E676] text-xs px-3 py-1 border border-[#1A3050] hover:border-[#00E676]/40 transition-all uppercase tracking-widest"
              >
                [close]
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-[#060D1A] border border-[#1A3050]">
                <span className="block text-[9px] uppercase tracking-widest text-[#3A6080] mb-1 font-bold">
                  Block Hash
                </span>
                <span className="text-[#00BFFF] break-all">{selectedBlock.hash}</span>
              </div>
              <div className="p-2.5 bg-[#060D1A] border border-[#1A3050]">
                <span className="block text-[9px] uppercase tracking-widest text-[#3A6080] mb-1 font-bold">
                  Parent Block Hash
                </span>
                <span className="text-[#2A5070] break-all">{selectedBlock.parentHash}</span>
              </div>
              <div className="p-2.5 bg-[#060D1A] border border-[#1A3050]">
                <span className="block text-[9px] uppercase tracking-widest text-[#3A6080] mb-1 font-bold">
                  Validator / Proposer
                </span>
                <span className="text-[#4A7AAA]">{selectedBlock.validator}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-[#060D1A] border border-[#1A3050]">
                  <span className="block text-[9px] uppercase tracking-widest text-[#3A6080] mb-1 font-bold">
                    Gas Consumed
                  </span>
                  <span className="text-[#4A7AAA]">{selectedBlock.gasUsed}</span>
                </div>
                <div className="p-2.5 bg-[#060D1A] border border-[#1A3050]">
                  <span className="block text-[9px] uppercase tracking-widest text-[#3A6080] mb-1 font-bold">
                    Transactions
                  </span>
                  <span className="text-[#00E676] font-bold">{selectedBlock.txCount} tx</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
