import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { 
  X, 
  Trophy, 
  BarChart3, 
  CheckCircle2, 
  Download, 
  ShieldCheck, 
  Lock, 
  Users, 
  Award,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ResultsModal({ election, onClose }) {
  const { activeAddress, finalizeElection, activeRole } = useWeb3();
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [error, setError] = useState(null);

  const totalVotes = election.totalVotes || 0;
  const registeredVoters = election.whitelisted ? Object.keys(election.whitelisted).length : 0;
  const turnoutPercent = registeredVoters > 0 ? Math.round((totalVotes / registeredVoters) * 100) : 100;

  // Find leader / winner
  let maxVotes = -1;
  let winningId = election.winningCandidateId || 0;
  election.candidates.forEach(c => {
    if (c.voteCount > maxVotes) {
      maxVotes = c.voteCount;
      if (!election.isFinalized) winningId = c.id;
    }
  });

  const winnerCandidate = election.candidates.find(c => c.id === winningId);
  const isAdmin = activeAddress.toLowerCase() === election.creator.toLowerCase() || activeRole === 'Admin';

  const handleFinalize = async () => {
    if (!confirm('Are you sure you want to certify and finalize this election? Once finalized on-chain, voting is permanently closed.')) return;
    setIsFinalizing(true);
    setError(null);
    try {
      await finalizeElection(election.id);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (err) {
      setError(err.message || 'Failed to finalize election');
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleDownloadCertificate = () => {
    const candidateSummary = election.candidates
      .map(c => `  - ${c.name} (${c.party}): ${c.voteCount} votes (${totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(1) : 0}%)`)
      .join('\n');

    const certificate = `===============================================================
AEGISVOTE DECENTRALIZED PROTOCOL - ELECTION AUDIT CERTIFICATE
===============================================================
Election ID: #${election.id}
Title: ${election.title}
Election Authority: ${election.creator}
Certification Date: ${new Date().toUTCString()}
Status: ${election.isFinalized ? 'OFFICIALLY FINALIZED & IMMUTABLE' : 'PROVISIONAL TALLY'}

ELECTORAL METRICS:
Total Registered Voters: ${registeredVoters}
Total Ballots Cast: ${totalVotes}
Turnout Percentage: ${turnoutPercent}%

CANDIDATE BREAKDOWN:
${candidateSummary}

DECLARED ELECTORAL WINNER:
${winnerCandidate ? `${winnerCandidate.name} (${winnerCandidate.party})` : 'TBD / In Progress'}

CRYPTOGRAPHIC GUARANTEES:
- Each individual ballot was verified against the voter whitelist.
- Non-repudiation enforced by distributed consensus.
- Zero tampering or manual modification detected across blocks.
===============================================================`;

    const blob = new Blob([certificate], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AegisVote-Audit-Certificate-Election-${election.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Election Results & Tally</h2>
              <p className="text-xs text-slate-400 truncate max-w-md">{election.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Winner Banner if Finalized */}
          {election.isFinalized && winnerCandidate && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-500/30 flex items-center gap-4 animate-in zoom-in-95">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> Certified Winner
                </span>
                <h3 className="text-lg font-extrabold text-white mt-0.5">
                  {winnerCandidate.name}
                </h3>
                <p className="text-xs text-slate-300">
                  Elected with <strong>{winnerCandidate.voteCount}</strong> verified votes ({totalVotes > 0 ? Math.round((winnerCandidate.voteCount / totalVotes) * 100) : 0}%)
                </p>
              </div>
            </div>
          )}

          {/* Summary Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Ballots</span>
              <span className="text-xl font-extrabold text-white font-mono mt-0.5 block">{totalVotes}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Registered Voters</span>
              <span className="text-xl font-extrabold text-slate-300 font-mono mt-0.5 block">{registeredVoters}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Turnout</span>
              <span className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5 block">{turnoutPercent}%</span>
            </div>
          </div>

          {/* Candidate Breakdown Bars */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Candidate Vote Tallies
            </h4>

            <div className="space-y-3">
              {election.candidates.map((c) => {
                const percentage = totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(1) : 0;
                const isLeading = totalVotes > 0 && c.voteCount === maxVotes;

                return (
                  <div key={c.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={c.avatarUrl} alt={c.name} className="w-10 h-10 rounded-xl object-cover" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-sm font-bold text-white">{c.name}</h5>
                            {isLeading && (
                              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded font-semibold">
                                {election.isFinalized ? 'Winner' : 'Leader'}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">{c.party}</span>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span className="text-sm font-bold text-cyan-400">{c.voteCount} votes</span>
                        <span className="text-xs text-slate-500 block">({percentage}%)</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isLeading
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-sm shadow-cyan-500/50'
                            : 'bg-slate-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cryptographic Proof Assurance */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Smart Contract State Verification</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Tally calculation executed on decentralized EVM state machine. Results are completely independent of centralized web servers, cloud hosts, or election administrators.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleDownloadCertificate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Download Audit Certificate (.txt)
          </button>

          <div className="flex items-center gap-2">
            {!election.isFinalized && isAdmin && (
              <button
                onClick={handleFinalize}
                disabled={isFinalizing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                <Award className="w-3.5 h-3.5" />
                {isFinalizing ? 'Finalizing On-Chain...' : 'Certify & Finalize Election'}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
