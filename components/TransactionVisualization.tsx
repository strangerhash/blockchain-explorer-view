'use client';

import { useState } from 'react';
import { ArrowRight, Plus, Edit, Send, Copy, Check } from 'lucide-react';
import type { TransactionExplanation } from '@/lib/sui-client';

interface TransactionVisualizationProps {
  explanation: TransactionExplanation;
  darkMode?: boolean;
}

export default function TransactionVisualization({ explanation, darkMode = false }: TransactionVisualizationProps) {
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);
  const transfers = explanation.actions.filter(a => a.type === 'transfer');
  const creates = explanation.actions.filter(a => a.type === 'create');
  const mutations = explanation.actions.filter(a => a.type === 'mutate');

  const shortAddr = (addr: string) => {
    if (!addr) return 'Unknown';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const getDisplayName = (addr: string) => {
    if (!addr) return { name: null, short: 'Unknown', full: 'Unknown' };
    const accountName = explanation.accountNames?.get(addr);
    const short = shortAddr(addr);
    if (accountName) {
      return { name: accountName, short, full: addr, display: `${accountName} (${short})` };
    }
    return { name: null, short, full: addr, display: `${short} (account name not available)` };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddr(text);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  return (
    <div className={`rounded-2xl border shadow-xl backdrop-blur-sm transition-all duration-300 p-6 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-gray-700/50' 
        : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
    }`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-xl transition-all duration-300 ${
          darkMode 
            ? 'bg-gradient-to-br from-blue-600/20 to-indigo-600/20' 
            : 'bg-blue-100'
        }`}>
          <Send className={`w-5 h-5 transition-colors ${
            darkMode ? 'text-blue-400' : 'text-blue-600'
          }`} />
        </div>
        <h3 className={`text-xl font-bold transition-colors ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>Transaction Flow</h3>
      </div>
      
      <div className="space-y-4">
        {/* Transfers */}
        {transfers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Send className={`w-4 h-4 transition-colors ${
                darkMode ? 'text-blue-400' : 'text-blue-600'
              }`} />
              <span className={`font-medium transition-colors ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Transfers</span>
            </div>
            <div className="space-y-3">
              {transfers.slice(0, 10).map((transfer, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 rounded-xl p-4 border shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
                    darkMode 
                      ? 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600' 
                      : 'bg-white border-blue-200 hover:border-blue-300'
                  }`}
                >
                  {transfer.from && transfer.to ? (
                    <>
                      <div className="flex-1 text-right">
                        <div className="flex items-center justify-end gap-1.5 mb-1">
                          <div className={`text-sm transition-colors ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {(() => {
                              const fromInfo = getDisplayName(transfer.from);
                              return (
                                <>
                                  {fromInfo.name ? (
                                    <>
                                      <span className={`font-semibold transition-colors ${
                                        darkMode ? 'text-blue-400' : 'text-blue-700'
                                      }`}>{fromInfo.name}</span>
                                      <span className={`font-mono text-xs transition-colors ${
                                        darkMode ? 'text-gray-500' : 'text-gray-400'
                                      }`}> ({fromInfo.short})</span>
                                    </>
                                  ) : (
                                    <span className="font-mono">{fromInfo.display}</span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                          <button
                            onClick={() => copyToClipboard(transfer.from!)}
                            className={`p-1 rounded-lg transition-all duration-300 hover:scale-110 ${
                              darkMode 
                                ? 'hover:bg-gray-700/50' 
                                : 'hover:bg-gray-200'
                            }`}
                            title="Copy address"
                          >
                            {copiedAddr === transfer.from ? (
                              <Check className={`w-3.5 h-3.5 transition-colors ${
                                darkMode ? 'text-green-400' : 'text-green-600'
                              }`} />
                            ) : (
                              <Copy className={`w-3.5 h-3.5 transition-colors ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`} />
                            )}
                          </button>
                        </div>
                        {transfer.amount && (
                          <div className={`text-xs font-medium mt-0.5 transition-colors ${
                            darkMode ? 'text-red-400' : 'text-red-600'
                          }`}>
                            -{transfer.amount}
                          </div>
                        )}
                      </div>
                      <ArrowRight className={`w-5 h-5 flex-shrink-0 transition-colors ${
                        darkMode ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className={`text-sm transition-colors ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {(() => {
                              const toInfo = getDisplayName(transfer.to);
                              return (
                                <>
                                  {toInfo.name ? (
                                    <>
                                      <span className={`font-semibold transition-colors ${
                                        darkMode ? 'text-blue-400' : 'text-blue-700'
                                      }`}>{toInfo.name}</span>
                                      <span className={`font-mono text-xs transition-colors ${
                                        darkMode ? 'text-gray-500' : 'text-gray-400'
                                      }`}> ({toInfo.short})</span>
                                    </>
                                  ) : (
                                    <span className="font-mono">{toInfo.display}</span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                          <button
                            onClick={() => copyToClipboard(transfer.to!)}
                            className={`p-1 rounded-lg transition-all duration-300 hover:scale-110 ${
                              darkMode 
                                ? 'hover:bg-gray-700/50' 
                                : 'hover:bg-gray-200'
                            }`}
                            title="Copy address"
                          >
                            {copiedAddr === transfer.to ? (
                              <Check className={`w-3.5 h-3.5 transition-colors ${
                                darkMode ? 'text-green-400' : 'text-green-600'
                              }`} />
                            ) : (
                              <Copy className={`w-3.5 h-3.5 transition-colors ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`} />
                            )}
                          </button>
                        </div>
                        {transfer.amount && (
                          <div className={`text-xs font-medium mt-0.5 transition-colors ${
                            darkMode ? 'text-green-400' : 'text-green-600'
                          }`}>
                            +{transfer.amount}
                          </div>
                        )}
                      </div>
                    </>
                  ) : transfer.to ? (
                    <>
                      <div className="flex-1 text-center">
                        <div className={`text-xs font-medium transition-colors ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Mint/Create</div>
                      </div>
                      <ArrowRight className={`w-5 h-5 flex-shrink-0 transition-colors ${
                        darkMode ? 'text-green-400' : 'text-green-600'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className={`text-sm transition-colors ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {(() => {
                              const toInfo = getDisplayName(transfer.to);
                              return (
                                <>
                                  {toInfo.name ? (
                                    <>
                                      <span className={`font-semibold transition-colors ${
                                        darkMode ? 'text-blue-400' : 'text-blue-700'
                                      }`}>{toInfo.name}</span>
                                      <span className={`font-mono text-xs transition-colors ${
                                        darkMode ? 'text-gray-500' : 'text-gray-400'
                                      }`}> ({toInfo.short})</span>
                                    </>
                                  ) : (
                                    <span className="font-mono">{toInfo.display}</span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                          <button
                            onClick={() => copyToClipboard(transfer.to!)}
                            className={`p-1 rounded-lg transition-all duration-300 hover:scale-110 ${
                              darkMode 
                                ? 'hover:bg-gray-700/50' 
                                : 'hover:bg-gray-200'
                            }`}
                            title="Copy address"
                          >
                            {copiedAddr === transfer.to ? (
                              <Check className={`w-3.5 h-3.5 transition-colors ${
                                darkMode ? 'text-green-400' : 'text-green-600'
                              }`} />
                            ) : (
                              <Copy className={`w-3.5 h-3.5 transition-colors ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`} />
                            )}
                          </button>
                        </div>
                        {transfer.amount && (
                          <div className={`text-xs font-medium mt-0.5 transition-colors ${
                            darkMode ? 'text-green-400' : 'text-green-600'
                          }`}>
                            +{transfer.amount}
                          </div>
                        )}
                      </div>
                    </>
                  ) : transfer.from ? (
                    <>
                      <div className="flex-1 text-right">
                        <div className="flex items-center justify-end gap-1.5 mb-1">
                          <div className={`text-sm transition-colors ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {(() => {
                              const fromInfo = getDisplayName(transfer.from);
                              return (
                                <>
                                  {fromInfo.name ? (
                                    <>
                                      <span className={`font-semibold transition-colors ${
                                        darkMode ? 'text-blue-400' : 'text-blue-700'
                                      }`}>{fromInfo.name}</span>
                                      <span className={`font-mono text-xs transition-colors ${
                                        darkMode ? 'text-gray-500' : 'text-gray-400'
                                      }`}> ({fromInfo.short})</span>
                                    </>
                                  ) : (
                                    <span className="font-mono">{fromInfo.display}</span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                          <button
                            onClick={() => copyToClipboard(transfer.from!)}
                            className={`p-1 rounded-lg transition-all duration-300 hover:scale-110 ${
                              darkMode 
                                ? 'hover:bg-gray-700/50' 
                                : 'hover:bg-gray-200'
                            }`}
                            title="Copy address"
                          >
                            {copiedAddr === transfer.from ? (
                              <Check className={`w-3.5 h-3.5 transition-colors ${
                                darkMode ? 'text-green-400' : 'text-green-600'
                              }`} />
                            ) : (
                              <Copy className={`w-3.5 h-3.5 transition-colors ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                              }`} />
                            )}
                          </button>
                        </div>
                        {transfer.amount && (
                          <div className={`text-xs font-medium mt-0.5 transition-colors ${
                            darkMode ? 'text-red-400' : 'text-red-600'
                          }`}>
                            -{transfer.amount}
                          </div>
                        )}
                      </div>
                      <ArrowRight className={`w-5 h-5 flex-shrink-0 transition-colors ${
                        darkMode ? 'text-red-400' : 'text-red-600'
                      }`} />
                      <div className="flex-1 text-center">
                        <div className={`text-xs font-medium transition-colors ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Burn/Sent</div>
                      </div>
                    </>
                  ) : null}
                </div>
              ))}
              {transfers.length > 10 && (
                <div className={`text-center text-sm py-2 transition-colors ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  ... and {transfers.length - 10} more transfers
                </div>
              )}
            </div>
          </div>
        )}

        {/* Object Creation */}
        {creates.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Plus className={`w-4 h-4 transition-colors ${
                darkMode ? 'text-green-400' : 'text-green-600'
              }`} />
              <span className={`font-medium transition-colors ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Object Creation</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {creates.slice(0, 3).map((create, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-3 border transition-all duration-300 ${
                    darkMode 
                      ? 'bg-gray-800/50 border-green-700/50' 
                      : 'bg-white border-green-200'
                  }`}
                >
                  <div className={`font-mono text-xs break-all transition-colors ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {create.objectId?.substring(0, 20)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mutations */}
        {mutations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Edit className={`w-4 h-4 transition-colors ${
                darkMode ? 'text-purple-400' : 'text-purple-600'
              }`} />
              <span className={`font-medium transition-colors ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Object Mutations</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {mutations.slice(0, 3).map((mutate, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-3 border transition-all duration-300 ${
                    darkMode 
                      ? 'bg-gray-800/50 border-purple-700/50' 
                      : 'bg-white border-purple-200'
                  }`}
                >
                  <div className={`font-mono text-xs break-all transition-colors ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {mutate.objectId?.substring(0, 20)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
