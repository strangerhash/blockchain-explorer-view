'use client';

import { useState } from 'react';
import { Loader2, Search, RefreshCw, Copy, Check, Sparkles, AlertTriangle, AlertCircle, Info, Lightbulb, Book, FileText, ChevronRight, Bot, Moon, Sun, Zap, Clock } from 'lucide-react';
import Link from 'next/link';
import TransactionVisualization from './TransactionVisualization';
import type { TransactionExplanation } from '@/lib/sui-client';

export type Blockchain = 'hedera' | 'sui';

export default function TransactionExplainer() {
  const [digest, setDigest] = useState('');
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<TransactionExplanation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [useAI, setUseAI] = useState(true); // AI enabled by default
  const [darkMode, setDarkMode] = useState(true); // Dark mode enabled by default
  const [blockchain, setBlockchain] = useState<Blockchain>('hedera'); // Default to Hedera

  const handleExplain = async () => {
    if (!digest.trim()) {
      setError('Please enter a transaction digest');
      return;
    }

    setLoading(true);
    setError(null);
    setExplanation(null);

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          digest: digest.trim(),
          useAI,
          blockchain, // Include blockchain selection
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch transaction');
      }

      // Convert accountNames object back to Map
      if (data.explanation.accountNames && typeof data.explanation.accountNames === 'object') {
        data.explanation.accountNames = new Map(Object.entries(data.explanation.accountNames));
      }

      setExplanation(data.explanation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleExplainAnother = () => {
    setDigest('');
    setExplanation(null);
    setError(null);
  };

  const copySummaryToClipboard = () => {
    if (explanation) {
      const text = `Transaction Summary:\n${explanation.summary}\n\nGas Used: ${explanation.totalGasCost}\nObjects Created: ${explanation.objectsCreated}\nObjects Transferred: ${explanation.objectsTransferred}`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyAddressToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-950' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'
    }`}>
      {/* Navigation Header */}
      <nav className={`border-b shadow-lg backdrop-blur-sm transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-900/80 border-gray-700/50' 
          : 'bg-white/80 border-gray-200/50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-all duration-300 ${
                darkMode ? 'bg-gradient-to-br from-purple-600 to-indigo-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
              }`}>
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className={`text-xl font-bold transition-colors ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>Transaction Explainer</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2.5 rounded-lg transition-all duration-300 hover:scale-110 ${
                  darkMode 
                    ? 'bg-gray-800/50 text-yellow-400 hover:bg-gray-700/50' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <Link
                href="/docs"
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 ${
                  darkMode 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800/50' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <Book className="w-4 h-4" />
                Documentation
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`rounded-2xl shadow-2xl border backdrop-blur-sm transition-all duration-300 p-6 md:p-8 ${
          darkMode 
            ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 shadow-purple-500/10' 
            : 'bg-white/90 border-gray-200/50 shadow-blue-500/10'
        }`}>
          {/* Hero Section */}
          <div className="mb-8 text-center">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 shadow-lg transition-all duration-300 ${
              darkMode 
                ? 'bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600' 
                : 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600'
            }`}>
              <Search className="w-10 h-10 text-white" />
            </div>
            <h1 className={`text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r transition-all duration-300 ${
              darkMode 
                ? 'from-purple-400 via-pink-400 to-blue-400' 
                : 'from-blue-600 via-indigo-600 to-purple-600'
            }`}>
              Blockchain Transaction Explainer
            </h1>
            <p className={`text-lg max-w-2xl mx-auto transition-colors ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Understand what happened in any blockchain transaction using plain, human-readable language
            </p>
          </div>

                {/* Blockchain Selector */}
                <div className="mb-6 flex justify-center">
                  <div className={`inline-flex rounded-xl p-1 border backdrop-blur-sm transition-all duration-300 ${
                    darkMode 
                      ? 'bg-gray-800/50 border-gray-700/50' 
                      : 'bg-white/80 border-gray-200'
                  }`}>
                    <button
                      onClick={() => setBlockchain('hedera')}
                      className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                        blockchain === 'hedera'
                          ? darkMode
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                            : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                          : darkMode
                            ? 'text-gray-400 hover:text-gray-200'
                            : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Hedera
                    </button>
                    <button
                      onClick={() => setBlockchain('sui')}
                      className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                        blockchain === 'sui'
                          ? darkMode
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                          : darkMode
                            ? 'text-gray-400 hover:text-gray-200'
                            : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Sui
                    </button>
                  </div>
                </div>

                {/* Search Section */}
                <div className="mb-8">
                  <label htmlFor="transaction-input" className={`block text-sm font-semibold mb-3 transition-colors ${
                    darkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Transaction Digest
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative group">
                      <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${
                        darkMode ? 'text-indigo-400' : 'text-gray-400'
                      }`}>
                        <Search className="h-5 w-5" />
                      </div>
                      <input
                        id="transaction-input"
                        type="text"
                        value={digest}
                        onChange={(e) => setDigest(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !loading && handleExplain()}
                        placeholder="Enter transaction digest (e.g., 0x1234...) or paste transaction link"
                        className={`block w-full pl-12 pr-4 py-4 rounded-xl shadow-lg transition-all duration-300 text-base focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          darkMode 
                            ? 'bg-gray-800/50 border border-gray-700/50 text-white placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500 hover:border-gray-600' 
                            : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400'
                        } ${loading ? 'opacity-50' : ''}`}
                        disabled={loading}
                      />
                    </div>
                    <button
                      onClick={handleExplain}
                      disabled={loading || !digest.trim()}
                      className={`px-8 py-4 rounded-xl font-semibold shadow-lg transition-all duration-300 min-w-[160px] justify-center flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        darkMode
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white hover:shadow-purple-500/50 hover:scale-105'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white hover:shadow-blue-500/50 hover:scale-105'
                      }`}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5" />
                          <span>Explain</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* AI Toggle */}
                  <div className="mt-4 flex items-center justify-between">
                    <p className={`text-sm transition-colors ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Paste a {blockchain === 'hedera' ? 'Hedera' : 'Sui'} transaction hash or link from {blockchain === 'hedera' ? 'Hedera' : 'Sui'} Explorer
                    </p>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="flex items-center gap-2">
                        <Bot className={`w-4 h-4 transition-colors ${
                          useAI 
                            ? darkMode ? 'text-purple-400' : 'text-purple-600' 
                            : darkMode ? 'text-gray-500' : 'text-gray-400'
                        }`} />
                        <span className={`text-sm font-medium transition-colors ${
                          useAI 
                            ? darkMode ? 'text-purple-300' : 'text-purple-700' 
                            : darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          AI Enhancement
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={useAI}
                          onChange={(e) => setUseAI(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-12 h-6 rounded-full transition-all duration-300 shadow-inner ${
                          useAI 
                            ? darkMode ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                            : darkMode ? 'bg-gray-700' : 'bg-gray-300'
                        }`}>
                          <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-all duration-300 ${
                            useAI ? 'translate-x-6' : 'translate-x-0.5'
                          } mt-0.5 ${useAI && darkMode ? 'ring-2 ring-purple-300' : ''}`} />
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Data Availability Notification */}
                  <div className={`mt-4 p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                    darkMode 
                      ? 'bg-amber-900/20 border-amber-700/50' 
                      : 'bg-amber-50 border-amber-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 transition-colors ${
                        darkMode ? 'text-amber-400' : 'text-amber-600'
                      }`} />
                      <div>
                        <p className={`text-sm font-medium mb-1 transition-colors ${
                          darkMode ? 'text-amber-300' : 'text-amber-900'
                        }`}>
                          Data Availability Notice
                        </p>
                        <p className={`text-xs leading-relaxed transition-colors ${
                          darkMode ? 'text-amber-200' : 'text-amber-800'
                        }`}>
                          Some transaction data may not be available for all transactions. Missing information (such as account names, transaction details, or balance changes) will be displayed as "not available" or "account name not available" throughout the explanation.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

          {error && (
            <div className={`mb-6 p-5 rounded-xl border-l-4 shadow-lg backdrop-blur-sm transition-all duration-300 ${
              darkMode 
                ? 'bg-red-900/20 border-red-500' 
                : 'bg-red-50 border-red-400'
            }`}>
              <div className="flex items-start">
                <AlertTriangle className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${
                  darkMode ? 'text-red-400' : 'text-red-600'
                }`} />
                <div>
                  <h3 className={`text-sm font-semibold mb-1 ${
                    darkMode ? 'text-red-300' : 'text-red-800'
                  }`}>Error</h3>
                  <p className={`text-sm ${
                    darkMode ? 'text-red-200' : 'text-red-700'
                  }`}>{error}</p>
                </div>
              </div>
            </div>
          )}

          {explanation && (
            <div className="space-y-6">
              {/* Summary Card */}
              <div className={`rounded-2xl border shadow-xl backdrop-blur-sm transition-all duration-300 p-6 mb-6 overflow-hidden ${
                darkMode 
                  ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50 shadow-purple-500/10' 
                  : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-200/50 shadow-blue-500/10'
              }`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl transition-all duration-300 ${
                      darkMode 
                        ? 'bg-gradient-to-br from-purple-600/20 to-indigo-600/20' 
                        : 'bg-gradient-to-br from-blue-100 to-indigo-100'
                    }`}>
                      <FileText className={`w-5 h-5 transition-colors ${
                        darkMode ? 'text-purple-300' : 'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <div>
                        <h2 className={`text-xl font-bold transition-colors ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          Transaction Summary
                        </h2>
                        {explanation.timestampFormatted && (
                          <p className={`text-xs mt-1 transition-colors ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            <Clock className="w-3 h-3 inline mr-1" />
                            {explanation.timestampFormatted}
                          </p>
                        )}
                      </div>
                      {explanation.aiEnhanced && (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 mt-2 text-xs font-semibold rounded-full transition-all duration-300 ${
                          darkMode 
                            ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/30 text-purple-300 border border-purple-500/50' 
                            : 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-200'
                        }`}>
                          <Sparkles className="w-3.5 h-3.5" />
                          AI Enhanced
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={copySummaryToClipboard}
                    className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-110 ${
                      darkMode 
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
                    }`}
                    title="Copy summary"
                  >
                    {copied ? (
                      <Check className={`w-5 h-5 transition-colors ${
                        darkMode ? 'text-green-400' : 'text-green-600'
                      }`} />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
                
                {/* AI Status Indicator */}
                {explanation.aiStatus && explanation.aiStatus !== 'enabled' && (
                  <div className={`mb-4 rounded-xl p-4 border-l-4 transition-all duration-300 ${
                    explanation.aiStatus === 'timeout'
                      ? darkMode
                        ? 'bg-gradient-to-r from-orange-900/30 to-amber-900/30 border-orange-400/50'
                        : 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-400'
                      : explanation.aiStatus === 'error'
                      ? darkMode
                        ? 'bg-gradient-to-r from-red-900/30 to-pink-900/30 border-red-400/50'
                        : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-400'
                      : explanation.aiStatus === 'no_key'
                      ? darkMode
                        ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-400/50'
                        : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-400'
                      : darkMode
                        ? 'bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-gray-500/50'
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-400'
                  }`}>
                    <div className="flex items-start gap-3">
                      {explanation.aiStatus === 'timeout' && (
                        <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 transition-colors ${
                          darkMode ? 'text-orange-300' : 'text-orange-600'
                        }`} />
                      )}
                      {explanation.aiStatus === 'error' && (
                        <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 transition-colors ${
                          darkMode ? 'text-red-300' : 'text-red-600'
                        }`} />
                      )}
                      {(explanation.aiStatus === 'no_key' || explanation.aiStatus === 'disabled') && (
                        <Info className={`w-5 h-5 mt-0.5 flex-shrink-0 transition-colors ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`} />
                      )}
                      <div className="flex-1">
                        <p className={`text-sm font-semibold mb-1 transition-colors ${
                          explanation.aiStatus === 'timeout'
                            ? darkMode ? 'text-orange-200' : 'text-orange-900'
                            : explanation.aiStatus === 'error'
                            ? darkMode ? 'text-red-200' : 'text-red-900'
                            : explanation.aiStatus === 'no_key'
                            ? darkMode ? 'text-yellow-200' : 'text-yellow-900'
                            : darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {explanation.aiStatus === 'timeout' && '⚠️ AI Enhancement Timed Out'}
                          {explanation.aiStatus === 'error' && '❌ AI Enhancement Failed'}
                          {explanation.aiStatus === 'no_key' && '🔑 AI Enhancement Unavailable'}
                          {explanation.aiStatus === 'disabled' && 'ℹ️ AI Enhancement Disabled'}
                        </p>
                        {explanation.aiStatusMessage && (
                          <p className={`text-xs leading-relaxed transition-colors ${
                            explanation.aiStatus === 'timeout'
                              ? darkMode ? 'text-orange-300/90' : 'text-orange-800'
                              : explanation.aiStatus === 'error'
                              ? darkMode ? 'text-red-300/90' : 'text-red-800'
                              : explanation.aiStatus === 'no_key'
                              ? darkMode ? 'text-yellow-300/90' : 'text-yellow-800'
                              : darkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {explanation.aiStatusMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className={`rounded-xl p-5 border backdrop-blur-sm transition-all duration-300 ${
                  darkMode 
                    ? 'bg-gray-900/50 border-gray-700/50' 
                    : 'bg-white/80 border-blue-100'
                }`}>
                  <p className={`leading-relaxed text-base whitespace-pre-line transition-colors ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {explanation.summary}
                  </p>
                </div>
              </div>

              {/* AI Insights */}
              {explanation.aiEnhanced && explanation.aiInsights && explanation.aiInsights.length > 0 && (
                <div className={`rounded-2xl border-l-4 shadow-xl backdrop-blur-sm transition-all duration-300 p-6 ${
                  darkMode 
                    ? 'bg-gradient-to-br from-amber-900/20 to-yellow-900/20 border-amber-400/50' 
                    : 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-400'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-xl transition-all duration-300 ${
                      darkMode 
                        ? 'bg-gradient-to-br from-amber-600/30 to-yellow-600/30' 
                        : 'bg-gradient-to-br from-amber-100 to-yellow-100'
                    }`}>
                      <Lightbulb className={`w-5 h-5 transition-colors ${
                        darkMode ? 'text-amber-300' : 'text-amber-600'
                      }`} />
                    </div>
                    <h3 className={`text-lg font-bold transition-colors ${
                      darkMode ? 'text-amber-200' : 'text-amber-900'
                    }`}>AI Insights</h3>
                  </div>
                  <ul className="space-y-3">
                    {explanation.aiInsights.map((insight, idx) => (
                      <li key={idx} className={`flex items-start gap-3 transition-colors ${
                        darkMode ? 'text-amber-200' : 'text-amber-800'
                      }`}>
                        <ChevronRight className={`w-5 h-5 mt-0.5 flex-shrink-0 transition-colors ${
                          darkMode ? 'text-amber-400' : 'text-amber-600'
                        }`} />
                        <span className="text-sm leading-relaxed">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI Risks */}
              {explanation.aiEnhanced && explanation.aiRisks && explanation.aiRisks.length > 0 && (
                <div className={`rounded-2xl border-l-4 shadow-xl backdrop-blur-sm transition-all duration-300 p-6 ${
                  darkMode 
                    ? 'bg-gradient-to-br from-red-900/20 to-pink-900/20 border-red-400/50' 
                    : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-400'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-xl transition-all duration-300 ${
                      darkMode 
                        ? 'bg-gradient-to-br from-red-600/30 to-pink-600/30' 
                        : 'bg-gradient-to-br from-red-100 to-pink-100'
                    }`}>
                      <AlertTriangle className={`w-5 h-5 transition-colors ${
                        darkMode ? 'text-red-300' : 'text-red-600'
                      }`} />
                    </div>
                    <h3 className={`text-lg font-bold transition-colors ${
                      darkMode ? 'text-red-200' : 'text-red-900'
                    }`}>Potential Risks</h3>
                  </div>
                  <ul className="space-y-3">
                    {explanation.aiRisks.map((risk, idx) => (
                      <li key={idx} className={`flex items-start gap-3 transition-colors ${
                        darkMode ? 'text-red-200' : 'text-red-800'
                      }`}>
                        <ChevronRight className={`w-5 h-5 mt-0.5 flex-shrink-0 transition-colors ${
                          darkMode ? 'text-red-400' : 'text-red-600'
                        }`} />
                        <span className="text-sm leading-relaxed">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Visualization */}
              {explanation.actions.length > 0 && (
                <TransactionVisualization explanation={explanation} darkMode={darkMode} />
              )}

              {/* Transaction Timestamp */}
              {explanation.timestampFormatted && (
                <div className={`rounded-xl p-6 border shadow-lg backdrop-blur-sm transition-all duration-300 ${
                  darkMode 
                    ? 'bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border-indigo-600/50' 
                    : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <Clock className={`w-6 h-6 transition-colors ${
                      darkMode ? 'text-indigo-300' : 'text-indigo-600'
                    }`} />
                    <div>
                      <div className={`text-xs font-semibold uppercase tracking-wide mb-1 transition-colors ${
                        darkMode ? 'text-indigo-400' : 'text-indigo-700'
                      }`}>Transaction Time</div>
                      <div className={`text-lg font-bold transition-colors ${
                        darkMode ? 'text-indigo-200' : 'text-indigo-900'
                      }`}>
                        {explanation.timestampFormatted}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`rounded-xl p-6 border shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
                  darkMode 
                    ? 'bg-gradient-to-br from-gray-800/80 to-gray-700/80 border-gray-600/50' 
                    : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
                }`}>
                  <div className={`text-xs font-semibold uppercase tracking-wide mb-2 transition-colors ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Gas Used</div>
                  <div className={`text-3xl font-bold mb-1 transition-colors ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {explanation.totalGasCost}
                  </div>
                  <div className={`text-xs transition-colors ${
                    darkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    {explanation.gasUsed} computation
                  </div>
                </div>

                <div className={`rounded-xl p-6 border shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
                  darkMode 
                    ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-600/50' 
                    : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                }`}>
                  <div className={`text-xs font-semibold uppercase tracking-wide mb-2 transition-colors ${
                    darkMode ? 'text-green-400' : 'text-green-700'
                  }`}>Objects Created</div>
                  <div className={`text-3xl font-bold transition-colors ${
                    darkMode ? 'text-green-300' : 'text-green-900'
                  }`}>
                    {explanation.objectsCreated}
                  </div>
                </div>

                <div className={`rounded-xl p-6 border shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
                  darkMode 
                    ? 'bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-600/50' 
                    : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200'
                }`}>
                  <div className={`text-xs font-semibold uppercase tracking-wide mb-2 transition-colors ${
                    darkMode ? 'text-blue-400' : 'text-blue-700'
                  }`}>Objects Transferred</div>
                  <div className={`text-3xl font-bold transition-colors ${
                    darkMode ? 'text-blue-300' : 'text-blue-900'
                  }`}>
                    {explanation.objectsTransferred}
                  </div>
                </div>

                <div className={`rounded-xl p-6 border shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
                  darkMode 
                    ? 'bg-gradient-to-br from-purple-900/30 to-violet-900/30 border-purple-600/50' 
                    : 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200'
                }`}>
                  <div className={`text-xs font-semibold uppercase tracking-wide mb-2 transition-colors ${
                    darkMode ? 'text-purple-400' : 'text-purple-700'
                  }`}>Objects Mutated</div>
                  <div className={`text-3xl font-bold transition-colors ${
                    darkMode ? 'text-purple-300' : 'text-purple-900'
                  }`}>
                    {explanation.objectsMutated}
                  </div>
                </div>
              </div>

              {/* Actions List */}
              {explanation.actions.length > 0 && (
                <div className={`rounded-2xl border shadow-xl backdrop-blur-sm transition-all duration-300 p-6 ${
                  darkMode 
                    ? 'bg-gray-800/80 border-gray-700/50' 
                    : 'bg-white border-gray-200'
                }`}>
                  <h3 className={`text-xl font-bold mb-4 transition-colors ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Detailed Actions
                  </h3>
                  <div className="space-y-3">
                    {explanation.actions.map((action, idx) => {
                      const typeStyles = {
                        transfer: darkMode 
                          ? 'bg-blue-900/20 border-blue-500/50' 
                          : 'bg-blue-50 border-blue-400',
                        create: darkMode 
                          ? 'bg-green-900/20 border-green-500/50' 
                          : 'bg-green-50 border-green-400',
                        mutate: darkMode 
                          ? 'bg-purple-900/20 border-purple-500/50' 
                          : 'bg-purple-50 border-purple-400',
                        call: darkMode 
                          ? 'bg-gray-800/50 border-gray-600/50' 
                          : 'bg-gray-50 border-gray-400'
                      };
                      
                      const dotColors = {
                        transfer: 'bg-blue-500',
                        create: 'bg-green-500',
                        mutate: 'bg-purple-500',
                        call: 'bg-gray-500'
                      };
                      
                      return (
                        <div
                          key={idx}
                          className={`flex items-start gap-4 p-5 rounded-xl border-l-4 shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
                            typeStyles[action.type] || typeStyles.call
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 shadow-lg ${
                            dotColors[action.type] || dotColors.call
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className={`font-bold mb-1 transition-colors ${
                              darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {action.type.charAt(0).toUpperCase() + action.type.slice(1)}
                            </div>
                            <div className={`text-sm mb-2 transition-colors ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>{action.description}</div>
                            {action.amount && (
                              <div className={`text-xs mt-1 px-2 py-1 rounded-md inline-block transition-colors ${
                                darkMode ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100 text-gray-600'
                              }`}>
                                Amount: {action.amount}
                              </div>
                            )}
                          {action.from && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-xs transition-colors ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>From:</span>
                              <div className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg transition-all duration-300 ${
                                darkMode 
                                  ? 'bg-gray-900/50 text-gray-300 border border-gray-700' 
                                  : 'bg-white/80 text-gray-600 border border-gray-200'
                              }`}>
                                {explanation.accountNames?.get(action.from) ? (
                                  <>
                                    <span className={`font-semibold transition-colors ${
                                      darkMode ? 'text-blue-400' : 'text-blue-700'
                                    }`}>{explanation.accountNames.get(action.from)}</span>
                                    <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>
                                      ({action.from.substring(0, 8)}...{action.from.substring(action.from.length - 6)})
                                    </span>
                                  </>
                                ) : (
                                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                                    {action.from.substring(0, 8)}...{action.from.substring(action.from.length - 6)} (account name not available)
                                  </span>
                                )}
                                <button
                                  onClick={() => copyAddressToClipboard(action.from!)}
                                  className={`ml-1 p-1 rounded-lg transition-all duration-300 hover:scale-110 ${
                                    darkMode 
                                      ? 'hover:bg-gray-700/50' 
                                      : 'hover:bg-gray-200'
                                  }`}
                                  title="Copy address"
                                >
                                  <Copy className={`w-3.5 h-3.5 transition-colors ${
                                    darkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`} />
                                </button>
                              </div>
                            </div>
                          )}
                          {action.to && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-xs transition-colors ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>To:</span>
                              <div className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg transition-all duration-300 ${
                                darkMode 
                                  ? 'bg-gray-900/50 text-gray-300 border border-gray-700' 
                                  : 'bg-white/80 text-gray-600 border border-gray-200'
                              }`}>
                                {explanation.accountNames?.get(action.to) ? (
                                  <>
                                    <span className={`font-semibold transition-colors ${
                                      darkMode ? 'text-blue-400' : 'text-blue-700'
                                    }`}>{explanation.accountNames.get(action.to)}</span>
                                    <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>
                                      ({action.to.substring(0, 8)}...{action.to.substring(action.to.length - 6)})
                                    </span>
                                  </>
                                ) : (
                                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                                    {action.to.substring(0, 8)}...{action.to.substring(action.to.length - 6)} (account name not available)
                                  </span>
                                )}
                                <button
                                  onClick={() => copyAddressToClipboard(action.to!)}
                                  className={`ml-1 p-1 rounded-lg transition-all duration-300 hover:scale-110 ${
                                    darkMode 
                                      ? 'hover:bg-gray-700/50' 
                                      : 'hover:bg-gray-200'
                                  }`}
                                  title="Copy address"
                                >
                                  <Copy className={`w-3.5 h-3.5 transition-colors ${
                                    darkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Move Calls */}
              {explanation.moveCalls.length > 0 && (
                <div className={`rounded-2xl border shadow-xl backdrop-blur-sm transition-all duration-300 p-6 ${
                  darkMode 
                    ? 'bg-gray-800/80 border-gray-700/50' 
                    : 'bg-white border-gray-200'
                }`}>
                  <h3 className={`text-xl font-bold mb-4 transition-colors ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Move Function Calls
                  </h3>
                  <div className="space-y-3">
                    {explanation.moveCalls.map((call, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
                          darkMode 
                            ? 'bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border-indigo-700/50' 
                            : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-mono text-sm leading-relaxed">
                            <span className={darkMode ? 'text-indigo-400' : 'text-indigo-600'}>{call.package}</span>
                            <span className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} mx-1`}>::</span>
                            <span className={`font-semibold transition-colors ${
                              darkMode ? 'text-indigo-300' : 'text-indigo-700'
                            }`}>{call.module}</span>
                            <span className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} mx-1`}>::</span>
                            <span className={`font-bold transition-colors ${
                              darkMode ? 'text-indigo-200' : 'text-indigo-900'
                            }`}>{call.function}</span>
                          </div>
                          <button
                            onClick={() => copyAddressToClipboard(call.package)}
                            className={`ml-2 p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                              darkMode 
                                ? 'hover:bg-indigo-800/50' 
                                : 'hover:bg-indigo-100'
                            }`}
                            title="Copy package address"
                          >
                            <Copy className={`w-4 h-4 transition-colors ${
                              darkMode ? 'text-indigo-400' : 'text-indigo-600'
                            }`} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

                     {/* Balance Changes */}
                     {explanation.balanceChanges && explanation.balanceChanges.length > 0 && (
                       <div className={`rounded-2xl border shadow-xl backdrop-blur-sm transition-all duration-300 p-6 ${
                         darkMode 
                           ? 'bg-gray-800/80 border-gray-700/50' 
                           : 'bg-white border-gray-200'
                       }`}>
                         <h3 className={`text-xl font-bold mb-4 transition-colors ${
                           darkMode ? 'text-white' : 'text-gray-900'
                         }`}>
                           Balance Changes
                         </h3>
                         <div className="space-y-3">
                           {explanation.balanceChanges.map((change, idx) => {
                             const accountName = change.accountName || explanation.accountNames?.get(change.address);
                             const shortAddr = change.address.substring(0, 6) + '...' + change.address.substring(change.address.length - 4);
                             
                             return (
                               <div
                                 key={idx}
                                 className={`flex items-center justify-between p-5 rounded-xl border-l-4 shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
                                   change.change === 'increase' 
                                     ? darkMode 
                                       ? 'bg-green-900/20 border-green-500/50' 
                                       : 'bg-green-50 border-green-400'
                                     : darkMode 
                                       ? 'bg-red-900/20 border-red-500/50' 
                                       : 'bg-red-50 border-red-400'
                                 }`}
                               >
                                 <div className="flex-1">
                                   <div className="flex items-center gap-2 mb-1">
                                     <div className={`font-mono text-sm transition-colors ${
                                       darkMode ? 'text-gray-300' : 'text-gray-700'
                                     }`}>
                                       {accountName ? (
                                         <>
                                           <span className={`font-semibold transition-colors ${
                                             darkMode ? 'text-blue-400' : 'text-blue-700'
                                           }`}>{accountName}</span>
                                           <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}> ({shortAddr})</span>
                                         </>
                                       ) : (
                                         <span>{shortAddr} (account name not available)</span>
                                       )}
                                     </div>
                                    <button
                                      onClick={() => copyAddressToClipboard(change.address)}
                                      className={`p-1.5 rounded-lg transition-all duration-300 hover:scale-110 ${
                                        darkMode 
                                          ? 'hover:bg-gray-700/50' 
                                          : 'hover:bg-gray-200'
                                      }`}
                                      title="Copy address"
                                    >
                                      <Copy className={`w-3.5 h-3.5 transition-colors ${
                                        darkMode ? 'text-gray-400' : 'text-gray-500'
                                      }`} />
                                    </button>
                                   </div>
                                   <div className={`text-xs transition-colors ${
                                     darkMode ? 'text-gray-400' : 'text-gray-500'
                                   }`}>
                                     {change.change === 'increase' ? 'Received' : 'Sent'}
                                   </div>
                                 </div>
                                 <div className="text-right">
                                   <div className={`text-lg font-bold transition-colors ${
                                     change.change === 'increase' 
                                       ? darkMode ? 'text-green-300' : 'text-green-700' 
                                       : darkMode ? 'text-red-300' : 'text-red-700'
                                   }`}>
                                     {change.change === 'increase' ? '+' : '-'}{change.amount} {change.coinType.includes('HBAR') ? 'HBAR' : change.coinType.includes('SUI') ? 'SUI' : 'tokens'}
                                   </div>
                                   {change.explanation && (
                                     <div className={`text-xs mt-1 transition-colors ${
                                       darkMode ? 'text-gray-400' : 'text-gray-500'
                                     }`}>
                                       {change.explanation}
                                     </div>
                                   )}
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                       </div>
                     )}

                     {/* Involved Addresses */}
                     {explanation.involvedAddresses.length > 0 && (
                       <div className={`rounded-2xl border shadow-xl backdrop-blur-sm transition-all duration-300 p-6 ${
                         darkMode 
                           ? 'bg-gray-800/80 border-gray-700/50' 
                           : 'bg-white border-gray-200'
                       }`}>
                         <h3 className={`text-xl font-bold mb-4 transition-colors ${
                           darkMode ? 'text-white' : 'text-gray-900'
                         }`}>
                           Involved Addresses
                         </h3>
                         <div className="flex flex-wrap gap-2">
                           {explanation.involvedAddresses.map((addr, idx) => {
                             const accountName = explanation.accountNames?.get(addr);
                             const shortAddr = addr.substring(0, 6) + '...' + addr.substring(addr.length - 4);
                             return (
                               <div
                                 key={idx}
                                 className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-mono border shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
                                   darkMode 
                                     ? 'bg-gradient-to-r from-gray-700/50 to-gray-800/50 text-gray-300 border-gray-600 hover:border-gray-500' 
                                     : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                                 }`}
                               >
                                 {accountName ? (
                                   <>
                                     <span className={`font-semibold transition-colors ${
                                       darkMode ? 'text-blue-400' : 'text-blue-700'
                                     }`}>{accountName}</span>
                                     <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>({shortAddr})</span>
                                   </>
                                 ) : (
                                   <span>{shortAddr} (account name not available)</span>
                                 )}
                                <button
                                  onClick={() => copyAddressToClipboard(addr)}
                                  className={`ml-1 p-1 rounded-lg transition-all duration-300 hover:scale-110 ${
                                    darkMode 
                                      ? 'hover:bg-gray-700/50' 
                                      : 'hover:bg-gray-200'
                                  }`}
                                  title="Copy address"
                                >
                                  <Copy className={`w-3.5 h-3.5 transition-colors ${
                                    darkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`} />
                                </button>
                               </div>
                             );
                           })}
                         </div>
                       </div>
                     )}

              {/* Explain Another Button */}
              <div className={`pt-6 border-t transition-colors ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <button
                  onClick={handleExplainAnother}
                  className={`w-full md:w-auto px-8 py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all duration-300 shadow-lg hover:scale-105 ${
                    darkMode
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white hover:shadow-purple-500/50'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white hover:shadow-blue-500/50'
                  }`}
                >
                  <RefreshCw className="w-5 h-5" />
                  Explain Another Transaction
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`mt-8 pt-6 border-t transition-colors ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className={`flex flex-col md:flex-row items-center justify-between gap-4 text-sm transition-colors ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <div className="flex items-center gap-4">
              <p className="font-medium">Powered by Aletheions</p>
              {explanation?.aiEnhanced && (
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                  darkMode 
                    ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/30 text-purple-300 border border-purple-500/50' 
                    : 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-200'
                }`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Enhanced
                </span>
              )}
            </div>
            <Link 
              href="/docs" 
              className={`inline-flex items-center gap-2 font-semibold transition-all duration-300 hover:scale-105 ${
                darkMode 
                  ? 'text-purple-400 hover:text-purple-300' 
                  : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              <Book className="w-4 h-4" />
              View Documentation
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
