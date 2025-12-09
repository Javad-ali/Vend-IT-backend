import jwt from 'jsonwebtoken';
import { getConfig } from '../config/env.js';
const { jwtAccessSecret, jwtRefreshSecret, accessTokenTtl, refreshTokenTtl } = getConfig();
const accessSecret = jwtAccessSecret;
const refreshSecret = jwtRefreshSecret;
const defaultAccessOptions = {
  expiresIn: accessTokenTtl
};
const defaultRefreshOptions = {
  expiresIn: refreshTokenTtl
};
export const signAccessToken = (payload: any, options: any = {}) => {
  const signOptions = { ...defaultAccessOptions, ...options };
  return jwt.sign(payload, accessSecret, signOptions);
};
export const signRefreshToken = (payload: any, options: any = {}) => {
  const signOptions = { ...defaultRefreshOptions, ...options };
  return jwt.sign(payload, refreshSecret, signOptions);
};
export const verifyAccessToken = (token) => jwt.verify(token, accessSecret);
export const verifyRefreshToken = (token) => jwt.verify(token, refreshSecret);
