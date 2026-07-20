'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import PredictionCard from '../../../components/PredictionCard';
import AISuggestion from '../../../components/AISuggestion';
import { generateStudentPdfReport } from '../../../utils/generatePdf';
import {
  UserPlus, Trash2, Activity, RefreshCw, ChevronDown, ChevronUp,
  Plus, Brain, Loader2, Calculator, Users, Sparkles, AlertTriangle,
  FileText, Download,
} from 'lucide-react';

export default function ChildrenPage() {
  // ── State ────────────────────────────────────────────────────────────
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [animatedResult, setAnimatedResult] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Add child form
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newGender, setNewGender] = useState('');
  const [adding, setAdding] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Prediction form
  const [habitForm, setHabitForm] = useState({
    sleepDuration: '', dailySteps: '', dietQuality: '',
  });

  // ── Fetch ────────────────────────────────────────────────────────────
  const fetchChildren = useCallback(async () => {
    try { setLoading(true); const { data } = await axios.get('/api/children'); setChildren(data.children); } catch { toast.error('Failed to load students'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchChildren(); }, [fetchChildren]);

  // ── Add child ────────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) { toast.error('Name is required'); return; }
    setAdding(true);
    try {
      const { data } = await axios.post('/api/children', { name: newName.trim(), age: newAge ? Number(newAge) : null, gender: newGender || null });
      toast.success(data.message);
      setShowAddModal(false); setNewName(''); setNewAge(''); setNewGender('');
      fetchChildren();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); } finally { setAdding(false); }
  };

  // ── Delete ───────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/children/${deleteTarget.id}`);
      toast.success(`${deleteTarget.name} deleted successfully`);
      fetchChildren();
      if (selectedChild?._id === deleteTarget.id) resetSelection();
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  // ── Select ───────────────────────────────────────────────────────────
  const handleSelect = (child) => {
    setSelectedChild(child); setShowForm(true);
    setHabitForm({ sleepDuration: '', dailySteps: '', dietQuality: '' });
    setPrediction(null); setAiSuggestion(null); setShowResult(false); setAnimatedResult(false);
  };

  const resetSelection = () => {
    setSelectedChild(null); setShowForm(false); setPrediction(null); setAiSuggestion(null); setShowResult(false); setAnimatedResult(false);
  };

  // ── Predict ──────────────────────────────────────────────────────────
  const handlePredict = async (e) => {
    e.preventDefault();
    if (!selectedChild) return;
    setPredicting(true); setPrediction(null); setAiSuggestion(null); setShowResult(false); setAnimatedResult(false);
    try {
      const { data } = await axios.post('/api/predict', {
        childId: selectedChild._id,
        sleepDuration: Number(habitForm.sleepDuration),
        dailySteps: Number(habitForm.dailySteps),
        dietQuality: habitForm.dietQuality,
      }, { timeout: 30000 });
      setPrediction({ ...data.prediction, inputSummary: { sleep: Number(habitForm.sleepDuration), steps: Number(habitForm.dailySteps), diet: habitForm.dietQuality } });
      setAiSuggestion(data.aiSuggestion);
      setShowResult(true);
      setTimeout(() => setAnimatedResult(true), 100);
      toast.success('Prediction complete!');
      fetchChildren();
    } catch (err) { toast.error(err.response?.data?.message || 'Prediction failed'); } finally { setPredicting(false); }
  };

  // ── Download PDF Report ──────────────────────────────────────────────
  const handleExportPdf = async () => {
    if (!selectedChild || !prediction) return;
    setDownloadingPdf(true);
    try {
      await generateStudentPdfReport({
        student: selectedChild,
        prediction,
        aiSuggestion,
        habitData: habitForm,
      });
      toast.success('PDF Health Report downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF Report');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────
  const statusConfig = (p) => {
    if (p === 'Fit') return { dot: 'bg-green-500 shadow-lg shadow-green-500/30', badge: 'bg-gradient-to-r from-green-500 to-emerald-500', label: 'Fit', ring: 'ring-green-200' };
    if (p === 'Unhealthy') return { dot: 'bg-amber-500 shadow-lg shadow-amber-500/30', badge: 'bg-gradient-to-r from-amber-500 to-orange-500', label: 'Unhealthy', ring: 'ring-amber-200' };
    if (p) return { dot: 'bg-red-500 shadow-lg shadow-red-500/30 animate-pulse-soft', badge: 'bg-gradient-to-r from-red-500 to-rose-500', label: 'At-Risk', ring: 'ring-red-200' };
    return { dot: 'bg-gray-300', badge: 'bg-gray-200 text-gray-500', label: 'No data', ring: 'ring-gray-100' };
  };

  const inputClass = 'w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm text-sm outline-none transition-all duration-200 focus:border-indigo-500 focus:shadow-lg focus:shadow-indigo-500/10 hover:border-gray-300';

  return (
    <div>
      {/* Gradient Header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-6 lg:px-8 py-8 lg:py-12">
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-10" />
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
              <Users className="w-4 h-4" />
              <span>Management</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white mb-2">Students List</h1>
            <p className="text-white/70 text-sm lg:text-base">Manage students and run health predictions</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchChildren} disabled={loading}
              className="p-3 rounded-xl bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 transition-all border border-white/10">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-indigo-600 font-semibold text-sm hover:shadow-xl hover:shadow-black/10 active:scale-[0.98] transition-all">
              <UserPlus className="w-4 h-4" /> Add Student
            </button>
          </div>
        </div>
      </header>

      <div className="p-6 lg:p-8 -mt-6 relative z-20">
        <div className="grid lg:grid-cols-5 gap-6">
          {/* ── LEFT: Students List ──────────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl overflow-hidden shadow-lg">
              <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/80">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <ChildIcon className="w-4 h-4 text-indigo-500" />
                  Your Students
                </h2>
                <p className="text-xs text-gray-400 mt-0.5 ml-6">Click a student to predict</p>
              </div>
              <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="p-10 text-center"><div className="w-8 h-8 mx-auto border-3 border-indigo-300 border-t-indigo-500 rounded-full animate-spin" /></div>
                ) : children.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Users className="w-7 h-7 text-gray-400" />
                    </div>
                    <p className="font-semibold text-gray-600">No students added</p>
                    <p className="text-sm text-gray-400 mt-1">Click &quot;Add Student&quot; to get started</p>
                  </div>
                ) : (
                  children.map((child, idx) => {
                    const sc = statusConfig(child.currentPrediction);
                    return (
                      <div key={child._id} onClick={() => handleSelect(child)} role="button" tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect(child); }}
                        className={`w-full px-5 py-4 text-left flex items-center justify-between transition-all duration-200 group cursor-pointer
                          ${selectedChild?._id === child._id
                            ? 'bg-gradient-to-r from-indigo-50 to-purple-50/50 border-l-4 border-l-indigo-500'
                            : 'hover:bg-gray-50/80 border-l-4 border-l-transparent'}
                          animate-fade-in-up`}
                        style={{ animationDelay: `${idx * 0.04}s` }}>
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar */}
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-base font-extrabold flex-shrink-0
                            transition-all duration-300 group-hover:scale-105
                            ${child.currentPrediction === 'Fit' ? 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-700' :
                              child.currentPrediction === 'Unhealthy' ? 'bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700' :
                              child.currentPrediction ? 'bg-gradient-to-br from-red-100 to-rose-100 text-red-700' :
                              'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400'}`}>
                            {child.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate flex items-center gap-1.5">
                              {child.name}
                              <span className={`inline-block w-2 h-2 rounded-full ${sc.dot}`} />
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {child.age ? `Age ${child.age}${child.gender ? ` · ${child.gender}` : ''}` : ''}
                              {child.currentPrediction ? ` · ${child.currentPrediction}` : ' · No prediction'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {child.predictionCount > 0 && (
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full text-white ${sc.badge} shadow-sm`}>
                              {child.predictionCount}
                            </span>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: child._id, name: child.name }); }}
                            className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                            title="Delete student">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Prediction Area ───────────────────────────────── */}
          <div className="lg:col-span-3 space-y-6">
            {!selectedChild ? (
              <div className="glass rounded-2xl p-12 lg:p-16 text-center shadow-lg animate-fade-in-up">
                <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <Calculator className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-extrabold text-gray-900 mb-3">Select a Student</h3>
                <p className="text-gray-500 max-w-sm mx-auto">Click on a student from the list to view their details and run a health prediction</p>
              </div>
            ) : (
              <>
                {/* Selected child header */}
                <div className="glass rounded-2xl p-5 lg:p-6 shadow-lg animate-fade-in-up flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-extrabold shadow-lg
                      ${selectedChild.currentPrediction === 'Fit' ? 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-700 ring-2 ring-green-200' :
                        selectedChild.currentPrediction === 'Unhealthy' ? 'bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700 ring-2 ring-amber-200' :
                        selectedChild.currentPrediction ? 'bg-gradient-to-br from-red-100 to-rose-100 text-red-700 ring-2 ring-red-200' :
                        'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 ring-2 ring-gray-200'}`}>
                      {selectedChild.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-gray-900">{selectedChild.name}</h2>
                      <p className="text-sm text-gray-500">
                        {selectedChild.age ? `Age ${selectedChild.age}${selectedChild.gender ? ` · ${selectedChild.gender}` : ''}` : ''}
                        {selectedChild.currentPrediction ? (
                          <span className="inline-flex items-center gap-1.5 ml-2">
                            · Latest:
                            <span className={`font-semibold ${selectedChild.currentPrediction === 'Fit' ? 'text-green-600' : selectedChild.currentPrediction === 'Unhealthy' ? 'text-amber-600' : 'text-red-600'}`}>
                              {selectedChild.currentPrediction}
                            </span>
                          </span>
                        ) : ' · No predictions yet'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowForm(!showForm)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl transition-all text-sm font-bold shadow-md
                      ${showForm ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.98]'}`}>
                    {showForm ? <><ChevronUp className="w-4 h-4" /> Hide Form</> : <><ChevronDown className="w-4 h-4" /> New Prediction</>}
                  </button>
                </div>

                {/* Prediction Form */}
                {showForm && (
                  <form onSubmit={handlePredict}
                    className="glass rounded-2xl p-6 lg:p-8 shadow-lg animate-scale-in border border-indigo-100/50">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                        <Activity className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-gray-900 text-lg">Student Habit Data</h3>
                        <p className="text-gray-400 text-xs">Enter {selectedChild.name}&apos;s latest health habits</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
                          <Moon className="w-3.5 h-3.5 text-indigo-500" /> Sleep Duration
                        </label>
                        <div className="relative">
                          <input type="number" min={0} max={24} step={0.5} value={habitForm.sleepDuration}
                            onChange={(e) => setHabitForm({ ...habitForm, sleepDuration: e.target.value })}
                            placeholder="e.g. 8" required
                            className={`${inputClass} pr-12`} />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">hours</span>
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
                          <Footprints className="w-3.5 h-3.5 text-indigo-500" /> Daily Steps
                        </label>
                        <div className="relative">
                          <input type="number" min={0} max={100000} value={habitForm.dailySteps}
                            onChange={(e) => setHabitForm({ ...habitForm, dailySteps: e.target.value })}
                            placeholder="e.g. 8000" required
                            className={`${inputClass} pr-14`} />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">steps</span>
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
                          <Apple className="w-3.5 h-3.5 text-indigo-500" /> Diet Quality
                        </label>
                        <select value={habitForm.dietQuality}
                          onChange={(e) => setHabitForm({ ...habitForm, dietQuality: e.target.value })}
                          className={inputClass} required>
                          <option value="">Select diet quality...</option>
                          <option value="Good" className="text-green-600">Good</option>
                          <option value="Average" className="text-amber-600">Average</option>
                          <option value="Poor" className="text-red-600">Poor</option>
                        </select>
                      </div>
                    </div>

                    <button type="submit" disabled={predicting}
                      className="group relative mt-8 w-full py-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-extrabold text-sm
                        shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.005] active:scale-[0.99] transition-all disabled:opacity-50 disabled:hover:scale-100 overflow-hidden">
                      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                      {predicting ? (
                        <span className="flex items-center justify-center gap-2.5 relative z-10">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="tracking-wide">Analyzing health data...</span>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2.5 relative z-10">
                          <Brain className="w-5 h-5" />
                          <span className="tracking-wide">Calculate Prediction</span>
                          <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse-soft" />
                        </span>
                      )}
                    </button>
                  </form>
                )}

                {/* Results */}
                {showResult && (
                  <div className={`space-y-5 transition-all duration-500 ${animatedResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="flex justify-end">
                      <button onClick={handleExportPdf} disabled={downloadingPdf}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50">
                        {downloadingPdf ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating PDF...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4" />
                            Download PDF Report
                            <Download className="w-3.5 h-3.5 opacity-80 ml-0.5" />
                          </>
                        )}
                      </button>
                    </div>
                    <PredictionCard prediction={prediction} />
                    <AISuggestion suggestion={aiSuggestion} />
                  </div>
                )}
                {predicting && (
                  <div className="space-y-5">
                    <PredictionCard loading />
                    <AISuggestion loading />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Add Child Modal ──────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-md glass rounded-3xl shadow-2xl p-8 lg:p-10 animate-scale-in">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Add New Student</h2>
                <p className="text-xs text-gray-400">Enter student&apos;s details</p>
              </div>
            </div>
            <form onSubmit={handleAdd} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Student&apos;s Name</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder="Full name" required
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm text-sm outline-none transition-all focus:border-indigo-500 focus:shadow-lg focus:shadow-indigo-500/10" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Age (optional)</label>
                <input type="number" min={3} max={25} value={newAge} onChange={(e) => setNewAge(e.target.value)}
                  placeholder="Enter age"
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm text-sm outline-none transition-all focus:border-indigo-500 focus:shadow-lg" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Gender (optional)</label>
                <select value={newGender} onChange={(e) => setNewGender(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 bg-white/80 backdrop-blur-sm text-sm outline-none transition-all focus:border-indigo-500 focus:shadow-lg">
                  <option value="">Select gender...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all hover:border-gray-300">Cancel</button>
                <button type="submit" disabled={adding}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50">
                  {adding ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Adding...</span> : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── Smooth Delete Confirmation Modal ──────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative w-full max-w-md glass rounded-3xl shadow-2xl p-8 lg:p-10 animate-scale-in border border-red-100/60">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30 flex-shrink-0 animate-pulse-soft">
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Delete Student</h2>
                <p className="text-xs text-red-500 font-semibold tracking-wide uppercase">Permanent Removal</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed mb-8">
              Are you sure you want to remove <span className="font-extrabold text-gray-900">{deleteTarget.name}</span> from the database? All associated health records and prediction history will be permanently deleted.
            </p>

            <div className="flex gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all hover:border-gray-300 disabled:opacity-50">
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} disabled={deleting}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white font-bold text-sm shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/35 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Student'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Export named icons that might be missing ────────────────────────────
function ChildIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
function Footprints(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}
function Moon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}
function Apple(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
