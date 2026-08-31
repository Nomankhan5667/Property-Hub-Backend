import { GoogleGenerativeAI  } from "@google/generative-ai";
import DealerProfile from '../models/DealerProfile.js';
import Property from '../models/Property.js';
import apiResponse from '../utils/apiResponse.js';
import ApiError from '../utils/apiError.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * @desc    Get recommended dealers based on natural language query
 * @route   POST /api/ai/dealers/recommend
 * @access  Public
 */
export const getRecommendedDealers = async (req, res, next) => {
  const { query, budget } = req.body;

  if (!query) {
    return next(new ApiError('Please provide a query for the AI recommendation engine', 400));
  }

  // 1. Fetch some approved dealers from the database to present to the AI model
  const dealers = await DealerProfile.find({ isApproved: true, isSuspended: false })
    .populate('userId', 'name email phone avatar')
    .populate('agencyId')
    .limit(10);

  if (dealers.length === 0) {
    return apiResponse(res, 200, { explanation: 'No verified dealers found on the platform yet.', recommendations: [] });
  }

  // 2. Format dealer list for Gemini context
  const dealersContext = dealers.map((d, index) => ({
    index,
    id: d.userId?._id,
    name: d.userId?.name,
    agency: d.agencyId?.name || 'Independent',
    experience: `${d.experience} Years`,
    city: d.city,
    rating: `${d.rating}★`,
    soldCount: d.soldPropertiesCount,
    happyClients: d.happyClientsCount,
    services: d.services.join(', '),
  }));

  try {
    const prompt = `You are a real estate matching expert for PropertyHub Pakistan.
A user is looking for a property dealer/agent with this query: "${query}" ${budget ? `within a budget of ${budget} PKR.` : ''}

Here is a list of available verified dealers in our platform database:
${JSON.stringify(dealersContext, null, 2)}

Analyze the user query and the dealer profiles. Select the top 2-3 most matching dealers. Provide a JSON response (raw JSON only, no markdown, no code blocks) with this exact structure:
{
  "explanation": "Brief explanation of why these dealers match the requirements.",
  "matches": [
    { "index": number, "matchReason": "Why this dealer is recommended for this specific query." }
  ]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const aiResult = JSON.parse(jsonMatch ? jsonMatch[0] : text);

    // Map AI indices back to actual database dealer documents
    const recommendedDealers = [];
    if (aiResult.matches && Array.isArray(aiResult.matches)) {
      for (const item of aiResult.matches) {
        const d = dealers[item.index];
        if (d) {
          recommendedDealers.push({
            dealer: d,
            matchReason: item.matchReason,
          });
        }
      }
    }

    return apiResponse(res, 200, {
      explanation: aiResult.explanation,
      recommendations: recommendedDealers,
    }, 'Dealers matched successfully');
  } catch (error) {
    console.error('AI Dealer Recommendation Error:', error.message);
    // fallback to top rated
    const fallbacks = dealers.slice(0, 2).map((d) => ({
      dealer: d,
      matchReason: 'Recommended based on high rating and active listings.',
    }));
    return apiResponse(res, 200, {
      explanation: 'Here are some of our top-rated dealers who might help you.',
      recommendations: fallbacks,
    }, 'AI recommendation fallback active');
  }
};

/**
 * @desc    Generate dealer performance score card
 * @route   GET /api/ai/dealers/:id/score
 * @access  Public
 */
export const getDealerScore = async (req, res, next) => {
  const dealerId = req.params.id;

  const profile = await DealerProfile.findOne({ userId: dealerId })
    .populate('userId', 'name');

  if (!profile) {
    return next(new ApiError('Dealer profile not found', 404));
  }

  // Calculate score parameters
  const scoreBase = {
    rating: profile.rating,
    experience: profile.experience,
    soldCount: profile.soldPropertiesCount,
    happyClients: profile.happyClientsCount,
    responseTime: profile.responseTime,
  };

  try {
    const prompt = `Evaluate the performance score of a real estate dealer with these statistics:
- Name: ${profile.userId?.name}
- Average Rating: ${scoreBase.rating} / 5
- Experience: ${scoreBase.experience} Years
- Properties Sold: ${scoreBase.soldCount}
- Happy Clients: ${scoreBase.happyClients}
- Avg. Response Time: ${scoreBase.responseTime}

Calculate a performance score from 0 to 100. Deliver a raw JSON response (no markdown, no code blocks) with this exact structure:
{
  "score": number,
  "verdict": "e.g., Elite Performer, Trusted, Rising Star",
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const scoreData = JSON.parse(jsonMatch ? jsonMatch[0] : text);

    return apiResponse(res, 200, scoreData, 'Dealer performance score calculated');
  } catch (error) {
    console.error('AI Dealer Score Error:', error.message);
    // fallback calculations
    const score = Math.min(100, Math.round((profile.rating / 5) * 60 + Math.min(40, profile.experience * 4)));
    return apiResponse(res, 200, {
      score,
      verdict: score >= 85 ? 'Elite Performer' : score >= 70 ? 'Trusted Professional' : 'Verified Agent',
      strengths: ['Verified identity checks passed', 'Responsive communications'],
      improvements: ['Complete more transactions to boost rank'],
    }, 'Calculated score card');
  }
};
