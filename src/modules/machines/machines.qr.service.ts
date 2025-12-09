import QRCode from 'qrcode';
import { nanoid } from 'nanoid';
import { supabase } from '../../libs/supabase.js';
import { apiError, ok } from '../../utils/response.js';
import { getMachineById } from './machines.repository.js';
import { updateMachineQrCode, logWebhookEvent } from './machines.repository.js';
import {
  getPaymentByChargeId,
  getPaymentById,
  updatePaymentStatus
} from '../payments/payments.repository.js';
import { updateDispensedProducts } from '../payments/payments.service.js';
const QR_BUCKET = 'machines';
const getQrUrl = (path) => {
  const base = process.env.CDN_BASE_URL ?? '';
  return `${base}/machines/${path}`;
};
export const generateMachineQr = async (machineUId) => {
  const machine = await getMachineById(machineUId);
  if (!machine) throw new apiError(404, 'Machine not found');
  const qrPayload = `${process.env.APP_BASE_URL ?? 'https://vendit.example.com'}/machines/${machineUId}`;
  const buffer = await QRCode.toBuffer(qrPayload, { type: 'png', margin: 1, scale: 6 });
  const fileName = `qr-${machineUId}-${nanoid(6)}.png`;
  const upload = await supabase.storage.from(QR_BUCKET).upload(fileName, buffer, {
    upsert: true,
    contentType: 'image/png'
  });
  if (upload.error) {
    throw new apiError(500, 'Failed to upload QR code', upload.error.message);
  }
  await updateMachineQrCode(machineUId, fileName);
  return ok({ qrUrl: getQrUrl(fileName) }, 'QR code generated');
};
const normaliseBody = (body) => {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }
  if (body && typeof body === 'object') return body;
  return null;
};
const coerceStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
};
const deriveStatusFromTapEvent = (payload) => {
  const status = payload.status ?? payload.data?.object?.status;
  if (typeof status === 'string') {
    return status.toUpperCase();
  }
  const type = payload.type;
  if (typeof type === 'string') {
    if (type.includes('refunded')) return 'REFUNDED';
    if (type.includes('captured')) return 'CAPTURED';
    if (type.includes('authorized')) return 'AUTHORIZED';
    if (type.includes('failed')) return 'FAILED';
  }
  return undefined;
};
export const handleSilkronWebhook = async (headers, body) => {
  await logWebhookEvent({ source: 'silkron', headers, body });
  const payload = normaliseBody(body);
  if (!payload) {
    return ok(null, 'Silkron webhook stored');
  }
  const paymentId = payload.payment_id ?? payload.paymentId;
  const vendorParts =
    coerceStringArray(payload.vendor_part_numbers) || coerceStringArray(payload.vendorPartNumbers);
  if (!paymentId || vendorParts.length === 0) {
    return ok(null, 'Silkron webhook stored');
  }
  const payment = await getPaymentById(paymentId);
  if (!payment) {
    return ok(null, 'Silkron event ignored (unknown payment)');
  }
  const machineId = payload.machine_id ?? payload.machineId ?? payment.machine_u_id ?? '';
  await updateDispensedProducts(payment.user_id, {
    paymentId: payment.id,
    machineId,
    vendorPartNumbers: vendorParts
  });
  return ok(null, 'Silkron webhook processed');
};
export const handleTapWebhook = async (headers, body) => {
  await logWebhookEvent({ source: 'tap', headers, body });
  const payload = normaliseBody(body);
  if (!payload) {
    return ok(null, 'Tap webhook stored');
  }
  const chargeId = payload.id ?? payload.data?.object?.id;
  if (!chargeId) {
    return ok(null, 'Tap webhook stored');
  }
  const payment = await getPaymentByChargeId(chargeId);
  if (!payment) {
    return ok(null, 'Tap event ignored (unknown charge)');
  }
  const status = deriveStatusFromTapEvent(payload);
  if (!status || status === payment.status) {
    return ok(null, 'Tap webhook stored');
  }
  await updatePaymentStatus(payment.id, status);
  return ok(null, 'Tap webhook processed');
};
