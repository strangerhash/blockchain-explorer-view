import { NextRequest, NextResponse } from 'next/server';
import { fetchTransaction, explainTransaction } from '@/lib/sui-client';
import { fetchHederaTransaction, explainHederaTransaction } from '@/lib/hedera-client';
import { enhanceWithAI, generateDetailedExplanation } from '@/lib/genai-service';
import type { Blockchain } from '@/lib/hedera-client';

// CORS headers for API routes
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { digest, useAI = true, blockchain = 'hedera' } = body;

    if (!digest) {
      return NextResponse.json(
        { error: 'Transaction digest is required' },
        { 
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Fetch transaction based on blockchain selection
    let transaction: any;
    let explanation: any;
    
    if (blockchain === 'hedera') {
      transaction = await fetchHederaTransaction(digest);
      explanation = await explainHederaTransaction(transaction);
    } else {
      transaction = await fetchTransaction(digest);
      explanation = await explainTransaction(transaction);
    }

    // Enhance with AI if enabled and API key is available
    let enhancedSummary = explanation.summary;
    let aiInsights: string[] = [];
    let aiRisks: string[] = [];
    let aiEnhanced = false;
    let aiStatus: 'enabled' | 'disabled' | 'timeout' | 'error' | 'no_key' = 'disabled';
    let aiStatusMessage = '';

    // Check for API key (from env or default)
    const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY || '';
    
    if (useAI && geminiApiKey) {
      aiStatus = 'enabled';
      try {
        // Use Promise.race to timeout AI enhancement after 20 seconds
        const aiTimeout = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('AI enhancement timeout')), 20000)
        );
        
        const aiEnhancement = Promise.all([
          enhanceWithAI(explanation, transaction),
          generateDetailedExplanation(explanation, transaction),
        ]);
        
        const result = await Promise.race([aiEnhancement, aiTimeout]);
        if (result && Array.isArray(result) && result.length === 2) {
          enhancedSummary = result[0];
          aiInsights = result[1].insights;
          aiRisks = result[1].risks;
          aiEnhanced = true;
          aiStatus = 'enabled';
          aiStatusMessage = 'AI enhancement successful';
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('AI enhancement failed or timed out, using default explanation:', error);
        
        if (errorMessage.includes('timeout')) {
          aiStatus = 'timeout';
          aiStatusMessage = 'AI enhancement timed out (request took too long). Using default explanation.';
        } else {
          aiStatus = 'error';
          aiStatusMessage = `AI enhancement failed: ${errorMessage}. Using default explanation.`;
        }
        // Continue with default summary
      }
    } else if (useAI && !geminiApiKey) {
      aiStatus = 'no_key';
      aiStatusMessage = 'AI enhancement disabled: No API key configured. Using default explanation.';
    } else {
      aiStatus = 'disabled';
      aiStatusMessage = 'AI enhancement disabled by user. Using default explanation.';
    }

    // Convert Map to object for JSON serialization
    const accountNamesObj: Record<string, string> = {};
    if (explanation.accountNames) {
      if (explanation.accountNames instanceof Map) {
        explanation.accountNames.forEach((value: string, key: string) => {
          accountNamesObj[key] = value;
        });
      } else if (typeof explanation.accountNames === 'object') {
        Object.assign(accountNamesObj, explanation.accountNames);
      }
    }

    // Serialize rawTransaction safely - remove non-serializable objects
    let serializableTransaction: any = null;
    try {
      // Use JSON.parse/stringify to ensure it's fully serializable
      serializableTransaction = JSON.parse(JSON.stringify(transaction, (key, value) => {
        // Skip functions, undefined, and symbols
        if (typeof value === 'function' || value === undefined || typeof value === 'symbol') {
          return null;
        }
        // Convert Map to object
        if (value instanceof Map) {
          return Object.fromEntries(value);
        }
        // Convert Set to array
        if (value instanceof Set) {
          return Array.from(value);
        }
        return value;
      }));
    } catch (serializeError) {
      console.warn('Failed to serialize rawTransaction, omitting it:', serializeError);
      // Don't include rawTransaction if it can't be serialized
      serializableTransaction = null;
    }

    return NextResponse.json({
      success: true,
      digest,
      explanation: {
        ...explanation,
        summary: enhancedSummary,
        aiEnhanced,
        aiInsights,
        aiRisks,
        accountNames: accountNamesObj, // Convert Map to object
        aiStatus, // Status: 'enabled' | 'disabled' | 'timeout' | 'error' | 'no_key'
        aiStatusMessage, // Human-readable status message
      },
      ...(serializableTransaction && { rawTransaction: serializableTransaction }),
    }, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Error explaining transaction:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to explain transaction',
      },
      { 
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const digest = searchParams.get('digest');
  const useAI = searchParams.get('useAI') !== 'false';
  const blockchain = (searchParams.get('blockchain') || 'hedera') as Blockchain;

  if (!digest) {
    return NextResponse.json(
      { error: 'Transaction digest is required as query parameter' },
      { 
        status: 400,
        headers: corsHeaders,
      }
    );
  }

  try {
    // Fetch transaction based on blockchain selection
    let transaction: any;
    let explanation: any;
    
    if (blockchain === 'hedera') {
      transaction = await fetchHederaTransaction(digest);
      explanation = await explainHederaTransaction(transaction);
    } else {
      transaction = await fetchTransaction(digest);
      explanation = await explainTransaction(transaction);
    }

    // Enhance with AI if enabled
    let enhancedSummary = explanation.summary;
    let aiInsights: string[] = [];
    let aiRisks: string[] = [];
    let aiEnhanced = false;
    let aiStatus: 'enabled' | 'disabled' | 'timeout' | 'error' | 'no_key' = 'disabled';
    let aiStatusMessage = '';

    // Check for API key (from env or default)
    const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY || '';
    
    if (useAI && geminiApiKey) {
      aiStatus = 'enabled';
      try {
        // Use Promise.race to timeout AI enhancement after 20 seconds
        const aiTimeout = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('AI enhancement timeout')), 20000)
        );
        
        const aiEnhancement = Promise.all([
          enhanceWithAI(explanation, transaction),
          generateDetailedExplanation(explanation, transaction),
        ]);
        
        const result = await Promise.race([aiEnhancement, aiTimeout]);
        if (result && Array.isArray(result) && result.length === 2) {
          enhancedSummary = result[0];
          aiInsights = result[1].insights;
          aiRisks = result[1].risks;
          aiEnhanced = true;
          aiStatus = 'enabled';
          aiStatusMessage = 'AI enhancement successful';
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('AI enhancement failed or timed out, using default explanation:', error);
        
        if (errorMessage.includes('timeout')) {
          aiStatus = 'timeout';
          aiStatusMessage = 'AI enhancement timed out (request took too long). Using default explanation.';
        } else {
          aiStatus = 'error';
          aiStatusMessage = `AI enhancement failed: ${errorMessage}. Using default explanation.`;
        }
        // Continue with default summary
      }
    } else if (useAI && !geminiApiKey) {
      aiStatus = 'no_key';
      aiStatusMessage = 'AI enhancement disabled: No API key configured. Using default explanation.';
    } else {
      aiStatus = 'disabled';
      aiStatusMessage = 'AI enhancement disabled by user. Using default explanation.';
    }

    // Convert Map to object for JSON serialization
    const accountNamesObj: Record<string, string> = {};
    if (explanation.accountNames) {
      if (explanation.accountNames instanceof Map) {
        explanation.accountNames.forEach((value: string, key: string) => {
          accountNamesObj[key] = value;
        });
      } else if (typeof explanation.accountNames === 'object') {
        Object.assign(accountNamesObj, explanation.accountNames);
      }
    }

    // Serialize rawTransaction safely - remove non-serializable objects
    let serializableTransaction: any = null;
    try {
      // Use JSON.parse/stringify to ensure it's fully serializable
      serializableTransaction = JSON.parse(JSON.stringify(transaction, (key, value) => {
        // Skip functions, undefined, and symbols
        if (typeof value === 'function' || value === undefined || typeof value === 'symbol') {
          return null;
        }
        // Convert Map to object
        if (value instanceof Map) {
          return Object.fromEntries(value);
        }
        // Convert Set to array
        if (value instanceof Set) {
          return Array.from(value);
        }
        return value;
      }));
    } catch (serializeError) {
      console.warn('Failed to serialize rawTransaction, omitting it:', serializeError);
      // Don't include rawTransaction if it can't be serialized
      serializableTransaction = null;
    }

    return NextResponse.json({
      success: true,
      digest,
      explanation: {
        ...explanation,
        summary: enhancedSummary,
        aiEnhanced,
        aiInsights,
        aiRisks,
        accountNames: accountNamesObj, // Convert Map to object
        aiStatus, // Status: 'enabled' | 'disabled' | 'timeout' | 'error' | 'no_key'
        aiStatusMessage, // Human-readable status message
      },
      ...(serializableTransaction && { rawTransaction: serializableTransaction }),
    }, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Error explaining transaction:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to explain transaction',
      },
      { 
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
