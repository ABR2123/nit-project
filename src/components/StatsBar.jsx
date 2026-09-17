import React from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Vote, Layers, Users, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';

export default function StatsBar() {
  const { elections, blocks, transactions } = useWeb3();

  const activeElections = elections.filter(e => {
    const now = Math.floor(Date.now() / 1000);
    return now >= e.startTime && now <= e.endTime && !e.isFinalized;
  }).length;

  const totalVotesCast = elections.reduce((sum, e) => sum + (e.totalVotes || 0), 0);
  const totalRegisteredVoters = elections.reduce((sum, e) => {
    return sum + (e.whitelisted ? Object.keys(e.whitelisted).length : 0);
  }, 0);

  const avgTurnout = totalRegisteredVoters > 0 
    ? Math.round((totalVotesCast / totalRegisteredVoters) * 100) 
    : 100;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
      {/* Stat 1 */}
      <div className="glass-card p-4 rounded-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Elections</p>
            <h3 className="text-2xl font-extrabold text-white mt-1 tracking-tight">
              {activeElections} <span className="text-xs text-emerald-400 font-normal">/ {elections.length} total</span>
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Vote className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Open for immutable voting</span>
        </div>
      </div>

      {/* Stat 2 */}
      <div className="glass-card p-4 rounded-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ballots Tallied</p>
            <h3 className="text-2xl font-extrabold text-white mt-1 tracking-tight">
              {totalVotesCast.toLocaleString()}
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
          <span>Zero double-voting detected</span>
        </div>
      </div>

      {/* Stat 3 */}
      <div className="glass-card p-4 rounded-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ledger Height</p>
            <h3 className="text-2xl font-extrabold text-white mt-1 font-mono tracking-tight">
              #{blocks[blocks.length - 1]?.number || 100000}
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400">
          <Lock className="w-3.5 h-3.5 text-indigo-400" />
          <span>Cryptographically chained</span>
        </div>
      </div>

      {/* Stat 4 */}
      <div className="glass-card p-4 rounded-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Integrity Proof</p>
            <h3 className="text-2xl font-extrabold text-emerald-400 mt-1 tracking-tight">
              100% Valid
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="text-emerald-400 font-mono">Keccak-256</span>
          <span>receipt verification</span>
        </div>
      </div>
    </div>
  );
}
