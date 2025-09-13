import { supabase } from './supabase';
import { getAllMonasteries, Monastery } from './monasteryService';
import { ENV_CONFIG } from './envConfig';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

// Simple response cache to avoid repeated API calls
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to get cache key from message and context
const getCacheKey = (message: string, lastMessages: Message[]): string => {
  const contextText = lastMessages.slice(-3).map(m => m.text).join(' ');
  return `${message.toLowerCase().trim()}_${contextText.slice(0, 100)}`;
};

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

    // --- DEBUGGING: Log the API Key ---
    console.log('🔑 Using Gemini API Key:', apiKey ? `...${apiKey.slice(-4)}` : 'Not Found!');

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.error('❌ Gemini API Key is missing or is still the placeholder value.');
      return "I'm still setting up my connection. The Gemini API Key is missing. Please add it to your .env file to enable full AI responses!";
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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API Error:', response.status, errorText);

      if (response.status === 400) {
        return `API Error: Bad request. This might be due to an invalid API key or a problem with the request format. Please check the console logs.`;
      }
      if (response.status === 429) {
        return `API Error: You have exceeded your API quota. Please check your Google Cloud billing account or wait before trying again.`;
      }
      if (response.status === 503 || response.status === 500) {
        return `API Error: The model is currently overloaded or unavailable. Please try again in a few moments.`;
      }

      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      console.error('Invalid response format:', data);
      throw new Error('Invalid response format from Gemini API');
    }

  } catch (error) {
    console.error('Gemini API error:', error);
    return "I apologize, but I'm having trouble connecting to my knowledge base right now. Please try again in a moment.";
  }
};

// --- Chat History Storage Functions ---

/**
 * Get or create a conversation for the current user.
 * @returns The conversation ID.
 */
export const getOrCreateConversation = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Check for an existing recent conversation
  let { data: conversation, error } = await supabase
    .from('chat_conversations')
    .select('id')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching conversation:', error);
    return null;
  }

  if (conversation && conversation.length > 0) {
    return conversation[0].id;
  } else {
    // Create a new conversation
    let { data: newConversation, error: insertError } = await supabase
      .from('chat_conversations')
      .insert({ user_id: user.id })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating conversation:', insertError);
      return null;
    }
    return newConversation?.id || null;
  }
};

/**
 * Fetches all conversations for the current user.
 * @returns An array of conversations.
 */
export const getAllConversations = async (): Promise<{ id: string; summary: string | null; updated_at: string; }[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('chat_conversations')
    .select('id, summary, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching all conversations:', error);
    return [];
  }
  return data || [];
};

/**
 * Fetches the chat history for a given conversation.
 * @param conversationId The ID of the conversation.
 * @returns An array of messages.
 */
export const getChatHistory = async (conversationId: string): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, text, sender, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }

  return data.map(msg => ({
    id: msg.id,
    text: msg.text,
    isUser: msg.sender === 'user',
    timestamp: new Date(msg.created_at),
  }));
};

/**
 * Saves a message to the database.
 * @param conversationId The ID of the conversation.
 * @param message The message object to save.
 */
export const saveMessage = async (conversationId: string, message: Message): Promise<void> => {
  const { error } = await supabase.from('chat_messages').insert({
    conversation_id: conversationId,
    sender: message.isUser ? 'user' : 'bot',
    text: message.text,
  });

  if (error) {
    console.error('Error saving message:', error);
  }

  // Also update the conversation's updated_at timestamp
  const { error: updateError } = await supabase
    .from('chat_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  if (updateError) {
    console.error('Error updating conversation timestamp:', updateError);
  }
};

// --- Main Chat Logic ---

// Main chat service function
export const processChatMessage = async (message: string, conversationHistory: Message[] = []): Promise<string> => {
  try {
    // Check cache first
    const cacheKey = getCacheKey(message, conversationHistory);
    const cachedResponse = responseCache.get(cacheKey);

    if (cachedResponse && (Date.now() - cachedResponse.timestamp) < CACHE_DURATION) {
      console.log('🎯 Returning cached response for:', message.slice(0, 50));
      return cachedResponse.response;
    }

    // Initialize RAG database if not already done
    if (monasteryDatabase.length === 0) {
      await initializeRAG();
    }

    // Search for relevant monasteries based on the new message
    const monasteryResults = searchMonasteries(message, 3);

    // Build the intelligent context for Gemini
    const context = buildIntelligentContext(message, conversationHistory, monasteryResults);

    // Get response from Gemini
    const response = await callGeminiAPI(context);

    // Get or create the conversation ID
    const conversationId = await getOrCreateConversation();
    if (conversationId) {
      // Save the user message
      await saveMessage(conversationId, {
        id: crypto.randomUUID(),
        text: message,
        isUser: true,
        timestamp: new Date(),
      });

      // Save the bot response
      await saveMessage(conversationId, {
        id: crypto.randomUUID(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      });
    }

    // Cache the response for future identical queries
    responseCache.set(cacheKey, {
      response: response,
      timestamp: Date.now()
    });

    // Clean up old cache entries (simple cleanup)
    if (responseCache.size > 50) {
      const oldestKey = responseCache.keys().next().value;
      if (oldestKey) {
        responseCache.delete(oldestKey);
      }
    }

    return response;

  } catch (error) {
    console.error('Error processing chat message:', error);
    return "I apologize for the technical difficulty. Let me know what you'd like to learn about Sikkim's monasteries, and I'll do my best to help!";
  }
};

// New function to build the intelligent, context-aware prompt
const buildIntelligentContext = (
  currentQuery: string,
  conversationHistory: Message[],
  ragResults: MonasterySearchData[]
): string => {
  console.log('🧠 Building intelligent context...');

  // Get the last user message and bot response from history
  const lastUserMessage = conversationHistory.find(m => m.isUser)?.text || 'N/A';
  const lastBotResponse = conversationHistory.find(m => !m.isUser && !m.isTyping)?.text || 'N/A';

  const ragContext = ragResults.length > 0
    ? `
Monastery Database Search Results (for the current question):
${ragResults.map((result, index) => `
  Result ${index + 1}: ${result.monastery.name} (Similarity: ${cosineSimilarity(textToVector(currentQuery), result.searchVector).toFixed(2)})
  Location: ${result.monastery.location}
  Description: ${result.monastery.description.substring(0, 100)}...
`).join('\n')}
`
    : 'Monastery Database Search Results: No relevant monasteries found for the current query.';

  const prompt = `
You are Sacred Sikkim Assistant, a conversational AI expert on Sikkim's monasteries. Your task is to analyze a user's query and decide how to respond based on conversation history and database search results.

**Previous Conversation Turn:**
- Last User Question: "${lastUserMessage}"
- Your Last Response: "${lastBotResponse}"

---

**Current User Question:** "${currentQuery}"

---

${ragContext}

---

**Your Task (Instructions):**

1.  **Analyze the Current Question:** Is it a follow-up to the previous conversation (e.g., asking for more details, directions, or nearby places)?
2.  **Evaluate the Search Results:** Are the search results relevant to the *current user question*? Consider the similarity scores. A score > 0.2 is likely relevant.
3.  **Decide and Respond:**
    *   **IF** the question is a clear follow-up (e.g., "what's near there?") AND the search results are **NOT relevant** (low similarity), then **IGNORE the new search results**. Answer the follow-up question using the context from the **previous conversation** and your own knowledge.
    *   **ELSE (if the question is new OR the search results are relevant)**, then **USE the provided search results** to construct your answer. Refer to the monastery names and details from the search results.

Provide your helpful, concise, and friendly response below.
  `;

  return prompt;
};

// Export the initialization function for manual setup
export { initializeRAG };
