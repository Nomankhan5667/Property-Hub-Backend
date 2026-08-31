import User from '../models/User.js';
import Property from '../models/Property.js';
import Inquiry from '../models/Inquiry.js';
import apiResponse from '../utils/apiResponse.js';

/**
 * @desc    Get admin statistics and analytics
 * @route   GET /api/analytics/admin
 * @access  Admin
 */
export const getAdminAnalytics = async (req, res) => {
  // Counters
  const [
    totalUsers,
    totalAgents,
    totalProperties,
    approvedProperties,
    pendingProperties,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'agent' }),
    Property.countDocuments({}),
    Property.countDocuments({ status: 'approved' }),
    Property.countDocuments({ status: 'pending' }),
  ]);

  // Aggregation 1: Properties by Type
  const propertiesByType = await Property.aggregate([
    { $group: { _id: '$propertyType', count: { $sum: 1 } } },
    { $project: { name: '$_id', value: '$count', _id: 0 } },
  ]);

  // Aggregation 2: Properties by City
  const propertiesByCity = await Property.aggregate([
    { $group: { _id: '$location.city', count: { $sum: 1 } } },
    { $project: { city: '$_id', count: '$count', _id: 0 } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  // Aggregation 3: Inquiries by month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const inquiriesHistory = await Inquiry.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Format monthly history
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedInquiries = inquiriesHistory.map((item) => ({
    month: `${months[item._id.month - 1]} ${item._id.year}`,
    inquiries: item.count,
  }));

  // Aggregation 4: User Growth by month (last 6 months)
  const userGrowth = await User.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const formattedUserGrowth = userGrowth.map((item) => ({
    month: `${months[item._id.month - 1]} ${item._id.year}`,
    users: item.count,
  }));

  return apiResponse(
    res,
    200,
    {
      counters: {
        users: totalUsers,
        agents: totalAgents,
        properties: totalProperties,
        approved: approvedProperties,
        pending: pendingProperties,
      },
      charts: {
        propertyTypes: propertiesByType,
        cities: propertiesByCity,
        inquiries: formattedInquiries,
        userGrowth: formattedUserGrowth,
      },
    },
    'Admin dashboard analytics retrieved successfully'
  );
};

/**
 * @desc    Get agent statistics and analytics
 * @route   GET /api/analytics/agent
 * @access  Agent
 */
export const getAgentAnalytics = async (req, res) => {
  const agentId = req.user._id;

  // 1. Total listings
  // 2. Active listings (approved + available)
  // 3. Views count
  const [listings, activeListings, viewsData] = await Promise.all([
    Property.countDocuments({ ownerId: agentId }),
    Property.countDocuments({ ownerId: agentId, status: 'approved', isAvailable: true }),
    Property.aggregate([
      { $match: { ownerId: agentId } },
      { $group: { _id: null, totalViews: { $sum: '$views' } } },
    ]),
  ]);

  const totalViews = viewsData[0] ? viewsData[0].totalViews : 0;

  // 4. Inquiries count
  const inquiryCount = await Inquiry.countDocuments({ agentId });

  // 5. Popular properties (Top 5 based on views)
  const popularProperties = await Property.find({ ownerId: agentId })
    .sort({ views: -1 })
    .limit(5)
    .select('title price location propertyType purpose views status');

  // 6. Inquiries status distribution
  const inquiryStats = await Inquiry.aggregate([
    { $match: { agentId } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { status: '$_id', count: '$count', _id: 0 } },
  ]);

  return apiResponse(
    res,
    200,
    {
      counters: {
        totalListings: listings,
        activeProperties: activeListings,
        propertyViews: totalViews,
        inquiries: inquiryCount,
      },
      popularProperties,
      inquiryStats,
    },
    'Agent dashboard analytics retrieved successfully'
  );
};
