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
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <PlusCircle className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Electoral Commission Studio
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Deploy official elections to smart contracts, configure candidate slates, and manage voter whitelist authorization.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Admin Access Active</span>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="flex items-center p-1 rounded-lg bg-slate-100 border border-slate-200 w-fit">
        <button
          onClick={() => {
            setActiveAdminTab('create');
            setErrorMsg('');
            setSuccessMsg('');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-all ${
            activeAdminTab === 'create'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
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
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-all ${
            activeAdminTab === 'whitelist'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Voter Whitelist Registry
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* CREATE ELECTION TAB */}
      {activeAdminTab === 'create' && (
        <form onSubmit={handleCreateSubmit} className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Vote className="w-4 h-4 text-blue-600" />
              Election Parameters
            </h2>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Election Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., University Governance Council Election 2026"
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Description & Scope
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the election mandate, participation guidelines, and voting criteria..."
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none shadow-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
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
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Candidates Builder */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Candidates ({candidates.length})
              </h2>
              <button
                type="button"
                onClick={handleAddCandidate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-blue-700 text-xs font-semibold border border-slate-200 transition-all shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add Candidate
              </button>
            </div>

            <div className="space-y-3">
              {candidates.map((cand, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                      Candidate #{idx + 1}
                    </span>
                    {candidates.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCandidate(idx)}
                        className="text-slate-400 hover:text-rose-600 text-xs p-1"
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
                      className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 outline-none focus:border-blue-600"
                    />
                    <input
                      type="text"
                      placeholder="Party / Affiliation"
                      value={cand.party}
                      onChange={(e) => handleCandidateChange(idx, 'party', e.target.value)}
                      className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 outline-none focus:border-blue-600"
                    />
                  </div>

                  <textarea
                    rows={2}
                    placeholder="Candidate statement, vision, or policy goals..."
                    value={cand.manifesto}
                    onChange={(e) => handleCandidateChange(idx, 'manifesto', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50"
            >
              {loading ? 'Recording Election on Blockchain...' : 'Deploy Election to Smart Contract'}
            </button>
          </div>
        </form>
      )}

      {/* WHITELIST REGISTRY TAB */}
      {activeAdminTab === 'whitelist' && (
        <form onSubmit={handleWhitelistSubmit} className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-600" />
              Voter Eligibility Registry
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              To enforce authentic participation and prevent duplicate or automated voting, only addresses registered in the election whitelist can cast ballots. Each registered address can only vote once.
            </p>

            {/* Select Target Election */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Select Election
              </label>
              <select
                value={selectedElectionId}
                onChange={(e) => setSelectedElectionId(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none shadow-xs"
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
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Voter Ethereum Addresses (one per line or comma-separated)
                </label>
                <button
                  type="button"
                  onClick={handleAutoWhitelistTestAccounts}
                  disabled={loading}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                >
                  + Whitelist All Sandbox Accounts
                </button>
              </div>
              <textarea
                rows={5}
                value={voterAddressesInput}
                onChange={(e) => setVoterAddressesInput(e.target.value)}
                placeholder="0x70997970C51812dc3A010C7d01b50e0d17dc79C8&#10;0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC&#10;0x90F79bf6EB2c4f870365E785982E1f101E93b906"
                className="w-full px-4 py-3 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono text-xs focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none shadow-xs"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50"
            >
              {loading ? 'Recording Whitelist on Blockchain...' : 'Commit Whitelist to Smart Contract'}
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
