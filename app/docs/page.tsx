'use client';

import { Book, Database, ArrowRight, Zap, Rocket, Moon, Sun, Code } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function DocsPage() {
  const [darkMode, setDarkMode] = useState(true); // Dark mode enabled by default

  useEffect(() => {
    // Load Mermaid dynamically
    if (typeof window !== 'undefined') {
      import('mermaid').then((mermaidModule) => {
        const mermaid = mermaidModule.default;

        // Use a simpler theme configuration with only valid Mermaid variables
        const themeConfig = darkMode ? {
          theme: 'dark' as const,
          themeVariables: {
            primaryColor: '#7c3aed',
            primaryTextColor: '#f3f4f6',
            primaryBorderColor: '#8b5cf6',
            lineColor: '#6b7280',
            secondaryColor: '#374151',
            tertiaryColor: '#1f2937',
            textColor: '#f3f4f6',
            noteTextColor: '#f3f4f6',
            noteBkgColor: '#374151',
            actorBorder: '#8b5cf6',
            actorBkg: '#7c3aed',
            actorTextColor: '#f3f4f6',
            signalColor: '#f3f4f6',
            signalTextColor: '#f3f4f6',
          },
        } : {
          theme: 'default' as const,
          themeVariables: {
            primaryColor: '#3b82f6',
            primaryTextColor: '#1f2937',
            primaryBorderColor: '#60a5fa',
            lineColor: '#4b5563',
            secondaryColor: '#e5e7eb',
            tertiaryColor: '#f3f4f6',
            textColor: '#1f2937',
            noteTextColor: '#1f2937',
            noteBkgColor: '#f9fafb',
            actorBorder: '#3b82f6',
            actorBkg: '#dbeafe',
            actorTextColor: '#1e40af',
            signalColor: '#1e40af',
            signalTextColor: '#1f2937',
          },
        };

        try {
          mermaid.initialize({ 
            startOnLoad: false, // We'll manually render
            ...themeConfig,
          });
        } catch (initError) {
          console.error('Mermaid initialization error:', initError);
          // Fallback to basic initialization
          mermaid.initialize({ 
            startOnLoad: false,
            theme: darkMode ? 'dark' : 'default',
          });
        }

        // Wait for DOM to be ready, then render all diagrams
        const renderDiagrams = () => {
          try {
            const elements = document.querySelectorAll('.mermaid');
            if (elements.length === 0) {
              console.warn('No Mermaid diagrams found to render');
              return;
            }

            // Process each diagram individually
            elements.forEach((el, index) => {
              const htmlEl = el as HTMLElement;
              
              // Remove any existing SVG
              const existingSvg = htmlEl.querySelector('svg');
              if (existingSvg) {
                existingSvg.remove();
              }

              // Get the diagram text - try multiple methods
              let diagramText = '';
              
              // First, try to get from data attribute (stored original)
              if (htmlEl.dataset.originalText) {
                diagramText = htmlEl.dataset.originalText;
              } else {
                // Get from textContent or innerText
                diagramText = htmlEl.textContent || htmlEl.innerText || '';
                // Store it for future use
                htmlEl.dataset.originalText = diagramText.trim();
              }

              // If still no text, try to get from child nodes
              if (!diagramText.trim() && htmlEl.childNodes.length > 0) {
                const textNodes: string[] = [];
                htmlEl.childNodes.forEach((node) => {
                  if (node.nodeType === Node.TEXT_NODE) {
                    textNodes.push(node.textContent || '');
                  }
                });
                diagramText = textNodes.join('').trim();
                if (diagramText) {
                  htmlEl.dataset.originalText = diagramText;
                }
              }

              // Ensure the element has the text content for Mermaid
              if (diagramText.trim()) {
                htmlEl.textContent = diagramText.trim();
                
                // Render using mermaid.render for more control
                const diagramId = `mermaid-diagram-${index}-${Date.now()}`;
                mermaid.render(diagramId, diagramText.trim())
                  .then((result) => {
                    htmlEl.innerHTML = result.svg;
                  })
                  .catch((renderErr) => {
                    console.error(`Error rendering diagram ${index}:`, renderErr);
                    // Fallback: try using mermaid.run on this single element
                    htmlEl.textContent = diagramText.trim();
                    mermaid.run({
                      querySelector: `#${htmlEl.id || `mermaid-${index}`}`,
                    }).catch((runErr) => {
                      console.error(`Error running diagram ${index}:`, runErr);
                    });
                  });
              } else {
                console.warn(`Diagram ${index} has no text content`);
              }
            });
          } catch (runError) {
            console.error('Error running Mermaid:', runError);
          }
        };

        // Try rendering immediately, then again after a short delay
        setTimeout(renderDiagrams, 100);
        setTimeout(renderDiagrams, 500);
      }).catch((importError) => {
        console.error('Failed to load Mermaid:', importError);
      });
    }
  }, [darkMode]);

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
            <Link href="/" className={`text-xl font-bold transition-colors ${
              darkMode ? 'text-white hover:text-purple-400' : 'text-gray-900 hover:text-blue-600'
            }`}>
              Transaction Explainer
            </Link>
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
                href="/"
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 ${
                  darkMode 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-800/50' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                Back to App
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 transition-all duration-300 ${
            darkMode 
              ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50' 
              : 'bg-blue-100 text-blue-700'
          }`}>
            <Book className="w-4 h-4" />
            Documentation
          </div>
          <h1 className={`text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r transition-all duration-300 ${
            darkMode 
              ? 'from-purple-400 via-pink-400 to-blue-400' 
              : 'from-blue-600 via-indigo-600 to-purple-600'
          }`}>
            Blockchain Transaction Explainer
          </h1>
          <p className={`text-xl max-w-2xl mx-auto transition-colors ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Basic documentation for architecture, data source, and usage
          </p>
        </div>

        {/* Table of Contents */}
        <div className={`rounded-2xl shadow-xl backdrop-blur-sm p-6 mb-8 border transition-all duration-300 ${
          darkMode 
            ? 'bg-gray-800/90 border-gray-700/50' 
            : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-2xl font-bold mb-4 transition-colors ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>Table of Contents</h2>
          <nav className="space-y-2">
            <a href="#architecture" className={`block transition-colors ${
              darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-blue-600 hover:text-blue-800'
            }`}>1. Architecture</a>
            <a href="#data-source" className={`block transition-colors ${
              darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-blue-600 hover:text-blue-800'
            }`}>2. Data Source</a>
            <a href="#data-flow" className={`block transition-colors ${
              darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-blue-600 hover:text-blue-800'
            }`}>3. Data Flow</a>
            <a href="#usage" className={`block transition-colors ${
              darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-blue-600 hover:text-blue-800'
            }`}>4. Usage</a>
          </nav>
        </div>

               {/* Architecture Section */}
               <section id="architecture" className={`rounded-2xl shadow-xl backdrop-blur-sm p-8 mb-8 border scroll-mt-20 transition-all duration-300 ${
                 darkMode 
                   ? 'bg-gray-800/90 border-gray-700/50' 
                   : 'bg-white border-gray-200'
               }`}>
                 <h2 className={`text-3xl font-bold mb-6 flex items-center gap-2 transition-colors ${
                   darkMode ? 'text-white' : 'text-gray-900'
                 }`}>
                   <Rocket className={`w-8 h-8 transition-colors ${
                     darkMode ? 'text-purple-400' : 'text-blue-600'
                   }`} />
                   1. Architecture
                 </h2>
                 <div className="space-y-6">
                   <div>
                     <h3 className={`text-xl font-semibold mb-4 transition-colors ${
                       darkMode ? 'text-white' : 'text-gray-900'
                     }`}>System Architecture</h3>
                     <p className={`mb-4 transition-colors ${
                       darkMode ? 'text-gray-300' : 'text-gray-700'
                     }`}>
                       The Blockchain Transaction Explainer is built as a Next.js application with a modular architecture that separates concerns between data fetching, analysis, and presentation.
                     </p>
                     <div className={`rounded-lg p-6 border transition-all duration-300 ${
                       darkMode 
                         ? 'bg-gray-900/50 border-gray-700/50' 
                         : 'bg-gray-50 border-gray-200'
                     }`}>
                <div className="mermaid" id="architecture-diagram">
{`graph TB
    A[User Enters Transaction Digest/Hash] --> B[Frontend: TransactionExplainer Component]
    B --> C[Select Blockchain: Hedera or Sui]
    C --> D[API Route: /api/explain]
    D --> E{Blockchain Type?}
    E -->|Hedera| F[Hedera Mirror Node API<br/>REST API]
    E -->|Sui| G{Data Source}
    G -->|Primary| H[Blockberry API<br/>Raw Transactions]
    G -->|Fallback| I[Sui RPC Client<br/>@mysten/sui.js]
    F --> J[Transaction Data Normalization]
    H --> J
    I --> J
    J --> K[Extract Sender Address]
    K --> L{Blockchain Type?}
    L -->|Hedera| M[Fetch Account Names<br/>Hedera Mirror Node API]
    L -->|Sui| N[Fetch Account Names<br/>Blockberry Accounts API]
    M --> O[Parse Transaction Details]
    N --> O
    O --> P{Blockchain Type?}
    P -->|Hedera| Q[Process HBAR Transfers<br/>Process Token Transfers/Burns]
    P -->|Sui| R[Process Object Changes<br/>Process Balance Changes<br/>Extract Move Calls]
    Q --> S[Generate Human-Readable Summary]
    R --> S
    S --> T{AI Enhancement?}
    T -->|Yes + API Key| U[Google Gemini API<br/>Dynamic Model Discovery]
    T -->|No| V[Default Summary]
    U --> W[Enhanced Summary + Insights + Risks]
    V --> X[Return Explanation]
    W --> X
    X --> Y[Display on UI]
    Y --> Z[Transaction Visualization]
    Y --> AA[Balance Changes]
    Y --> AB[Transaction Stats]
`}
              </div>
            </div>
            </div>
            
                   <div>
                     <h3 className={`text-xl font-semibold mb-4 transition-colors ${
                       darkMode ? 'text-white' : 'text-gray-900'
                     }`}>Core Components</h3>
                     <ul className={`list-disc list-inside space-y-2 transition-colors ${
                       darkMode ? 'text-gray-300' : 'text-gray-700'
                     }`}>
                <li><strong>Frontend (Next.js 14):</strong> React-based user interface with TypeScript</li>
                <li><strong>API Routes:</strong> Server-side endpoints for transaction processing</li>
                <li><strong>Hedera Mirror Node API:</strong> REST API for Hedera blockchain data</li>
                <li><strong>Sui Client SDK:</strong> Blockchain interaction via @mysten/sui.js</li>
                <li><strong>Blockberry API:</strong> Primary data source for Sui transactions and account information</li>
                <li><strong>Google Gemini API:</strong> AI-powered explanation enhancement</li>
                <li><strong>Tailwind CSS:</strong> Utility-first styling framework</li>
                <li><strong>Mermaid.js:</strong> Diagram rendering for documentation</li>
              </ul>
            </div>
          </div>
        </section>

               {/* Data Source Section */}
               <section id="data-source" className={`rounded-2xl shadow-xl backdrop-blur-sm p-8 mb-8 border scroll-mt-20 transition-all duration-300 ${
                 darkMode 
                   ? 'bg-gray-800/90 border-gray-700/50' 
                   : 'bg-white border-gray-200'
               }`}>
                 <h2 className={`text-3xl font-bold mb-6 flex items-center gap-2 transition-colors ${
                   darkMode ? 'text-white' : 'text-gray-900'
                 }`}>
                   <Database className={`w-8 h-8 transition-colors ${
                     darkMode ? 'text-green-400' : 'text-green-600'
                   }`} />
                   2. Data Source
                 </h2>
                 <div className="space-y-6">
                   <div>
                     <h3 className={`text-xl font-semibold mb-4 transition-colors ${
                       darkMode ? 'text-white' : 'text-gray-900'
                     }`}>Hedera: Mirror Node REST API</h3>
                     <div className={`border rounded-lg p-5 transition-all duration-300 ${
                       darkMode 
                         ? 'bg-green-900/20 border-green-700/50' 
                         : 'bg-green-50 border-green-200'
                     }`}>
                       <div className="space-y-3">
                         <div>
                           <p className={`font-semibold mb-2 transition-colors ${
                             darkMode ? 'text-green-300' : 'text-green-900'
                           }`}>Base URL:</p>
                           <code className={`px-3 py-1 rounded text-sm transition-all duration-300 ${
                             darkMode 
                               ? 'bg-green-900/30 text-green-200' 
                               : 'bg-green-100 text-green-900'
                           }`}>
                             https://mainnet-public.mirrornode.hedera.com
                           </code>
                         </div>
                         <div>
                           <p className={`font-semibold mb-2 transition-colors ${
                             darkMode ? 'text-green-300' : 'text-green-900'
                           }`}>Transaction Endpoint:</p>
                           <code className={`px-3 py-1 rounded text-sm transition-all duration-300 ${
                             darkMode 
                               ? 'bg-green-900/30 text-green-200' 
                               : 'bg-green-100 text-green-900'
                           }`}>
                             /api/v1/transactions/{'{id}'} or ?transactionhash={'{hash}'}
                           </code>
                         </div>
                         <div>
                           <p className={`font-semibold mb-2 transition-colors ${
                             darkMode ? 'text-green-300' : 'text-green-900'
                           }`}>Account Endpoint:</p>
                           <code className={`px-3 py-1 rounded text-sm transition-all duration-300 ${
                             darkMode 
                               ? 'bg-green-900/30 text-green-200' 
                               : 'bg-green-100 text-green-900'
                           }`}>
                             /api/v1/accounts/{'{id}'}
                           </code>
                         </div>
                         <div>
                           <p className={`font-semibold mb-2 transition-colors ${
                             darkMode ? 'text-green-300' : 'text-green-900'
                           }`}>Token Endpoint:</p>
                           <code className={`px-3 py-1 rounded text-sm transition-all duration-300 ${
                             darkMode 
                               ? 'bg-green-900/30 text-green-200' 
                               : 'bg-green-100 text-green-900'
                           }`}>
                             /api/v1/tokens/{'{id}'}
                           </code>
                         </div>
                         <p className={`text-sm transition-colors ${
                           darkMode ? 'text-green-200' : 'text-green-800'
                         }`}>
                           Public REST API for Hedera mainnet. Supports transaction IDs and transaction hashes.
                         </p>
                       </div>
                     </div>
                   </div>

                   <div>
                     <h3 className={`text-xl font-semibold mb-4 transition-colors ${
                       darkMode ? 'text-white' : 'text-gray-900'
                     }`}>Sui: Blockberry API (Primary)</h3>
                     <div className={`border rounded-lg p-5 transition-all duration-300 ${
                       darkMode 
                         ? 'bg-blue-900/20 border-blue-700/50' 
                         : 'bg-blue-50 border-blue-200'
                     }`}>
                       <div className="space-y-3">
                         <div>
                           <p className={`font-semibold mb-2 transition-colors ${
                             darkMode ? 'text-blue-300' : 'text-blue-900'
                           }`}>Endpoint:</p>
                           <code className={`px-3 py-1 rounded text-sm transition-all duration-300 ${
                             darkMode 
                               ? 'bg-blue-900/30 text-blue-200' 
                               : 'bg-blue-100 text-blue-900'
                           }`}>
                      https://api.blockberry.one/sui/v1/raw-transactions/{'{digest}'}
                    </code>
                  </div>
                  <div>
                    <p className={`font-semibold mb-2 transition-colors ${
                      darkMode ? 'text-blue-300' : 'text-blue-900'
                    }`}>Account Names Endpoint:</p>
                    <code className={`px-3 py-1 rounded text-sm transition-all duration-300 ${
                      darkMode 
                        ? 'bg-blue-900/30 text-blue-200' 
                        : 'bg-blue-100 text-blue-900'
                    }`}>
                      https://api.blockberry.one/sui/v1/accounts/{'{address}'}
                    </code>
                  </div>
                  <div>
                    <p className={`font-semibold mb-2 transition-colors ${
                      darkMode ? 'text-blue-300' : 'text-blue-900'
                    }`}>Authentication:</p>
                    <code className={`px-3 py-1 rounded text-sm transition-all duration-300 ${
                      darkMode 
                        ? 'bg-blue-900/30 text-blue-200' 
                        : 'bg-blue-100 text-blue-900'
                    }`}>
                      X-API-Key: (default provided, can override via env)
                    </code>
                  </div>
                  <div>
                    <p className={`font-semibold mb-2 transition-colors ${
                      darkMode ? 'text-blue-300' : 'text-blue-900'
                    }`}>Response Format:</p>
                    <pre className={`p-3 rounded text-xs overflow-x-auto transition-all duration-300 ${
                      darkMode 
                        ? 'bg-blue-900/30 text-blue-200' 
                        : 'bg-blue-100 text-blue-900'
                    }`}>
{`{
  "result": {
    "digest": "...",
    "transaction": {...},
    "effects": {...},
    "objectChanges": [...],
    "balanceChanges": [...],
    "events": [...]
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

                   <div>
                     <h3 className={`text-xl font-semibold mb-4 transition-colors ${
                       darkMode ? 'text-white' : 'text-gray-900'
                     }`}>Sui: RPC (Fallback)</h3>
                     <div className={`border rounded-lg p-5 transition-all duration-300 ${
                       darkMode 
                         ? 'bg-gray-900/50 border-gray-700/50' 
                         : 'bg-gray-50 border-gray-200'
                     }`}>
                       <div className="space-y-3">
                         <div>
                           <p className={`font-semibold mb-2 transition-colors ${
                             darkMode ? 'text-gray-300' : 'text-gray-900'
                           }`}>SDK:</p>
                           <code className={`px-3 py-1 rounded text-sm transition-all duration-300 ${
                             darkMode 
                               ? 'bg-gray-800 text-gray-200' 
                               : 'bg-gray-100 text-gray-900'
                           }`}>
                             @mysten/sui.js
                           </code>
                         </div>
                         <div>
                           <p className={`font-semibold mb-2 transition-colors ${
                             darkMode ? 'text-gray-300' : 'text-gray-900'
                           }`}>RPC Endpoint (Default):</p>
                           <code className={`px-3 py-1 rounded text-sm transition-all duration-300 ${
                             darkMode 
                               ? 'bg-gray-800 text-gray-200' 
                               : 'bg-gray-100 text-gray-900'
                           }`}>
                             https://fullnode.mainnet.sui.io:443
                           </code>
                         </div>
                         <p className={`text-sm transition-colors ${
                           darkMode ? 'text-gray-400' : 'text-gray-600'
                         }`}>
                           Used automatically if Blockberry API fails or is unavailable.
                         </p>
                       </div>
                     </div>
                   </div>

                   <div>
                     <h3 className={`text-xl font-semibold mb-4 transition-colors ${
                       darkMode ? 'text-white' : 'text-gray-900'
                     }`}>AI Enhancement: Google Gemini</h3>
                     <div className={`border rounded-lg p-5 transition-all duration-300 ${
                       darkMode 
                         ? 'bg-purple-900/20 border-purple-700/50' 
                         : 'bg-purple-50 border-purple-200'
                     }`}>
                       <div className="space-y-3">
                         <div>
                           <p className={`font-semibold mb-2 transition-colors ${
                             darkMode ? 'text-purple-300' : 'text-purple-900'
                           }`}>API:</p>
                           <code className={`px-3 py-1 rounded text-sm transition-all duration-300 ${
                             darkMode 
                               ? 'bg-purple-900/30 text-purple-200' 
                               : 'bg-purple-100 text-purple-900'
                           }`}>
                             Google Generative AI (@google/generative-ai)
                           </code>
                         </div>
                         <div>
                           <p className={`font-semibold mb-2 transition-colors ${
                             darkMode ? 'text-purple-300' : 'text-purple-900'
                           }`}>Model Discovery:</p>
                           <p className={`text-sm mb-2 transition-colors ${
                             darkMode ? 'text-purple-200' : 'text-purple-800'
                           }`}>
                             Uses <code className={`px-1 rounded transition-all duration-300 ${
                               darkMode ? 'bg-purple-900/30 text-purple-200' : 'bg-purple-100'
                             }`}>ListModels</code> API to dynamically discover available models:
                           </p>
                           <code className={`px-3 py-1 rounded text-sm block transition-all duration-300 ${
                             darkMode 
                               ? 'bg-purple-900/30 text-purple-200' 
                               : 'bg-purple-100 text-purple-900'
                           }`}>
                             https://generativelanguage.googleapis.com/v1beta/models
                           </code>
                         </div>
                         <div>
                           <p className={`font-semibold mb-2 transition-colors ${
                             darkMode ? 'text-purple-300' : 'text-purple-900'
                           }`}>Supported Models:</p>
                           <ul className={`text-sm list-disc list-inside space-y-1 transition-colors ${
                             darkMode ? 'text-purple-200' : 'text-purple-800'
                           }`}>
                             <li>gemini-1.0-pro</li>
                             <li>gemini-1.5-pro</li>
                             <li>gemini-pro</li>
                             <li>gemini-1.5-flash</li>
                             <li>And others discovered via ListModels</li>
                           </ul>
                         </div>
                         <p className={`text-sm italic transition-colors ${
                           darkMode ? 'text-purple-300' : 'text-purple-700'
                         }`}>
                           The system automatically finds and uses the first available model that supports generateContent.
                         </p>
                       </div>
                     </div>
                   </div>
          </div>
        </section>

               {/* Data Flow Section */}
               <section id="data-flow" className={`rounded-2xl shadow-xl backdrop-blur-sm p-8 mb-8 border scroll-mt-20 transition-all duration-300 ${
                 darkMode 
                   ? 'bg-gray-800/90 border-gray-700/50' 
                   : 'bg-white border-gray-200'
               }`}>
                 <h2 className={`text-3xl font-bold mb-6 flex items-center gap-2 transition-colors ${
                   darkMode ? 'text-white' : 'text-gray-900'
                 }`}>
                   <Code className={`w-8 h-8 transition-colors ${
                     darkMode ? 'text-blue-400' : 'text-blue-600'
                   }`} />
                   3. Data Flow
                 </h2>
                 <div className="space-y-6">
                   <div>
                     <h3 className={`text-xl font-semibold mb-4 transition-colors ${
                       darkMode ? 'text-white' : 'text-gray-900'
                     }`}>Transaction Explanation Process</h3>
                     <p className={`mb-4 transition-colors ${
                       darkMode ? 'text-gray-300' : 'text-gray-700'
                     }`}>
                       This sequence diagram illustrates the end-to-end process of how a transaction digest is transformed into a human-readable explanation.
                     </p>
                     <div className={`rounded-lg p-6 border transition-all duration-300 ${
                       darkMode 
                         ? 'bg-gray-900/50 border-gray-700/50' 
                         : 'bg-gray-50 border-gray-200'
                     }`}>
              <div className="mermaid" id="data-flow-diagram">
{`sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant HederaAPI
    participant Blockberry
    participant SuiRPC
    participant Analysis
    participant Gemini
    
    User->>Frontend: Enter Transaction Digest/Hash
    User->>Frontend: Select Blockchain (Hedera/Sui)
    Frontend->>API: POST /api/explain<br/>{digest, blockchain}
    
    alt Blockchain = Hedera
        API->>HederaAPI: Fetch Transaction<br/>(Mirror Node API)
        HederaAPI-->>API: Transaction Data
        API->>HederaAPI: Fetch Account Names
        HederaAPI-->>API: Account Name Mapping
        API->>HederaAPI: Fetch Token Info
        HederaAPI-->>API: Token Metadata
        API->>Analysis: explainHederaTransaction()
        Analysis->>Analysis: Process HBAR Transfers
        Analysis->>Analysis: Process Token Transfers/Burns
        Analysis->>Analysis: Generate Summary
    else Blockchain = Sui
        API->>Blockberry: Fetch Raw Transaction
        alt Blockberry API Success
            Blockberry-->>API: Transaction Data
        else Blockberry API Fails
            API->>SuiRPC: Fallback: RPC Call
            SuiRPC-->>API: Transaction Data
        end
        API->>Blockberry: Fetch Account Names<br/>(Sender & Receivers)
        Blockberry-->>API: Account Name Mapping
        API->>Analysis: explainTransaction()
        Analysis->>Analysis: Parse Object Changes
        Analysis->>Analysis: Process Balance Changes<br/>(Group by Account)
        Analysis->>Analysis: Extract Move Calls
        Analysis->>Analysis: Calculate Gas Usage
        Analysis->>Analysis: Generate Summary<br/>(with Account Names)
    end
    
    Analysis-->>API: Transaction Explanation
    
    alt AI Enhancement Enabled
        API->>Gemini: ListModels API
        Gemini-->>API: Available Models
        API->>Gemini: enhanceWithAI()
        Gemini-->>API: Enhanced Summary + Insights
    end
    
    API-->>Frontend: Complete Explanation
    Frontend->>User: Display Results
`}
              </div>
            </div>
          </div>
          
                   <div>
                     <h3 className={`text-xl font-semibold mb-4 transition-colors ${
                       darkMode ? 'text-white' : 'text-gray-900'
                     }`}>Balance Change Processing</h3>
                     <p className={`mb-4 transition-colors ${
                       darkMode ? 'text-gray-300' : 'text-gray-700'
                     }`}>
                       This flowchart details how raw balance change data is processed to create a concise, human-readable summary for each involved account.
                     </p>
                     <div className={`rounded-lg p-6 border transition-all duration-300 ${
                       darkMode 
                         ? 'bg-gray-900/50 border-gray-700/50' 
                         : 'bg-gray-50 border-gray-200'
                     }`}>
                       <div className="mermaid" id="balance-processing-diagram">
{`flowchart TD
    A["Raw Balance Changes"] --> B{"Group by Account Address"}
    B --> C["For Each Account"]
    C --> D{"Identify Sent and Received Tokens"}
    D --> E["Format Sent Tokens"]
    D --> F["Format Received Tokens"]
    E --> G["Combine into Account Summary"]
    F --> G
    G --> H["Collect All Account Summaries"]
    H --> I{"Is Transaction a Swap and Single Account?"}
    I -->|Yes| J["Rephrase as Exchanged X for Y"]
    I -->|No| K["Join Account Summaries"]
    J --> L["Add to Overall Transaction Summary"]
    K --> L
    L --> M["Final Human-Readable Summary"]`}
                       </div>
                     </div>
                   </div>
                 </div>
               </section>

               {/* Usage Section */}
               <section id="usage" className={`rounded-2xl shadow-xl backdrop-blur-sm p-8 mb-8 border scroll-mt-20 transition-all duration-300 ${
                 darkMode 
                   ? 'bg-gray-800/90 border-gray-700/50' 
                   : 'bg-white border-gray-200'
               }`}>
                 <h2 className={`text-3xl font-bold mb-6 flex items-center gap-2 transition-colors ${
                   darkMode ? 'text-white' : 'text-gray-900'
                 }`}>
                   <Zap className={`w-8 h-8 transition-colors ${
                     darkMode ? 'text-indigo-400' : 'text-indigo-600'
                   }`} />
                   4. Usage
                 </h2>
                 <div className="space-y-6">
                   <div>
                     <h3 className={`text-xl font-semibold mb-4 transition-colors ${
                       darkMode ? 'text-white' : 'text-gray-900'
                     }`}>Setup & Installation</h3>
                     <div className={`rounded-lg p-4 font-mono text-sm overflow-x-auto transition-all duration-300 ${
                       darkMode 
                         ? 'bg-gray-900 text-green-400' 
                         : 'bg-gray-900 text-green-400'
                     }`}>
                <pre>{`# 1. Install dependencies
npm install

# 2. Configure environment variables (optional)
# Create .env.local file:
GOOGLE_GEMINI_API_KEY=your_gemini_key_here
HEDERA_API_KEY=your_hedera_key_here
BLOCKBERRY_API_KEY=your_blockberry_key_here
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.mainnet.sui.io:443

# 3. Run development server
npm run dev

# 4. Open browser
# Navigate to http://localhost:3000`}</pre>
              </div>
            </div>

                   <div>
                     <h3 className={`text-xl font-semibold mb-4 transition-colors ${
                       darkMode ? 'text-white' : 'text-gray-900'
                     }`}>API Usage</h3>
                     <div className="space-y-4">
                       <div>
                         <h4 className={`font-semibold mb-2 transition-colors ${
                           darkMode ? 'text-gray-200' : 'text-gray-900'
                         }`}>POST /api/explain</h4>
                         <div className={`rounded-lg p-4 font-mono text-sm overflow-x-auto mb-3 transition-all duration-300 ${
                           darkMode 
                             ? 'bg-gray-900 text-green-400' 
                             : 'bg-gray-900 text-green-400'
                         }`}>
                    <pre>{`curl -X POST http://localhost:3000/api/explain \\
  -H "Content-Type: application/json" \\
  -d '{
    "digest": "0.0.123@1234567890.123456789",
    "blockchain": "hedera",
    "useAI": true
  }'`}</pre>
                  </div>
                </div>
                       <div>
                         <h4 className={`font-semibold mb-2 transition-colors ${
                           darkMode ? 'text-gray-200' : 'text-gray-900'
                         }`}>GET /api/explain</h4>
                         <div className={`rounded-lg p-4 font-mono text-sm overflow-x-auto transition-all duration-300 ${
                           darkMode 
                             ? 'bg-gray-900 text-green-400' 
                             : 'bg-gray-900 text-green-400'
                         }`}>
                    <pre>{`curl "http://localhost:3000/api/explain?digest=0.0.123@1234567890.123456789&blockchain=hedera&useAI=true"`}</pre>
                  </div>
                </div>
                       <div className={`border rounded-lg p-4 transition-all duration-300 ${
                         darkMode 
                           ? 'bg-blue-900/20 border-blue-700/50' 
                           : 'bg-blue-50 border-blue-200'
                       }`}>
                         <h4 className={`font-semibold mb-2 transition-colors ${
                           darkMode ? 'text-blue-300' : 'text-blue-900'
                         }`}>Response Example</h4>
                         <pre className={`text-xs overflow-x-auto transition-colors ${
                           darkMode ? 'text-blue-200' : 'text-blue-900'
                         }`}>{`{
  "success": true,
  "digest": "0.0.123@1234567890.123456789",
  "explanation": {
    "summary": "Account Name (0.0.123...) transferred 100 HBAR to 0.0.456...",
    "gasUsed": "0.005 HBAR",
    "totalGasCost": "0.00532509 HBAR",
    "objectsCreated": 0,
    "objectsTransferred": 0,
    "objectsMutated": 5,
    "balanceChanges": [
      {
        "address": "0x123...",
        "accountName": "Account Name",
        "amount": "0.5 HBAR",
        "coinType": "HBAR",
        "change": "decrease"
      }
    ],
    "accountNames": {
      "0x123...": "Account Name"
    },
    "actions": [...],
    "moveCalls": [...],
    "aiEnhanced": true,
    "aiInsights": [...],
    "aiRisks": [...]
  }
}`}</pre>
                </div>
              </div>
            </div>

                   <div>
                     <h3 className={`text-xl font-semibold mb-4 transition-colors ${
                       darkMode ? 'text-white' : 'text-gray-900'
                     }`}>Web Interface</h3>
                     <ol className={`list-decimal list-inside space-y-2 transition-colors ${
                       darkMode ? 'text-gray-300' : 'text-gray-700'
                     }`}>
                <li>Open the application in your browser</li>
                <li>Select your blockchain (Hedera or Sui) using the toggle buttons</li>
                <li>Enter a transaction digest or hash:
                  <ul className={`list-disc list-inside ml-4 mt-2 space-y-1 transition-colors ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <li><strong>Hedera:</strong> Transaction ID (e.g., <code className={`px-1 rounded transition-all duration-300 ${
                      darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100'
                    }`}>0.0.123@1234567890.123456789</code>) or transaction hash</li>
                    <li><strong>Sui:</strong> Transaction digest (e.g., <code className={`px-1 rounded transition-all duration-300 ${
                      darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100'
                    }`}>0x1234...</code>)</li>
                  </ul>
                </li>
                <li>Click "Explain Transaction" or press Enter</li>
                <li>View the human-readable explanation with visualizations</li>
                <li>Use "Explain Another Transaction" to analyze more transactions</li>
                <li>Copy addresses/hashes using the copy icon for investigation</li>
              </ol>
            </div>
          </div>
        </section>

               {/* Footer */}
               <div className={`text-center mt-12 pt-8 border-t transition-colors ${
                 darkMode ? 'border-gray-700' : 'border-gray-200'
               }`}>
                 <p className={`mb-4 transition-colors ${
                   darkMode ? 'text-gray-400' : 'text-gray-600'
                 }`}>
                   Need help? Check the <Link href="/" className={`transition-colors ${
                     darkMode ? 'text-purple-400 hover:text-purple-300 hover:underline' : 'text-blue-600 hover:underline'
                   }`}>main application</Link>.
                 </p>
                 <Link href="/" className={`inline-flex items-center gap-2 transition-colors ${
                   darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                 }`}>
                   <ArrowRight className="w-5 h-5" />
                   <span>Back to App</span>
                 </Link>
               </div>
      </div>
    </div>
  );
}