import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { 
  Clock, 
  Users, 
  Vote, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle, 
  Trophy, 
  ShieldCheck, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function ElectionCard({ election, onVoteClick, onViewResultsClick }) {
  const { activeAddress } = useWeb3();
  const [timeLeft, setTimeLeft] = useState('');

  const now = Math.floor(Date.now() / 1000);
  const isUpcoming = now < election.startTime;
  const isClosed = now > election.endTime || election.isFinalized;
  const isActive = !isUpcoming && !isClosed;

  // Voter status
  const lowerAddr = activeAddress.toLowerCase();
  const isWhitelisted = election.whitelisted && !!election.whitelisted[lowerAddr];
  const hasVoted = election.hasVoted && !!election.hasVoted[lowerAddr];

  // Countdown calculation
  useEffect(() => {
    const updateTimer = () => {
      const current = Math.floor(Date.now() / 1000);
      if (isClosed) {
        setTimeLeft('Concluded');
        return;
      }
      if (isUpcoming) {
        const diff = election.startTime - current;
        if (diff <= 0) {
          setTimeLeft('Starting now');
        } else {
          const days = Math.floor(diff / 86400);
          const hours = Math.floor((diff % 86400) / 3600);
          const mins = Math.floor((diff % 3600) / 60);
          setTimeLeft(`Starts in ${days > 0 ? `${days}d ` : ''}${hours}h ${mins}m`);
        }
        return;
      }
      const diff = election.endTime - current;
      if (diff <= 0) {
        setTimeLeft('Voting Ended');
      } else {
        const days = Math.floor(diff / 86400);
        const hours = Math.floor((diff % 86400) / 3600);
        const mins = Math.floor((diff % 3600) / 60);
        const secs = Math.floor(diff % 60);
        setTimeLeft(`${days > 0 ? `${days}d ` : ''}${hours}h ${mins}m ${secs}s left`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [election, isClosed, isUpcoming]);

  // Winning candidate if closed
  const winningCandidate = isClosed && election.winningCandidateId
    ? election.candidates.find(c => c.id === election.winningCandidateId)
    : null;

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/5 flex flex-col justify-between relative group">
      
      {/* Glow background accent */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/15 transition-all"></div>

      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {isActive && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Voting Active
              </span>
            )}
            {isUpcoming && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                <Clock className="w-3 h-3" />
                Upcoming
              </span>
            )}
            {isClosed && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                Finalized & Certified
              </span>
            )}

            <span className="text-[11px] font-mono text-slate-500">
              ID #{election.id}
            </span>
          </div>

          {/* Countdown timer */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{timeLeft}</span>
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
          {election.title}
        </h3>
        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
          {election.description}
        </p>

        {/* Candidates Mini-Preview */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Candidates ({election.candidates.length})
          </p>
          <div className="space-y-1.5">
            {election.candidates.slice(0, 3).map((cand) => {
              const voteShare = election.totalVotes > 0
                ? Math.round((cand.voteCount / election.totalVotes) * 100)
                : 0;
              const isWinner = winningCandidate && winningCandidate.id === cand.id;

              return (
                <div key={cand.id} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-900/40 border border-slate-800/60">
                  <div className="flex items-center gap-2 truncate">
                    <img src={cand.avatarUrl} alt={cand.name} className="w-5 h-5 rounded-full object-cover" />
                    <span className="font-medium text-slate-200 truncate">{cand.name}</span>
                    {isWinner && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded font-bold">
                        <Trophy className="w-3 h-3" /> Winner
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 text-slate-400 font-mono text-[11px]">
                    <span>{cand.voteCount} votes</span>
                    <span className="text-cyan-400">({voteShare}%)</span>
                  </div>
                </div>
              );
            })}
            {election.candidates.length > 3 && (
              <p className="text-[11px] text-slate-500 text-center">
                + {election.candidates.length - 3} more candidates
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer & Actions */}
      <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col gap-3">
        {/* User status badge */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            Total Votes: <strong className="text-slate-200 font-mono">{election.totalVotes}</strong>
          </span>

          <div>
            {hasVoted ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ballot Cast
              </span>
            ) : !isWhitelisted ? (
              <span className="inline-flex items-center gap-1 text-slate-500 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5" />
                Not Whitelisted
              </span>
            ) : isActive ? (
              <span className="inline-flex items-center gap-1 text-cyan-400 text-[11px] font-semibold animate-pulse">
                Ready to Vote
              </span>
            ) : null}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isActive && !hasVoted && (
            <button
              onClick={() => onVoteClick(election)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all active:scale-[0.98]"
            >
              <Vote className="w-4 h-4" />
              Cast Ballot
            </button>
          )}

          <button
            onClick={() => onViewResultsClick(election)}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all border ${
              isActive && !hasVoted
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                : 'flex-1 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white border-slate-700 shadow-md'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            {isClosed ? 'View Certified Results' : 'Live Tally & Analytics'}
          </button>
        </div>
      </div>

    </div>
  );
}
