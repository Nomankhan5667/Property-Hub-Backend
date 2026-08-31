import jwt from 'jsonwebtoken';

/**
 * Generate a signed JWT token
 * @param {string} userId - MongoDB user _id
 * @param {string} role - User role
 * @returns {string} Signed JWT token
 */
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

export default generateToken;
