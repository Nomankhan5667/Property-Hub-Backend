import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Get AI-powered property recommendations based on user query
 * @param {string} query - User's natural language query
 * @returns {Object} Recommendations object
 */
export const getPropertyRecommendations = async (query) => {
  try {
    const prompt = `You are a real estate expert AI for PropertyHub, a Pakistan-based property marketplace.
    
A user is looking for properties with this query: "${query}"

Analyze their requirements and respond with a valid JSON object (no markdown, no code blocks, just raw JSON) with this exact structure:
{
  "similarProperties": [
    { "type": "string", "description": "string", "estimatedPrice": "string", "location": "string", "bedrooms": number }
  ],
  "betterAlternatives": [
    { "suggestion": "string", "reason": "string", "potentialSaving": "string" }
  ],
  "recommendedLocations": [
    { "city": "string", "area": "string", "reason": "string", "avgPrice": "string" }
  ],
  "explanation": "string"
}

Keep recommendations relevant to Pakistan's real estate market. Be specific and helpful.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (error) {
    console.error('AI Recommendations Error:', error.message);
    return {
      similarProperties: [],
      betterAlternatives: [],
      recommendedLocations: [],
      explanation: 'I was unable to generate specific recommendations at this time. Please try refining your search query.',
    };
  }
};

/**
 * Generate a professional property description using AI
 * @param {Object} details - Property details
 * @returns {string} Generated description
 */
export const generatePropertyDescription = async ({ propertyType, bedrooms, location, area }) => {
  try {
    const prompt = `You are a professional real estate copywriter specializing in Pakistan's property market.

Generate a compelling, professional property description for:
- Property Type: ${propertyType}
- Bedrooms: ${bedrooms}
- Location: ${location}
- Area: ${area} square feet

Write a 3-4 paragraph description that:
1. Opens with an attention-grabbing headline sentence
2. Highlights the property's key features and benefits
3. Describes the neighborhood and lifestyle
4. Ends with a compelling call to action

Keep it under 300 words. Write in a professional yet warm tone. Do not use placeholder brackets or generic filler text.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('AI Description Generation Error:', error.message);
    return `This stunning ${bedrooms}-bedroom ${propertyType} in ${location} offers ${area} sq ft of beautifully designed living space. 
    
The property features modern amenities and thoughtful design throughout, perfect for families seeking comfort and convenience in one of the most desirable locations.

Located in the heart of ${location}, residents enjoy easy access to schools, shopping centers, healthcare facilities, and major transportation routes.

Contact us today to schedule a viewing and make this exceptional property your new home.`;
  }
};

/**
 * Chat with AI real estate assistant
 * @param {string} message - Current user message
 * @param {Array} history - Previous conversation history [{role, content}]
 * @returns {string} AI response
 */
export const chatWithAssistant = async (message, history = []) => {
  try {
    const systemContext = `You are PropertyHub Assistant, a friendly and knowledgeable AI assistant specializing in Pakistan's real estate market. 
You help users with:
- Property buying, selling, and renting advice
- Information about Pakistani cities and neighborhoods (Karachi, Lahore, Islamabad, Rawalpindi, Peshawar, Quetta, etc.)
- Property valuation and market trends
- Legal aspects of property transactions in Pakistan
- Mortgage and financing information
- Property investment advice

Be helpful, concise, and professional. If asked about specific properties, suggest the user browse PropertyHub listings.`;

    // Build conversation history for context
    const conversationHistory = history
      .slice(-10) // Keep last 10 messages for context
      .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
      .join('\n');

    const fullPrompt = `${systemContext}

${conversationHistory ? `Previous conversation:\n${conversationHistory}\n` : ''}
User: ${message}
Assistant:`;

    const result = await model.generateContent(fullPrompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('AI Chat Error:', error.message);
    return "I'm sorry, I'm having trouble connecting right now. Please try again in a moment. In the meantime, feel free to browse our property listings or contact our support team.";
  }
};
