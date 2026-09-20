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
MUDRA WEB3 ARCHITECTURE DECENTRALIZED E-VOTING PROTOCOL
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
Paste the receipt hash into the Mudra Web3 Architecture "Verify Receipt" portal
or inspect directly on-chain via smart contract method:
verifyReceipt(${receipt.electionId}, "${receipt.receiptHash}")

STATUS: VALID & RECORDED IMMUTABLY ON LEDGER
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MudraWeb3-Receipt-Election-${receipt.electionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedCandidate = election.candidates.find(c => c.id === selectedCandidateId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Official Ballot Booth</h2>
              <p className="text-xs text-slate-500 truncate max-w-md">{election.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voter status alert bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Voter Key:</span>
            <span className="font-mono text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
              {activeAddress.slice(0, 10)}...{activeAddress.slice(-6)}
            </span>
          </div>
          <div>
            {!isWhitelisted ? (
              <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                Not Registered
              </span>
            ) : hasAlreadyVoted ? (
              <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ballot Already Cast
              </span>
            ) : isExpired ? (
              <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-medium">
                <Clock className="w-3.5 h-3.5" />
                Election Closed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Eligible to Vote
              </span>
            )}
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: SELECT CANDIDATE */}
          {step === 'select' && (
            <div>
              <p className="text-xs text-slate-500 mb-3">
                Select your preferred candidate or choice below. Once submitted, your ballot is cryptographically confirmed and recorded on-chain.
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
                          ? 'bg-blue-50/60 border-blue-600 ring-1 ring-blue-600 shadow-xs'
                          : canSelect
                          ? 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                          : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <img
                          src={cand.avatarUrl}
                          alt={cand.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-bold text-slate-900">{cand.name}</h3>
                              <span className="inline-block text-[11px] font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded mt-1">
                                {cand.party}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}>
                                {isSelected && <CheckCircle2 className="w-4 h-4 text-white fill-current" />}
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                            {cand.manifesto}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!isWhitelisted && (
                <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <p className="font-semibold">Address Not Whitelisted</p>
                    <p className="text-amber-700 mt-0.5">
                      This address has not been added to the election whitelist. To test voting, switch your account to "Elena Rostova" or "Marcus Chen" in the top bar, or add this address in the Admin Studio.
                    </p>
                  </div>
                </div>
              )}

              {hasAlreadyVoted && (
                <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-start gap-2.5">
                  <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
                  <div>
                    <p className="font-semibold">Single-Vote Restriction Active</p>
                    <p className="text-blue-700 mt-0.5">
                      Your address has already submitted a verified vote for this election. Each eligible voter can only cast one ballot.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: CONFIRM & REVIEW CRYPTOGRAPHY */}
          {step === 'confirm' && selectedCandidate && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Your Selected Candidate</p>
                <div className="flex items-center gap-3 mt-3">
                  <img src={selectedCandidate.avatarUrl} alt={selectedCandidate.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{selectedCandidate.name}</h3>
                    <p className="text-xs text-slate-500">{selectedCandidate.party}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2.5">
                <div className="flex items-center gap-2 text-blue-900 text-xs font-semibold uppercase tracking-wider">
                  <Fingerprint className="w-4 h-4 text-blue-600" />
                  <span>Cryptographic Receipt Generation</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Upon confirmation, the smart contract registers your vote and computes an immutable Keccak-256 receipt hash. You can use this receipt hash at any time to verify that your ballot was properly counted in the final ledger.
                </p>
                <div className="p-2.5 rounded-lg bg-white font-mono text-[11px] text-slate-600 border border-slate-200 break-all">
                  Target: {election.title} | Voter: {activeAddress}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SUBMITTING / MINING BLOCK */}
          {step === 'submitting' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Recording Ballot on Blockchain...</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Validating voter eligibility, executing smart contract, and generating tamper-proof cryptographic receipt.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS RECEIPT */}
          {step === 'success' && receipt && (
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                <div className="p-2 rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-800">Ballot Successfully Recorded</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Your vote for <strong className="text-slate-900">{receipt.candidateName}</strong> was sealed into Block #{receipt.blockNumber}.
                  </p>
                </div>
              </div>

              {/* Receipt Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Fingerprint className="w-4 h-4 text-blue-600" />
                    Cryptographic Ballot Receipt
                  </span>
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium">Verified On-Chain</span>
                </div>

                <div className="p-3 rounded-lg bg-white border border-slate-200 font-mono text-xs text-slate-800 break-all selection:bg-blue-100">
                  {receipt.receiptHash}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded bg-white border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Block Number</span>
                    <span className="font-mono text-slate-800 font-semibold">#{receipt.blockNumber}</span>
                  </div>
                  <div className="p-2.5 rounded bg-white border border-slate-200">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Timestamp</span>
                    <span className="font-mono text-slate-800 font-semibold">{new Date(receipt.timestamp * 1000).toLocaleTimeString()}</span>
                  </div>
                </div>

                {receipt.txHash && (
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs">
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Transaction Hash</span>
                    <span className="font-mono text-slate-700 text-[11px] break-all">{receipt.txHash}</span>
                  </div>
                )}

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Keep this cryptographic receipt. You can paste it into the <strong>Verify Receipt</strong> page at any time to independently confirm that your vote remains untampered on the ledger.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={handleCopyReceipt}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all border border-slate-200 shadow-xs"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    {copied ? 'Copied to Clipboard!' : 'Copy Hash Receipt'}
                  </button>

                  <button
                    onClick={handleDownloadReceipt}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-all border border-blue-200 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    Download Receipt (.txt)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          {step === 'select' && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('confirm')}
                disabled={!selectedCandidateId || !isWhitelisted || hasAlreadyVoted || isExpired || isNotStarted || election.isFinalized}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Review Selection
                <Lock className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {step === 'confirm' && (
            <>
              <button
                onClick={() => setStep('select')}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleConfirmVote}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-all"
              >
                Sign & Cast Ballot
                <Vote className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {step === 'success' && (
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all"
            >
              Done
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
