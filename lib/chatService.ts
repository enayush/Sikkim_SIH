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
}

let monasteryDatabase: MonasterySearchData[] = [];

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
};// Build context for Gemini API
const buildContext = (monasteryResults: MonasterySearchData[], query: string): string => {
  console.log('🏗️ Building context with', monasteryResults.length, 'monasteries');

  if (monasteryResults.length === 0) {
    // This should rarely happen now with our improved search
    return `
User Query: ${query}

I couldn't find specific monastery data for this query in my database. However, I have information about 100+ monasteries in Sikkim including Rumtek, Enchey, Pemayangtse, and many others.

Please provide a helpful response about Sikkim's Buddhist monasteries and suggest the user ask about specific monastery names or locations.
    `.trim();
  }

  const contextData = monasteryResults.map((result, index) => `
MONASTERY ${index + 1}: ${result.monastery.name}
LOCATION: ${result.monastery.location} Sikkim
ERA: ${result.monastery.era}
DESCRIPTION: ${result.monastery.description}
HISTORY: ${result.monastery.history}
CULTURAL SIGNIFICANCE: ${result.monastery.cultural_significance}
COORDINATES: ${result.monastery.latitude}, ${result.monastery.longitude}
  `.trim()).join('\n\n---\n\n');

  const context = `
User Query: ${query}

RELEVANT MONASTERY DATA FROM SIKKIM DATABASE:
${contextData}

Instructions:
- Use the specific monastery data above to answer the user's question
- Include details from the descriptions, history, and cultural significance
- Be specific about locations, eras, and unique features
- Offer practical information about visiting if relevant
- Be respectful of Buddhist traditions
- If asked about multiple monasteries, provide a comparison

Provide a detailed, helpful response based primarily on this Sikkim monastery database.
  `.trim();

  // Limit context length to avoid token limits but prioritize keeping monastery data
  if (context.length > 4000) {
    // Try to keep at least the first monastery's full information
    const shortenedContextData = monasteryResults.slice(0, 2).map((result, index) => `
MONASTERY ${index + 1}: ${result.monastery.name}
LOCATION: ${result.monastery.location} Sikkim
ERA: ${result.monastery.era}
DESCRIPTION: ${result.monastery.description.substring(0, 150)}...
HISTORY: ${result.monastery.history.substring(0, 150)}...
CULTURAL SIGNIFICANCE: ${result.monastery.cultural_significance.substring(0, 150)}...
    `.trim()).join('\n\n---\n\n');

    return `
User Query: ${query}

RELEVANT MONASTERY DATA FROM SIKKIM DATABASE:
${shortenedContextData}

Use this specific data to provide a helpful response about these Sikkim monasteries.
    `.trim();
  }

  return context;
};

// Call Gemini API with context
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

// Main chat service function
export const processChatMessage = async (message: string): Promise<string> => {
  try {
    // Initialize RAG database if not already done
    if (monasteryDatabase.length === 0) {
      await initializeRAG();
    }

    // Search for relevant monasteries
    const monasteryResults = searchMonasteries(message, 3);

    // Build context for Gemini
    const context = buildContext(monasteryResults, message);

    // Get response from Gemini
    const response = await callGeminiAPI(context);

    return response;

  } catch (error) {
    console.error('Error processing chat message:', error);
    return "I apologize for the technical difficulty. Let me know what you'd like to learn about Sikkim's monasteries, and I'll do my best to help!";
  }
};

// Export the initialization function for manual setup
export { initializeRAG };
