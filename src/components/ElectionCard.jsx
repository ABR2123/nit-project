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
  ChevronRight
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
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 transition-all duration-200 hover:border-slate-300 hover:shadow-md flex flex-col justify-between relative group">
      
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {isActive && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Voting Active
              </span>
            )}
            {isUpcoming && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <Clock className="w-3 h-3" />
                Upcoming
              </span>
            )}
            {isClosed && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <ShieldCheck className="w-3 h-3 text-slate-600" />
                Finalized
              </span>
            )}

            <span className="text-[11px] font-mono text-slate-400">
              ID #{election.id}
            </span>
          </div>

          {/* Countdown timer */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{timeLeft}</span>
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
          {election.title}
        </h3>
        <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
          {election.description}
        </p>

        {/* Candidates Mini-Preview */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Candidates ({election.candidates.length})
          </p>
          <div className="space-y-1.5">
            {election.candidates.slice(0, 3).map((cand) => {
              const voteShare = election.totalVotes > 0
                ? Math.round((cand.voteCount / election.totalVotes) * 100)
                : 0;
              const isWinner = winningCandidate && winningCandidate.id === cand.id;

              return (
                <div key={cand.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-5 h-5 rounded-sm bg-[#0F2A57] border border-[#FF9933]/50 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[7px] font-bold leading-none">
                        {cand.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-800 truncate">{cand.name}</span>
                    {isWinner && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-semibold">
                        <Trophy className="w-3 h-3" /> Winner
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 text-slate-500 font-mono text-[11px]">
                    <span>{cand.voteCount} votes</span>
                    <span className="text-blue-600 font-medium">({voteShare}%)</span>
                  </div>
                </div>
              );
            })}
            {election.candidates.length > 3 && (
              <p className="text-[11px] text-slate-400 text-center">
                + {election.candidates.length - 3} more candidates
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer & Actions */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-3">
        {/* User status badge */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            Total Votes: <strong className="text-slate-800 font-mono">{election.totalVotes}</strong>
          </span>

          <div>
            {hasVoted ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ballot Cast
              </span>
            ) : !isWhitelisted ? (
              <span className="inline-flex items-center gap-1 text-slate-500 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                Not Registered
              </span>
            ) : isActive ? (
              <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-medium">
                Eligible to Vote
              </span>
            ) : null}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isActive && !hasVoted && (
            <button
              onClick={() => onVoteClick(election)}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#0F2A57] hover:bg-[#1A3F7A] text-white font-semibold text-xs shadow-xs transition-all"
            >
              <Vote className="w-4 h-4" />
              Cast Ballot
            </button>
          )}

          <button
            onClick={() => onViewResultsClick(election)}
            className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition-all border ${
              isActive && !hasVoted
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
                : 'flex-1 bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-xs font-semibold'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            {isClosed ? 'View Certified Results' : 'Live Tally & Results'}
          </button>
        </div>
      </div>

    </div>
  );
}
