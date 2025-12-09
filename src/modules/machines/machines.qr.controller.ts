import { createHmac } from 'node:crypto';
import {
  generateMachineQr,
  handleSilkronWebhook as processSilkronWebhook,
  handleTapWebhook as processTapWebhook
} from './machines.qr.service.js';
import { getConfig } from '../../config/env.js';
const verifySilkronSignature = (req) => {
  const { silkronWebhookSecret } = getConfig();
  if (!silkronWebhookSecret) return true;
  const header =
    req.headers['x-webhook-token'] ?? req.headers['x-silkron-token'] ?? req.headers.authorization;
  const candidates = Array.isArray(header) ? header : [header];
  return candidates.some((token) => {
    if (!token) return false;
    const normalized = token.startsWith('Bearer ') ? token.slice(7) : token;
    return normalized === silkronWebhookSecret;
  });
};
const verifyTapSignature = (req) => {
  const { tapWebhookSecret } = getConfig();
  if (!tapWebhookSecret) return true;
  const signature = req.headers['tap-signature'];
  if (typeof signature !== 'string') {
    return false;
  }
  const rawBody = req.rawBody;
  if (!rawBody) {
    return false;
  }
  const computed = createHmac('sha256', tapWebhookSecret).update(rawBody).digest('hex');
  return computed === signature;
};
export const handleGenerateQr = async (req, res) => {
  const response = await generateMachineQr(req.params.machineId);
  return res.json(response);
};
export const handleSilkronWebhook = async (req, res) => {
  if (!verifySilkronSignature(req)) {
    return res.status(401).json({ status: 401, message: 'Invalid webhook signature' });
  }
  const response = await processSilkronWebhook(req.headers, req.body);
  return res.json(response);
};
export const handleTapWebhook = async (req, res) => {
  if (!verifyTapSignature(req)) {
    return res.status(401).json({ status: 401, message: 'Invalid webhook signature' });
  }
  const response = await processTapWebhook(req.headers, req.body);
  return res.json(response);
};
