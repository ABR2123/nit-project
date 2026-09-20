import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import {
  CheckCircle2,
  AlertCircle,
  Lock,
  Copy,
  Download,
  Fingerprint,
  ShieldCheck,
  Clock,
  ChevronLeft,
  ArrowRight,
} from 'lucide-react';

// ─── Formal candidate silhouette badge ───────────────────────────────────────
function CandidateBadge({ name }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-16 h-16 rounded-none bg-[#0F2A57] border-2 border-[#FF9933] flex flex-col items-center justify-center flex-shrink-0">
      {/* Universal silhouette SVG */}
      <svg viewBox="0 0 40 44" className="w-7 h-7" fill="white" opacity="0.65">
        <circle cx="20" cy="12" r="9" />
        <path d="M2 44c0-9.941 8.059-18 18-18s18 8.059 18 18z" />
      </svg>
      <span className="text-white text-[8px] font-bold tracking-widest mt-0.5 leading-none">
        {initials}
      </span>
    </div>
  );
}

// ─── Step constants ───────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Identity\nVerified' },
  { id: 2, label: 'Select\nCandidate' },
  { id: 3, label: 'Review &\nConfirm' },
  { id: 4, label: 'Ledger\nSeal' },
];

function stepIndexFromState(step) {
  if (step === 'select') return 2;
  if (step === 'confirm') return 3;
  if (step === 'submitting' || step === 'success') return 4;
  return 2;
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ step }) {
  const activeStep = stepIndexFromState(step);
  const isSuccess = step === 'success';
  return (
    <div className="flex items-stretch w-full">
      {STEPS.map((s, idx) => {
        const isDone = s.id < activeStep || (s.id === 4 && isSuccess);
        const isActive = s.id === activeStep && !isSuccess;
        const connector = idx < STEPS.length - 1;
        return (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center flex-1 pt-3 pb-2 px-1">
              {/* Circle */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-all ${
                  isDone
                    ? 'bg-[#138808] border-[#138808] text-white'
                    : isActive
                    ? 'bg-[#FF9933] border-[#FF9933] text-white'
                    : 'bg-[#1A3A6A] border-[#2A4A80] text-[#4A7AAA]'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.id}
              </div>
              {/* Label */}
              <p
                className={`mt-1.5 text-[9px] font-semibold uppercase tracking-wide text-center leading-tight whitespace-pre-line ${
                  isDone
                    ? 'text-[#138808]'
                    : isActive
                    ? 'text-[#FF9933]'
                    : 'text-[#4A7AAA]'
                }`}
              >
                {s.label}
              </p>
            </div>
            {/* Connector line */}
            {connector && (
              <div className="flex items-start pt-7">
                <div
                  className={`h-0.5 w-6 sm:w-10 transition-all ${
                    s.id < activeStep ? 'bg-[#138808]' : 'bg-[#1A3A6A]'
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function BallotModal({ election, onClose, onReceiptReady }) {
  const { castVote, activeAddress } = useWeb3();

  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [step, setStep] = useState('select'); // 'select' | 'confirm' | 'submitting' | 'success'
  const [error, setError] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [copied, setCopied] = useState(false);

  const lowerAddr = activeAddress.toLowerCase();
  const isWhitelisted = election.whitelisted && !!election.whitelisted[lowerAddr];
  const hasAlreadyVoted = election.hasVoted && !!election.hasVoted[lowerAddr];

  const now = Math.floor(Date.now() / 1000);
  const isExpired = now > election.endTime;
  const isNotStarted = now < election.startTime;

  const selectedCandidate = election.candidates.find((c) => c.id === selectedCandidateId);
  const canSelect =
    isWhitelisted && !hasAlreadyVoted && !isExpired && !isNotStarted && !election.isFinalized;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleConfirmVote = async () => {
    if (!selectedCandidateId) return;
    setError(null);
    setStep('submitting');
    try {
      const generatedReceipt = await castVote(election.id, selectedCandidateId);
      setReceipt(generatedReceipt);
      setStep('success');
      if (onReceiptReady) onReceiptReady(generatedReceipt);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to record ballot on the distributed ledger.');
      setStep('select');
    }
  };

  const handleCopyReceipt = () => {
    if (!receipt) return;
    navigator.clipboard.writeText(receipt.receiptHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReceipt = () => {
    if (!receipt) return;
    const content = `=====================================================
ELECTION COMMISSION OF INDIA
DIGITAL VOTING TERMINAL — OFFICIAL BALLOT RECEIPT
=====================================================
Election ID: #${receipt.electionId}
Election Title: ${receipt.electionTitle}
Voter Address: ${receipt.voter}
Selected Candidate: ${receipt.candidateName}
Timestamp: ${new Date(receipt.timestamp * 1000).toUTCString()}

DISTRIBUTED LEDGER AUDIT PROOF:
Block Number: #${receipt.blockNumber}
Distributed Ledger Seal: ${receipt.txHash}
Cryptographic Ballot Receipt:
${receipt.receiptHash}

VERIFICATION INSTRUCTIONS:
Paste the Cryptographic Ballot Receipt into the
"Verify Ballot" portal to independently confirm
that your vote remains untampered on the national
distributed ledger.

STATUS: VALID & RECORDED IMMUTABLY
=====================================================`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BallotReceipt-Election-${receipt.electionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    /* Full-screen kiosk overlay — covers the navbar entirely */
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0F2A57] overflow-hidden">

      {/* ── India tricolor accent bar ── */}
      <div className="flex h-1.5 w-full flex-shrink-0">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      {/* ── Institutional header ── */}
      <div className="bg-[#0A1E40] border-b border-[#1A3A6A] px-6 py-3 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#FF9933]">
              Election Commission · Digital Voting Terminal
            </p>
            <h1 className="text-white font-bold text-base mt-0.5 leading-tight">
              {election.title}
            </h1>
          </div>
          {/* Voter credential chip */}
          <div className="text-right">
            <p className="text-[9px] font-semibold tracking-widest uppercase text-[#4A7AAA]">
              Voter Identification
            </p>
            <p className="font-mono text-[11px] text-[#7AAED4] mt-0.5">
              {activeAddress.slice(0, 8)}…{activeAddress.slice(-6)}
            </p>
            <div className="mt-1">
              {!isWhitelisted ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 bg-rose-900/40 border border-rose-700/50 px-2 py-0.5 rounded font-semibold">
                  <AlertCircle className="w-3 h-3" /> Not Registered
                </span>
              ) : hasAlreadyVoted ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 bg-amber-900/30 border border-amber-700/40 px-2 py-0.5 rounded font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Ballot Cast
                </span>
              ) : isExpired ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/50 border border-slate-600/40 px-2 py-0.5 rounded font-semibold">
                  <Clock className="w-3 h-3" /> Voting Closed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] text-[#138808] bg-[#138808]/10 border border-[#138808]/40 px-2 py-0.5 rounded font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Verified Voter
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4-step progress bar ── */}
      <div className="bg-[#0A1E40] border-b border-[#1A3A6A] px-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <ProgressBar step={step} />
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="bg-rose-900/60 border-b border-rose-700 px-6 py-3 flex items-center gap-3 flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <p className="text-rose-200 text-sm flex-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-rose-200 text-xs font-semibold px-3 py-1 border border-rose-700 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">

          {/* ── STEP: SELECT CANDIDATE ── */}
          {step === 'select' && (
            <div>
              <p className="text-[#7AAED4] text-sm mb-4 leading-relaxed">
                Select your preferred candidate below. Your selection will be reviewed
                before submission to the national distributed ledger.
              </p>

              <div className="space-y-3">
                {election.candidates.map((cand) => {
                  const isSelected = selectedCandidateId === cand.id;
                  return (
                    <div
                      key={cand.id}
                      onClick={() => canSelect && setSelectedCandidateId(cand.id)}
                      className={`p-5 border-2 transition-all flex items-start gap-4 min-h-[90px] ${
                        isSelected
                          ? 'bg-[#FFF8F0] border-[#FF9933] shadow-lg shadow-[#FF9933]/10'
                          : canSelect
                          ? 'bg-[#0A1E40] border-[#1A3A6A] hover:border-[#2A5A9A] cursor-pointer'
                          : 'bg-[#080F1E] border-[#1A3A6A]/50 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <CandidateBadge name={cand.name} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3
                              className={`text-base font-bold leading-tight ${
                                isSelected ? 'text-[#0F2A57]' : 'text-white'
                              }`}
                            >
                              {cand.name}
                            </h3>
                            <span
                              className={`inline-block text-xs font-semibold px-2.5 py-0.5 mt-1.5 border ${
                                isSelected
                                  ? 'bg-[#FF9933]/20 text-[#8B4400] border-[#FF9933]/50'
                                  : 'bg-[#FF9933]/10 text-[#FF9933] border-[#FF9933]/30'
                              }`}
                            >
                              {cand.party}
                            </span>
                          </div>
                          {/* Selection indicator */}
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                              isSelected
                                ? 'border-[#FF9933] bg-[#FF9933]'
                                : 'border-[#2A5A9A] bg-transparent'
                            }`}
                          >
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-white fill-current" />
                            )}
                          </div>
                        </div>
                        <p
                          className={`text-xs mt-2 leading-relaxed line-clamp-2 ${
                            isSelected ? 'text-[#3A4A5A]' : 'text-[#4A7AAA]'
                          }`}
                        >
                          {cand.manifesto}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Not registered notice */}
              {!isWhitelisted && (
                <div className="mt-4 p-4 border border-amber-700/50 bg-amber-900/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-300 font-semibold text-sm">Address Not Registered</p>
                      <p className="text-amber-400/80 text-xs mt-1 leading-relaxed">
                        This voter address has not been added to the electoral roll for this election.
                        Contact the Election Administrator or switch to a registered voter account.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {hasAlreadyVoted && (
                <div className="mt-4 p-4 border border-[#138808]/50 bg-[#138808]/10">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-[#138808] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[#5AE875] font-semibold text-sm">
                        Single-Ballot Restriction Active
                      </p>
                      <p className="text-[#5AE875]/70 text-xs mt-1 leading-relaxed">
                        Your voter address has already submitted a verified ballot for this election.
                        Each registered voter may cast exactly one ballot.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP: CONFIRM & REVIEW ── */}
          {step === 'confirm' && selectedCandidate && (
            <div className="space-y-4">
              <p className="text-[#7AAED4] text-sm leading-relaxed">
                Please review your selection carefully. Once submitted, your ballot is permanently
                recorded on the national distributed ledger and cannot be altered.
              </p>

              {/* Selected candidate review card */}
              <div className="p-5 border-2 border-[#FF9933] bg-[#FFF8F0]">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#8B4400] mb-3">
                  Your Selected Candidate
                </p>
                <div className="flex items-center gap-4">
                  <CandidateBadge name={selectedCandidate.name} />
                  <div>
                    <h3 className="text-xl font-bold text-[#0F2A57]">{selectedCandidate.name}</h3>
                    <p className="text-sm text-[#8B4400] font-medium mt-1">{selectedCandidate.party}</p>
                    <p className="text-xs text-slate-600 mt-2 max-w-sm leading-relaxed">
                      {selectedCandidate.manifesto}
                    </p>
                  </div>
                </div>
              </div>

              {/* Security information panel */}
              <div className="p-4 border border-[#1A3A6A] bg-[#0A1E40]">
                <div className="flex items-center gap-2 mb-2">
                  <Fingerprint className="w-4 h-4 text-[#FF9933]" />
                  <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#FF9933]">
                    Cryptographic Ballot Receipt
                  </span>
                </div>
                <p className="text-xs text-[#4A7AAA] leading-relaxed">
                  Upon confirmation, your ballot is registered on the national distributed ledger
                  and an immutable receipt is generated. You may use this receipt at any time
                  to verify that your vote was correctly recorded.
                </p>
                <div className="mt-2.5 p-2.5 bg-[#060D1A] border border-[#1A3A6A] font-mono text-[11px] text-[#4A90A4] break-all">
                  Election: {election.title} | Voter: {activeAddress.slice(0, 12)}…
                </div>
              </div>
            </div>
          )}

          {/* ── STEP: SUBMITTING ── */}
          {step === 'submitting' && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-[#1A3A6A] border-t-[#FF9933] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="w-7 h-7 text-[#FF9933]" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Recording Ballot…</h3>
                <p className="text-sm text-[#4A7AAA] max-w-sm leading-relaxed">
                  Verifying voter eligibility, committing ballot to the distributed
                  ledger, and generating your cryptographic receipt.
                </p>
              </div>
              <div className="flex gap-1.5 mt-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-[#FF9933] animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── STEP: SUCCESS RECEIPT ── */}
          {step === 'success' && receipt && (
            <div className="space-y-4">
              {/* Success banner */}
              <div className="p-5 border-2 border-[#138808] bg-[#138808]/10 flex items-center gap-4">
                <div className="p-3 rounded-full bg-[#138808]/20 border border-[#138808]/40 flex-shrink-0">
                  <ShieldCheck className="w-7 h-7 text-[#5AE875]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#5AE875]">
                    Ballot Successfully Recorded
                  </h3>
                  <p className="text-sm text-[#4A8A5A] mt-0.5">
                    Your vote for{' '}
                    <strong className="text-[#5AE875]">{receipt.candidateName}</strong>{' '}
                    has been sealed into Block #{receipt.blockNumber} of the national
                    distributed ledger.
                  </p>
                </div>
              </div>

              {/* Receipt box */}
              <div className="border border-[#1A3A6A] bg-[#0A1E40]">
                <div className="px-4 py-3 border-b border-[#1A3A6A] flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#FF9933] flex items-center gap-2">
                    <Fingerprint className="w-3.5 h-3.5" />
                    Cryptographic Ballot Receipt
                  </span>
                  <span className="text-[10px] text-[#5AE875] bg-[#138808]/20 border border-[#138808]/40 px-2 py-0.5 font-semibold">
                    VERIFIED ON LEDGER
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  {/* Receipt hash */}
                  <div className="p-3 bg-[#060D1A] border border-[#1A3A6A] font-mono text-xs text-[#7AAED4] break-all select-all">
                    {receipt.receiptHash}
                  </div>

                  {/* Metadata grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 bg-[#060D1A] border border-[#1A3A6A]">
                      <span className="block text-[9px] font-bold uppercase tracking-widest text-[#4A7AAA] mb-1">
                        Block Number
                      </span>
                      <span className="font-mono text-white font-bold">#{receipt.blockNumber}</span>
                    </div>
                    <div className="p-3 bg-[#060D1A] border border-[#1A3A6A]">
                      <span className="block text-[9px] font-bold uppercase tracking-widest text-[#4A7AAA] mb-1">
                        Timestamp
                      </span>
                      <span className="font-mono text-white font-bold">
                        {new Date(receipt.timestamp * 1000).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {receipt.txHash && (
                    <div className="p-3 bg-[#060D1A] border border-[#1A3A6A] text-xs">
                      <span className="block text-[9px] font-bold uppercase tracking-widest text-[#4A7AAA] mb-1">
                        Distributed Ledger Seal
                      </span>
                      <span className="font-mono text-[#7AAED4] text-[11px] break-all">
                        {receipt.txHash}
                      </span>
                    </div>
                  )}

                  <p className="text-[11px] text-[#4A7AAA] leading-relaxed">
                    Preserve this Cryptographic Ballot Receipt. Paste it into the{' '}
                    <strong className="text-[#7AAED4]">Verify Ballot</strong> portal at any time
                    to confirm your vote remains untampered on the ledger.
                  </p>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleCopyReceipt}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border border-[#1A3A6A] hover:border-[#FF9933] bg-[#060D1A] hover:bg-[#FF9933]/5 text-sm font-semibold text-[#7AAED4] hover:text-[#FF9933] transition-all"
                    >
                      <Copy className="w-4 h-4" />
                      {copied ? 'Copied!' : 'Copy Receipt'}
                    </button>
                    <button
                      onClick={handleDownloadReceipt}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-[#138808]/20 hover:bg-[#138808]/30 border border-[#138808]/50 hover:border-[#138808] text-sm font-semibold text-[#5AE875] transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Download Receipt
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer action bar ── */}
      <div className="bg-[#0A1E40] border-t border-[#1A3A6A] px-4 sm:px-6 py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">

          {step === 'select' && (
            <>
              <button
                onClick={onClose}
                className="px-6 py-4 text-sm font-semibold text-[#4A7AAA] hover:text-white hover:bg-[#1A3A6A] transition-all border border-transparent hover:border-[#1A3A6A]"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('confirm')}
                disabled={
                  !selectedCandidateId ||
                  !isWhitelisted ||
                  hasAlreadyVoted ||
                  isExpired ||
                  isNotStarted ||
                  election.isFinalized
                }
                className="flex items-center gap-3 px-8 py-4 bg-[#FF9933] hover:bg-[#E8870A] text-white text-base font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#FF9933]/20"
              >
                Proceed to Review
                <ArrowRight className="w-5 h-5" />
              </button>
            </>
          )}

          {step === 'confirm' && (
            <>
              <button
                onClick={() => setStep('select')}
                className="flex items-center gap-2 px-6 py-4 text-sm font-semibold text-[#4A7AAA] hover:text-white hover:bg-[#1A3A6A] border border-transparent hover:border-[#1A3A6A] transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleConfirmVote}
                className="flex items-center gap-3 px-8 py-4 bg-[#138808] hover:bg-[#0F6606] text-white text-base font-bold transition-all shadow-lg shadow-[#138808]/20"
              >
                <Lock className="w-5 h-5" />
                Cast Official Ballot
              </button>
            </>
          )}

          {step === 'success' && (
            <button
              onClick={onClose}
              className="w-full py-4 bg-[#0F2A57] hover:bg-[#1A3F7A] border-2 border-[#FF9933] text-[#FF9933] text-base font-bold transition-all"
            >
              Complete — Return to Elections
            </button>
          )}
        </div>
      </div>

      {/* ── India tricolor bottom accent bar ── */}
      <div className="flex h-1 w-full flex-shrink-0">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>
    </div>
  );
}
