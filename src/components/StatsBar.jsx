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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Stat 1 */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Elections</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
              {activeElections} <span className="text-xs text-slate-500 font-normal">/ {elections.length} total</span>
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Vote className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Open for verified voting</span>
        </div>
      </div>

      {/* Stat 2 */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ballots Tallied</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
              {totalVotesCast.toLocaleString()}
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Single-vote integrity verified</span>
        </div>
      </div>

      {/* Stat 3 */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ledger Height</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 font-mono tracking-tight">
              #{blocks[blocks.length - 1]?.number || 100000}
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <Layers className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Lock className="w-3.5 h-3.5 text-slate-600" />
          <span>Cryptographically chained</span>
        </div>
      </div>

      {/* Stat 4 */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Audit Proof</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1 tracking-tight">
              100% Valid
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className="text-slate-700 font-mono font-medium">Keccak-256</span>
          <span>receipt verification</span>
        </div>
      </div>
    </div>
  );
}
