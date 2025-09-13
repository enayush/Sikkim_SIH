import { getAllMonasteries, Monastery } from './monasteryService';
import { ENV_CONFIG } from './envConfig';

// Simple text similarity function for local RAG
const cosineSimilarity = (a: number[], b: number[]): number => {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
};

// Simple text vectorization (TF-IDF like approach)
const textToVector = (text: string): number[] => {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);

  // Create a simple word frequency vector
  const wordCount: { [key: string]: number } = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  // Convert to a fixed-size vector (using common monastery-related terms)
  const vocabularyTerms = [
    // Monastery names and types
    'monastery', 'gompa', 'temple', 'shrine', 'lhakhang', 'gonpa', 'choling', 'ling',
    // Religious traditions
    'buddhist', 'nyingma', 'kagyu', 'gelug', 'kagyupa', 'nyingmapa', 'karma', 'drukpa',
    // Locations
    'sikkim', 'gangtok', 'north', 'south', 'east', 'west', 'rumtek', 'enchey', 'pemayangtse',
    // Religious figures
    'lama', 'rinpoche', 'tulku', 'guru', 'padmasambhava', 'karmapa', 'dalai',
    // Cultural terms
    'history', 'culture', 'festival', 'chaam', 'dance', 'prayer', 'meditation', 'chorten',
    // Architectural terms
    'architecture', 'ancient', 'sacred', 'holy', 'spiritual', 'tibetan', 'traditional',
    // Time periods
    'founded', 'built', 'century', 'era', 'old', 'oldest', 'new', 'modern',
    // Activities
    'tradition', 'lineage', 'pilgrimage', 'visit', 'booking', 'travel', 'tourism',
    // Significance
    'heritage', 'significance', 'important', 'famous', 'beautiful', 'peaceful'
  ];

  return vocabularyTerms.map(term => wordCount[term] || 0);
};

// Create searchable monastery database
interface MonasterySearchData {
  monastery: Monastery;
  searchVector: number[];
  searchText: string;
  similarity?: number; // Added for search results
}

// Conversation context for intelligent routing
interface ConversationContext {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  currentMonasteries: Monastery[]; // Monasteries mentioned in recent context
  lastQuery: string;
}

let monasteryDatabase: MonasterySearchData[] = [];
let conversationContext: ConversationContext = {
  messages: [],
  currentMonasteries: [],
  lastQuery: ''
};

// Initialize the local RAG database
const initializeRAG = async (): Promise<void> => {
  try {
    const monasteries = await getAllMonasteries();

    monasteryDatabase = monasteries.map(monastery => {
      const searchText = `
        ${monastery.name}
        ${monastery.location}
        ${monastery.description}
        ${monastery.history}
        ${monastery.cultural_significance}
        ${monastery.era}
      `.toLowerCase();

      return {
        monastery,
        searchVector: textToVector(searchText),
        searchText
      };
    });

    console.log(`RAG Database initialized with ${monasteryDatabase.length} monasteries`);
  } catch (error) {
    console.error('Error initializing RAG database:', error);
  }
};

// Search monasteries using local RAG
const searchMonasteries = (query: string, limit: number = 5): MonasterySearchData[] => {
  if (monasteryDatabase.length === 0) {
    console.warn('RAG database not initialized');
    return [];
  }

  const queryLower = query.toLowerCase();
  console.log('🔍 Searching for:', queryLower);

  // Strategy 1: Direct name/location matching (highest priority)
  const directMatches = monasteryDatabase.filter(item =>
    item.monastery.name.toLowerCase().includes(queryLower) ||
    item.monastery.location.toLowerCase().includes(queryLower) ||
    queryLower.includes(item.monastery.name.toLowerCase().split(' ')[0]) // First word of monastery name
  );

  if (directMatches.length > 0) {
    console.log('✅ Found direct matches:', directMatches.length);
    return directMatches.slice(0, limit);
  }

  // Strategy 2: Semantic similarity search
  const queryVector = textToVector(queryLower);
  const results = monasteryDatabase.map(item => ({
    ...item,
    similarity: cosineSimilarity(queryVector, item.searchVector)
  }));

  // Sort by similarity and return top results with much lower threshold
  const semanticResults = results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit * 2) // Get more candidates
    .filter(result => result.similarity > 0.01); // Much lower threshold

  console.log('📊 Top similarity scores:', semanticResults.slice(0, 3).map(r =>
    `${r.monastery.name}: ${r.similarity.toFixed(3)}`
  ));

  if (semanticResults.length > 0) {
    console.log('✅ Found semantic matches:', semanticResults.length);
    return semanticResults.slice(0, limit);
  }

  // Strategy 3: Fallback - return random popular monasteries
  console.log('⚠️ No good matches, returning popular monasteries');
  const popularMonasteries = monasteryDatabase
    .filter(item =>
      item.monastery.name.toLowerCase().includes('rumtek') ||
      item.monastery.name.toLowerCase().includes('enchey') ||
      item.monastery.name.toLowerCase().includes('pemayangtse') ||
      item.monastery.location.toLowerCase().includes('gangtok')
    );

  return popularMonasteries.length > 0 ? popularMonasteries.slice(0, 3) : monasteryDatabase.slice(0, 3);
};

// Intelligent RAG router using Gemini
const analyzeQueryAndRAG = async (
  userQuery: string,
  ragResults: MonasterySearchData[],
  conversationHistory: string
): Promise<{ useRAG: boolean; reasoning: string; contextualResponse?: string }> => {

  const apiKey = ENV_CONFIG.GEMINI?.API_KEY;
  if (!apiKey) {
    // Fallback logic without Gemini analysis
    return {
      useRAG: ragResults.length > 0,
      reasoning: 'No API key - using simple fallback'
    };
  }

  const analysisPrompt = `
You are an intelligent RAG router for a Sikkim monastery chatbot. Analyze if the RAG results are relevant for the user's query.

CONVERSATION HISTORY:
${conversationHistory}

CURRENT USER QUERY: "${userQuery}"

RAG SEARCH RESULTS:
${ragResults.length === 0 ? 'No RAG results found' :
  ragResults.map((r, i) =>
    `${i+1}. ${r.monastery.name} (${r.monastery.location}) - Similarity: ${r.similarity?.toFixed(3) || 'N/A'}`
  ).join('\n')
}

ANALYSIS TASKS:
1. Is this a follow-up question to the previous conversation?
2. Are the RAG results relevant to the user's current query?
3. If it's a follow-up (like "monasteries near this" after discussing Rumtek), should we use conversation context instead of RAG?

Response format (JSON):
{
  "useRAG": boolean,
  "reasoning": "Brief explanation of your decision",
  "isFollowUp": boolean,
  "contextualResponse": "If follow-up and RAG not relevant, provide a response using conversation context"
}

Be strict about RAG relevance. For follow-up questions about "nearby monasteries" or "similar places", prefer using conversation context over potentially irrelevant RAG results.
  `;

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: analysisPrompt }] }],
          generationConfig: {
            temperature: 0.1, // Low temperature for consistent analysis
            maxOutputTokens: 512,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Analysis API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Try to parse JSON response
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        console.log('🧠 Gemini Analysis:', analysis.reasoning);
        return {
          useRAG: analysis.useRAG === true,
          reasoning: analysis.reasoning || 'Analysis completed',
          contextualResponse: analysis.contextualResponse
        };
      }
    } catch (parseError) {
      console.warn('Could not parse analysis JSON, using fallback');
    }

    // Fallback analysis based on text response
    const useRAG = analysisText.toLowerCase().includes('use rag') ||
                   analysisText.toLowerCase().includes('relevant') ||
                   !analysisText.toLowerCase().includes('follow-up');

    return {
      useRAG,
      reasoning: 'Parsed from text analysis',
      contextualResponse: analysisText.includes('contextual') ? analysisText : undefined
    };

  } catch (error) {
    console.error('Analysis error:', error);
    // Smart fallback based on simple heuristics
    const isFollowUp = userQuery.toLowerCase().includes('near') ||
                       userQuery.toLowerCase().includes('similar') ||
                       userQuery.toLowerCase().includes('other') ||
                       userQuery.toLowerCase().includes('also');

    const hasGoodRAGResults = ragResults.length > 0 &&
                              ragResults[0].similarity !== undefined &&
                              ragResults[0].similarity > 0.3;

    return {
      useRAG: (!isFollowUp || hasGoodRAGResults) as boolean,
      reasoning: 'Fallback heuristic analysis'
    };
};

// Build context with RAG results
const buildContextWithRAG = (monasteryResults: MonasterySearchData[], query: string, conversationHistory: string): string => {
  console.log('🏗️ Building RAG context with', monasteryResults.length, 'monasteries');

  const contextData = monasteryResults.map((result, index) => `
MONASTERY ${index + 1}: ${result.monastery.name}
LOCATION: ${result.monastery.location} Sikkim
ERA: ${result.monastery.era}
DESCRIPTION: ${result.monastery.description}
HISTORY: ${result.monastery.history}
CULTURAL SIGNIFICANCE: ${result.monastery.cultural_significance}
COORDINATES: ${result.monastery.latitude}, ${result.monastery.longitude}
  `.trim()).join('\n\n---\n\n');

  return `
CONVERSATION HISTORY:
${conversationHistory}

CURRENT USER QUERY: ${query}

RELEVANT MONASTERY DATA FROM SIKKIM DATABASE:
${contextData}

Instructions:
- Use the specific monastery data above to answer the user's question
- Consider the conversation history for context
- Include details from descriptions, history, and cultural significance
- Be specific about locations, eras, and unique features
- Offer practical information about visiting if relevant
- Be respectful of Buddhist traditions

Provide a detailed, helpful response based primarily on this Sikkim monastery database.
  `.trim();
};

// Build context without RAG (conversation-aware)
const buildContextWithoutRAG = (query: string, conversationHistory: string, currentMonasteries: Monastery[]): string => {
  console.log('🗣️ Building conversation context');

  const monasteryContext = currentMonasteries.length > 0
    ? `\n\nRECENTLY DISCUSSED MONASTERIES:\n${currentMonasteries.map(m =>
        `- ${m.name} (${m.location}, ${m.latitude}, ${m.longitude})`
      ).join('\n')}`
    : '';

  return `
You are Sacred Sikkim Assistant, an expert guide for Sikkim's Buddhist monasteries.

CONVERSATION HISTORY:
${conversationHistory}

CURRENT USER QUERY: ${query}
${monasteryContext}

Instructions:
- This appears to be a follow-up question that doesn't need new monastery data search
- Use the conversation history and any previously mentioned monastery information
- For location-based queries (like "nearby monasteries"), use your knowledge of Sikkim geography
- Provide helpful, contextual responses based on the conversation flow
- Be specific and practical in your suggestions
- Maintain respectful tone regarding Buddhist traditions

Respond naturally as if continuing the conversation.
  `.trim();
};
const callGeminiAPI = async (context: string): Promise<string> => {
  try {
    // Check if Gemini API key is configured
    const apiKey = ENV_CONFIG.GEMINI?.API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return "I'm still setting up my connection to provide detailed responses. For now, I can see you're asking about our monasteries. Please add your GEMINI_API_KEY to the environment configuration to enable full AI responses!";
    }

    console.log('Making Gemini API request...');

    const requestBody = {
      contents: [{
        parts: [{
          text: `You are Sacred Sikkim Assistant, an expert guide for Sikkim's Buddhist monasteries.

${context}

Respond in a helpful, conversational manner. Keep your response under 300 words.`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      }
    };

    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error response:', errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('Gemini response:', JSON.stringify(data, null, 2));

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      console.error('Invalid response format:', data);
      throw new Error('Invalid response format from Gemini API');
    }

  } catch (error) {
    console.error('Gemini API error:', error);
    return "I apologize, but I'm having trouble connecting to my knowledge base right now. Please try again in a moment, or feel free to ask about specific monasteries like Rumtek, Pemayangtse, or Enchey!";
  }
};

// Main chat service function with intelligent routing
export const processChatMessage = async (message: string): Promise<string> => {
  try {
    // Initialize RAG database if not already done
    if (monasteryDatabase.length === 0) {
      await initializeRAG();
    }

    // Add user message to conversation context
    conversationContext.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Always run RAG search first
    console.log('🔍 Running RAG search...');
    const ragResults = searchMonasteries(message, 3);

    // Build conversation history for analysis
    const conversationHistory = conversationContext.messages
      .slice(-6) // Last 6 messages (3 exchanges)
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    // Let Gemini analyze if RAG results are relevant
    console.log('🧠 Analyzing RAG relevance...');
    const analysis = await analyzeQueryAndRAG(message, ragResults, conversationHistory);

    let response: string;

    if (analysis.useRAG && ragResults.length > 0) {
      console.log('✅ Using RAG results:', analysis.reasoning);
      // Use RAG-based response
      const context = buildContextWithRAG(ragResults, message, conversationHistory);
      response = await callGeminiAPI(context);

      // Update current monasteries in context
      conversationContext.currentMonasteries = ragResults.map(r => r.monastery);
    } else if (analysis.contextualResponse) {
      console.log('🔄 Using contextual response:', analysis.reasoning);
      // Use Gemini's contextual response directly
      response = analysis.contextualResponse;
    } else {
      console.log('💭 Using conversation context:', analysis.reasoning);
      // Use conversation-aware response without RAG
      const context = buildContextWithoutRAG(message, conversationHistory, conversationContext.currentMonasteries);
      response = await callGeminiAPI(context);
    }

    // Add assistant response to context
    conversationContext.messages.push({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    });

    // Keep context manageable (last 10 messages)
    if (conversationContext.messages.length > 10) {
      conversationContext.messages = conversationContext.messages.slice(-10);
    }

    conversationContext.lastQuery = message;
    return response;

  } catch (error) {
    console.error('Error processing chat message:', error);
    return "I apologize for the technical difficulty. Let me know what you'd like to learn about Sikkim's monasteries, and I'll do my best to help!";
  }
};

// Export functions for use in other modules
export { initializeRAG };
