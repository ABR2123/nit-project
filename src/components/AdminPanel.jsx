import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { 
  PlusCircle, 
  Users, 
  Calendar, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles,
  Award,
  Vote,
  UserPlus
} from 'lucide-react';

export default function AdminPanel({ onElectionCreated }) {
  const { 
    createElection, 
    registerVoters, 
    elections, 
    testAccounts, 
    activeAddress, 
    activeRole 
  } = useWeb3();

  const [activeAdminTab, setActiveAdminTab] = useState('create'); // 'create' | 'whitelist'
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // CREATE ELECTION FORM STATE
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState('3');
  const [candidates, setCandidates] = useState([
    {
      name: 'Dr. Evelyn Reed',
      party: 'Zero-Knowledge Cryptography Collective',
      manifesto: 'Promoting verifiable private compute and trustless cryptographic audit schemes for decentralized DAOs.',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200'
    },
    {
      name: 'David Thorne',
      party: 'Decentralized Consensus Institute',
      manifesto: 'Hardening consensus against 51% collusions and enhancing proof-of-stake validator decentralization.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'
    }
  ]);

  // WHITELIST VOTER STATE
  const [selectedElectionId, setSelectedElectionId] = useState(elections[0]?.id || 1);
  const [voterAddressesInput, setVoterAddressesInput] = useState('');

  const handleAddCandidate = () => {
    setCandidates([
      ...candidates,
      {
        name: '',
        party: '',
        manifesto: '',
        avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?w=200`
      }
    ]);
  };

  const handleRemoveCandidate = (index) => {
    if (candidates.length <= 2) {
      alert('An election requires at least 2 candidates');
      return;
    }
    setCandidates(candidates.filter((_, i) => i !== index));
  };

  const handleCandidateChange = (index, field, value) => {
    const updated = [...candidates];
    updated[index][field] = value;
    setCandidates(updated);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!title.trim()) {
      setErrorMsg('Please enter an election title');
      return;
    }

    for (let i = 0; i < candidates.length; i++) {
      if (!candidates[i].name.trim()) {
        setErrorMsg(`Candidate #${i + 1} must have a name`);
        return;
      }
    }

    setLoading(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      const startTime = now - 60; // Start immediately
      const endTime = now + (Number(durationDays) * 86400);

      const newId = await createElection({
        title,
        description,
        startTime,
        endTime,
        candidates
      });

      setSuccessMsg(`Election #${newId} ("${title}") successfully created and deployed on-chain!`);
      setTitle('');
      setDescription('');
      if (onElectionCreated) onElectionCreated(newId);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create election');
    } finally {
      setLoading(false);
    }
  };

  const handleWhitelistSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const lines = voterAddressesInput
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setErrorMsg('Please enter at least one Ethereum wallet address');
      return;
    }

    setLoading(true);
    try {
      const added = await registerVoters(selectedElectionId, lines);
      setSuccessMsg(`Successfully registered ${added} voter address(es) to Election #${selectedElectionId} whitelist!`);
      setVoterAddressesInput('');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to register voters');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoWhitelistTestAccounts = async () => {
    const addresses = testAccounts.map(a => a.address);
    setLoading(true);
    try {
      const added = await registerVoters(selectedElectionId, addresses);
      setSuccessMsg(`All test sandbox accounts whitelisted for Election #${selectedElectionId}!`);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <PlusCircle className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Election Commissioner Studio
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deploy decentralized elections, configure candidates, and manage voter eligibility registries.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Admin Access Active</span>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 w-fit">
        <button
          onClick={() => {
            setActiveAdminTab('create');
            setErrorMsg('');
            setSuccessMsg('');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeAdminTab === 'create'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Vote className="w-4 h-4" />
          Create New Election
        </button>
        <button
          onClick={() => {
            setActiveAdminTab('whitelist');
            setErrorMsg('');
            setSuccessMsg('');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeAdminTab === 'whitelist'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Voter Whitelist Registry
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* CREATE ELECTION TAB */}
      {activeAdminTab === 'create' && (
        <form onSubmit={handleCreateSubmit} className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Vote className="w-4 h-4 text-cyan-400" />
              Election Parameters
            </h2>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Election Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Global Ethereum Foundation Governance Board 2026"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Description & Purpose
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail the election scope, voting rules, and governance mandate..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Voting Duration
              </label>
              <div className="flex items-center gap-2">
                {[
                  { label: '1 Day', val: '1' },
                  { label: '3 Days', val: '3' },
                  { label: '7 Days', val: '7' },
                  { label: '14 Days', val: '14' }
                ].map(item => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setDurationDays(item.val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      durationDays === item.val
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Candidates Builder */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Candidates ({candidates.length})
              </h2>
              <button
                type="button"
                onClick={handleAddCandidate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 text-xs font-semibold border border-slate-700 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add Candidate
              </button>
            </div>

            <div className="space-y-3">
              {candidates.map((cand, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                      Candidate #{idx + 1}
                    </span>
                    {candidates.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCandidate(idx)}
                        className="text-slate-500 hover:text-rose-400 text-xs p-1"
                        title="Remove candidate"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Candidate Full Name *"
                      required
                      value={cand.name}
                      onChange={(e) => handleCandidateChange(idx, 'name', e.target.value)}
                      className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-cyan-500"
                    />
                    <input
                      type="text"
                      placeholder="Party or Organization"
                      value={cand.party}
                      onChange={(e) => handleCandidateChange(idx, 'party', e.target.value)}
                      className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-cyan-500"
                    />
                  </div>

                  <textarea
                    rows={2}
                    placeholder="Candidate manifesto, vision, or policy goals..."
                    value={cand.manifesto}
                    onChange={(e) => handleCandidateChange(idx, 'manifesto', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-cyan-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Mining Election onto Blockchain...' : 'Deploy Election to Smart Contract'}
            </button>
          </div>
        </form>
      )}

      {/* WHITELIST REGISTRY TAB */}
      {activeAdminTab === 'whitelist' && (
        <form onSubmit={handleWhitelistSubmit} className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-cyan-400" />
              Sybil Defense: Register Eligible Voter Addresses
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              To prevent Sybil attacks and automated spam voting, only addresses registered in the election whitelist can cast ballots. Each registered address is strictly restricted to one vote.
            </p>

            {/* Select Target Election */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Election
              </label>
              <select
                value={selectedElectionId}
                onChange={(e) => setSelectedElectionId(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none"
              >
                {elections.map(e => (
                  <option key={e.id} value={e.id}>
                    Election #{e.id}: {e.title} ({e.isFinalized ? 'Closed' : 'Active'})
                  </option>
                ))}
              </select>
            </div>

            {/* Input Addresses */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Voter Ethereum Addresses (one per line or comma-separated)
                </label>
                <button
                  type="button"
                  onClick={handleAutoWhitelistTestAccounts}
                  disabled={loading}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  + Whitelist All Sandbox Test Accounts
                </button>
              </div>
              <textarea
                rows={5}
                value={voterAddressesInput}
                onChange={(e) => setVoterAddressesInput(e.target.value)}
                placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8&#10;0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC&#10;0x90F79bf6EB2c4f870365E785982E1f101E93b906"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Recording Whitelist on Blockchain...' : 'Commit Whitelist to Smart Contract'}
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
