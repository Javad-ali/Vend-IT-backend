import { verifyAccessToken } from '../utils/jwt.js';
import { apiError } from '../utils/response.js';
export const requireAuth = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new apiError(401, 'Authorization header missing');
  }
  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new apiError(401, 'Expired JWT token');
    }
    throw error;
  }
};
