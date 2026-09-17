import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { 
  X, 
  Vote, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Copy, 
  ExternalLink, 
  Download, 
  Fingerprint, 
  ShieldCheck,
  Clock,
  Sparkles,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';

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

  const handleConfirmVote = async () => {
    if (!selectedCandidateId) return;
    setError(null);
    setStep('submitting');

    try {
      const generatedReceipt = await castVote(election.id, selectedCandidateId);
      setReceipt(generatedReceipt);
      setStep('success');
      
      // Celebrate successful decentralized vote casting
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      if (onReceiptReady) {
        onReceiptReady(generatedReceipt);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to submit vote to blockchain');
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
AEGISVOTE DECENTRALIZED E-VOTING PROTOCOL
CRYPTOGRAPHIC BALLOT RECEIPT
=====================================================
Election ID: #${receipt.electionId}
Election Title: ${receipt.electionTitle}
Voter Address: ${receipt.voter}
Selected Candidate: ${receipt.candidateName}
Timestamp: ${new Date(receipt.timestamp * 1000).toUTCString()}

BLOCKCHAIN AUDIT PROOF:
Block Number: #${receipt.blockNumber}
Transaction Hash: ${receipt.txHash}
Receipt Hash (SHA-256 / Keccak-256):
${receipt.receiptHash}

VERIFICATION INSTRUCTIONS:
Paste the receipt hash into the AegisVote "Verify Receipt" portal
or inspect directly on-chain via smart contract method:
verifyReceipt(${receipt.electionId}, "${receipt.receiptHash}")

STATUS: VALID & RECORDED IMMUTABLY ON LEDGER
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AegisVote-Receipt-Election-${receipt.electionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedCandidate = election.candidates.find(c => c.id === selectedCandidateId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Decentralized Ballot Booth</h2>
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

        {/* Voter status alert bar */}
        <div className="px-5 py-2.5 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Voter Key:</span>
            <span className="font-mono text-cyan-400 font-medium">
              {activeAddress.slice(0, 10)}...{activeAddress.slice(-6)}
            </span>
          </div>
          <div>
            {!isWhitelisted ? (
              <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                Not Registered
              </span>
            ) : hasAlreadyVoted ? (
              <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ballot Already Cast
              </span>
            ) : isExpired ? (
              <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md font-medium">
                <Clock className="w-3.5 h-3.5" />
                Election Closed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Eligible to Vote
              </span>
            )}
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: SELECT CANDIDATE */}
          {step === 'select' && (
            <div>
              <p className="text-xs text-slate-400 mb-3">
                Select your chosen candidate or proposal option below. Once submitted, your vote is sealed into an immutable block and cannot be altered or deleted.
              </p>

              <div className="space-y-3">
                {election.candidates.map((cand) => {
                  const isSelected = selectedCandidateId === cand.id;
                  const canSelect = isWhitelisted && !hasAlreadyVoted && !isExpired && !isNotStarted && !election.isFinalized;

                  return (
                    <div
                      key={cand.id}
                      onClick={() => canSelect && setSelectedCandidateId(cand.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500/50 shadow-lg shadow-cyan-950/40'
                          : canSelect
                          ? 'bg-slate-800/40 border-slate-700/70 hover:border-slate-600 hover:bg-slate-800/70'
                          : 'bg-slate-900/30 border-slate-800 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <img
                          src={cand.avatarUrl}
                          alt={cand.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-bold text-white">{cand.name}</h3>
                              <span className="inline-block text-[11px] font-medium text-cyan-400 bg-cyan-500/10 px-2 py-0.2 rounded mt-0.5">
                                {cand.party}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'border-cyan-400 bg-cyan-500 text-slate-950'
                                  : 'border-slate-600 bg-slate-900'
                              }`}>
                                {isSelected && <CheckCircle2 className="w-4 h-4 text-slate-950 fill-current" />}
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                            {cand.manifesto}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!isWhitelisted && (
                <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Voter Not Registered</p>
                    <p className="text-amber-300/80 mt-0.5">
                      This address has not been added to the election whitelist. To test voting, switch your account to "Elena Rostova" or "Marcus Chen" in the top bar, or add this address in Admin Studio!
                    </p>
                  </div>
                </div>
              )}

              {hasAlreadyVoted && (
                <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2.5">
                  <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">One-Person-One-Vote Rule Active</p>
                    <p className="text-blue-300/80 mt-0.5">
                      Your address has already submitted a verified vote for this election. Each eligible address can only vote once.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: CONFIRM & REVIEW CRYPTOGRAPHY */}
          {step === 'confirm' && selectedCandidate && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Your Selected Candidate</p>
                <div className="flex items-center gap-3 mt-3">
                  <img src={selectedCandidate.avatarUrl} alt={selectedCandidate.name} className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedCandidate.name}</h3>
                    <p className="text-xs text-cyan-400">{selectedCandidate.party}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2.5">
                <div className="flex items-center gap-2 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
                  <Fingerprint className="w-4 h-4" />
                  <span>Cryptographic Proof Guarantee</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Upon confirmation, the smart contract executes a Keccak-256 cryptographic commitment hash. Your ballot is counted towards the tally, and you receive an immutable hash receipt that proves your vote was tallied without disclosing your identity to public observers.
                </p>
                <div className="p-2.5 rounded-lg bg-slate-900/90 font-mono text-[11px] text-slate-400 border border-slate-800 break-all">
                  Target: {election.title} | Voter: {activeAddress}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SUBMITTING / MINING BLOCK */}
          {step === 'submitting' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Broadcasting Ballot to Blockchain...</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Generating cryptographic receipt, validating zero-knowledge commitment, and mining into distributed ledger block.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS RECEIPT */}
          {step === 'success' && receipt && (
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-400">Vote Successfully Recorded on Ledger</h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Your vote for <strong className="text-white">{receipt.candidateName}</strong> is sealed into Block #{receipt.blockNumber}.
                  </p>
                </div>
              </div>

              {/* Receipt Box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Fingerprint className="w-4 h-4 text-cyan-400" />
                    Cryptographic Ballot Receipt
                  </span>
                  <span className="text-[11px] text-emerald-400 font-medium">Verified On-Chain</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 break-all selection:bg-cyan-500/40">
                  {receipt.receiptHash}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">Block Number</span>
                    <span className="font-mono text-slate-200">#{receipt.blockNumber}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">Timestamp</span>
                    <span className="font-mono text-slate-200">{new Date(receipt.timestamp * 1000).toLocaleTimeString()}</span>
                  </div>
                </div>

                {receipt.txHash && (
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Transaction Hash</span>
                    <span className="font-mono text-cyan-400 text-[11px] break-all">{receipt.txHash}</span>
                  </div>
                )}

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Keep this cryptographic receipt hash. You can paste it into the <strong>Verify Receipt</strong> portal at any time to verify that your ballot has not been altered.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={handleCopyReceipt}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all border border-slate-700"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? 'Copied to Clipboard!' : 'Copy Hash Receipt'}
                  </button>

                  <button
                    onClick={handleDownloadReceipt}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold transition-all border border-cyan-500/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Receipt (.txt)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3">
          {step === 'select' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('confirm')}
                disabled={!selectedCandidateId || !isWhitelisted || hasAlreadyVoted || isExpired || isNotStarted || election.isFinalized}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue to Review
                <Lock className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {step === 'confirm' && (
            <>
              <button
                onClick={() => setStep('select')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all"
              >
                Back
              </button>
              <button
                onClick={handleConfirmVote}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
              >
                Sign & Cast Ballot
                <Vote className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {step === 'success' && (
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
            >
              Done
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
