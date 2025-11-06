import { GoogleGenerativeAI } from '@google/generative-ai';
import type { TransactionExplanation } from './sui-client';

function shortAddress(address: string): string {
  if (!address) return 'Unknown';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

// Initialize Gemini AI (free tier available)
// Default API key - can be overridden by environment variable GOOGLE_GEMINI_API_KEY
const DEFAULT_GEMINI_API_KEY = 'AIzaSyC8j3MvpkkI4l3tBMzIAkMRfe6Hw-OiNZY';

// Get Gemini API key from environment or use default
const getGenAIKey = (): string => {
  // In Next.js, environment variables are automatically loaded from .env, .env.local, etc.
  // GOOGLE_GEMINI_API_KEY from either file will be available as process.env.GOOGLE_GEMINI_API_KEY
  // Priority: Environment variable > Default key
  // Note: For production, set GOOGLE_GEMINI_API_KEY in Netlify environment variables
  return process.env.GOOGLE_GEMINI_API_KEY || DEFAULT_GEMINI_API_KEY;
};

// Cache for available models (to avoid repeated API calls)
let availableModelsCache: string[] | null = null;
let modelsCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Discovers available Gemini models using ListModels API
 */
async function getAvailableModels(genAI: GoogleGenerativeAI): Promise<string[]> {
  const now = Date.now();
  
  // Return cached models if still valid
  if (availableModelsCache && (now - modelsCacheTime) < CACHE_DURATION) {
    return availableModelsCache;
  }

  try {
    // Use the REST API to list models
    const apiKey = getGenAIKey();
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (!response.ok) {
      console.warn('Failed to list models, using fallback list');
      return ['gemini-1.0-pro', 'gemini-pro', 'gemini-1.5-pro'];
    }

    const data = await response.json();
    const models = data.models || [];
    
    // Filter models that support generateContent and extract model names
    const availableModels = models
      .filter((model: any) => {
        const supportedMethods = model.supportedGenerationMethods || [];
        return supportedMethods.includes('generateContent');
      })
      .map((model: any) => {
        // Extract model name (remove 'models/' prefix if present)
        const name = model.name || '';
        return name.replace('models/', '');
      })
      .filter((name: string) => name.startsWith('gemini'));

    // Cache the results
    const finalModels = availableModels.length > 0 ? availableModels : ['gemini-1.0-pro', 'gemini-pro'];
    availableModelsCache = finalModels;
    modelsCacheTime = now;

    console.log(`✓ Discovered ${availableModels.length} available Gemini models:`, availableModels);
    return finalModels;
  } catch (error) {
    console.warn('Error listing models, using fallback:', error);
    // Fallback to known models
    availableModelsCache = ['gemini-1.0-pro', 'gemini-pro', 'gemini-1.5-pro'];
    modelsCacheTime = now;
    return availableModelsCache;
  }
}

/**
 * Finds and uses the first available Gemini model
 */
async function findWorkingModel(genAI: GoogleGenerativeAI): Promise<string | null> {
  try {
    const availableModels = await getAvailableModels(genAI);
    
    // Try models in order of preference
    const preferredOrder = [
      'gemini-1.0-pro',
      'gemini-1.5-pro',
      'gemini-pro',
      'gemini-1.5-flash',
      'gemini-1.0-pro-latest',
    ];

    // Sort available models by preference
    const sortedModels = preferredOrder.filter(m => availableModels.includes(m));
    const remainingModels = availableModels.filter(m => !preferredOrder.includes(m));
    const modelsToTry = [...sortedModels, ...remainingModels];

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        // Test with a simple prompt
        const result = await model.generateContent('test');
        await result.response;
        console.log(`✓ Found working model: ${modelName}`);
        return modelName;
      } catch (err: any) {
        // Continue to next model
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding working model:', error);
    return null;
  }
}


/**
 * Enhances transaction explanation using Google Gemini AI
 */
export async function enhanceWithAI(
  explanation: TransactionExplanation,
  rawTransaction: any
): Promise<string> {
  const apiKey = getGenAIKey();
  
  // If no API key, return the original summary
  if (!apiKey) {
    return explanation.summary;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Extract account names for AI context
    const accountContext: string[] = [];
    if (explanation.accountNames && explanation.involvedAddresses) {
      for (const addr of explanation.involvedAddresses.slice(0, 10)) {
        const name = explanation.accountNames.get(addr);
        if (name) {
          accountContext.push(`${name} (${addr})`);
        } else {
          accountContext.push(`${shortAddress(addr)}`);
        }
      }
    }

    const prompt = `You are a helpful blockchain transaction analyst for Aletheions. Explain this blockchain transaction in simple, friendly language that anyone can understand - like explaining to a friend who isn't technical.

CRITICAL RULES - FOLLOW THESE EXACTLY:
1. ALWAYS start with "Hey Aletheions! This was..."
2. NEVER use "someone", "someone's address", "let's call them", or any vague references
3. ALWAYS use the EXACT account names or addresses provided in the Transaction Data below
4. If you see "AccountName (0x1234...)" format, use "AccountName" in your explanation
5. If you see just "0x1234...5678 (account name not available)", use the address "0x1234...5678" directly
6. NEVER make up names or use placeholder text - use what's actually in the transaction data

Transaction Data (use EXACT names/addresses from here):
${explanation.summary}

Account Information Available:
${accountContext.length > 0 ? accountContext.join('\n') : 'No account names available - use addresses directly from transaction data'}

Example of CORRECT usage:
- If transaction shows "Staketab x Suiscan (0xc5ae...3817)", say "Staketab x Suiscan" or "Staketab x Suiscan (0xc5ae...3817)"
- If transaction shows "0xc5ae...3817 (account name not available)", say "0xc5ae...3817" - NOT "someone"

Example of WRONG usage:
- ❌ "Someone, let's call them 0xc5ae...3817"
- ❌ "someone's address"
- ❌ "an address"

Technical Details (for context):
- Gas Used: ${explanation.totalGasCost}
- Objects Created: ${explanation.objectsCreated}
- Objects Transferred: ${explanation.objectsTransferred}
- Objects Mutated: ${explanation.objectsMutated}
${explanation.moveCalls.length > 0 ? `- Functions Called: ${explanation.moveCalls.map(c => `${c.module}::${c.function}`).slice(0, 5).join(', ')}${explanation.moveCalls.length > 5 ? ' and more' : ''}` : ''}

Specific Actions:
${explanation.actions.slice(0, 10).map((a, i) => `${i + 1}. ${a.description}`).join('\n')}
${explanation.actions.length > 10 ? `\n... and ${explanation.actions.length - 10} more actions` : ''}

Your task: Write a clear, natural explanation (2-4 sentences) that:
1. Explains what TYPE of transaction this is (e.g., "This was a token swap", "This transferred tokens", "This created new objects")
2. Describes what happened in simple terms (avoid technical jargon like "mutated", "Move calls", etc.)
3. Mentions amounts and participants if relevant
4. Use friendly, conversational language - like explaining to a friend

Example good explanations:
- "This transaction swapped tokens through a DEX aggregator, exchanging multiple tokens across different liquidity pools."
- "This transaction transferred 100 HBAR tokens from one address to another."
- "This transaction created 2 new NFT objects and transferred them to a recipient."

Now write the explanation for this transaction:`;

    // Find and use available model dynamically
    const workingModel = await findWorkingModel(genAI);
    
    if (!workingModel) {
      console.warn('No working Gemini model found, using default summary');
      return explanation.summary;
    }

    try {
      const model = genAI.getGenerativeModel({ model: workingModel });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const enhancedSummary = response.text();
      
      if (enhancedSummary) {
        console.log(`✓ Successfully enhanced with model: ${workingModel}`);
        return enhancedSummary;
      }
      
      // If no summary generated, return default
      return explanation.summary;
    } catch (err: any) {
      console.error(`Error using model ${workingModel}:`, err);
      // Fallback to default summary
      return explanation.summary;
    }
  } catch (error) {
    console.error('GenAI enhancement failed:', error);
    // Fallback to original summary if AI fails
    return explanation.summary;
  }
}

/**
 * Generates a detailed explanation using AI
 */
export async function generateDetailedExplanation(
  explanation: TransactionExplanation,
  rawTransaction: any
): Promise<{
  summary: string;
  insights: string[];
  risks: string[];
}> {
  const apiKey = getGenAIKey();
  
  if (!apiKey) {
    return {
      summary: explanation.summary,
      insights: [],
      risks: [],
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const prompt = `Analyze this Hedera blockchain transaction and provide:

1. A clear summary (2-3 sentences)
2. Key insights (bullet points)
3. Potential risks or concerns (if any)

Transaction Data:
- Summary: ${explanation.summary}
- Gas: ${explanation.totalGasCost}
- Objects Created: ${explanation.objectsCreated}
- Objects Transferred: ${explanation.objectsTransferred}
- Move Calls: ${explanation.moveCalls.map(c => `${c.package}::${c.module}::${c.function}`).join(', ') || 'None'}

Respond in JSON format:
{
  "summary": "clear explanation",
  "insights": ["insight 1", "insight 2"],
  "risks": ["risk 1 if any", "risk 2 if any"]
}`;

    // Find and use available model dynamically
    const workingModel = await findWorkingModel(genAI);
    
    if (!workingModel) {
      console.warn('No working Gemini model found for detailed analysis');
      return {
        summary: explanation.summary,
        insights: [],
        risks: [],
      };
    }

    let text = '';
    try {
      const model = genAI.getGenerativeModel({ model: workingModel });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      text = response.text();
    } catch (err: any) {
      console.error(`Error using model ${workingModel} for detailed analysis:`, err);
      return {
        summary: explanation.summary,
        insights: [],
        risks: [],
      };
    }
    
    if (!text) {
      return {
        summary: explanation.summary,
        insights: [],
        risks: [],
      };
    }
    
    // Try to parse JSON response
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || explanation.summary,
          insights: parsed.insights || [],
          risks: parsed.risks || [],
        };
      }
    } catch (e) {
      // If JSON parsing fails, extract insights from text
    }

    return {
      summary: text || explanation.summary,
      insights: [],
      risks: [],
    };
  } catch (error) {
    console.error('GenAI detailed analysis failed:', error);
    return {
      summary: explanation.summary,
      insights: [],
      risks: [],
    };
  }
}
