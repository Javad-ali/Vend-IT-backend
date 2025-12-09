import {
  cardCreateSchema,
  cardPaymentSchema,
  dispenseSchema,
  gpayPaymentSchema,
  gpayTokenSchema,
  iosPaymentSchema,
  walletChargeSchema,
  walletPaymentSchema
} from './payments.validators.js';
import { createCard, deleteCard, listCards } from './cards.service.js';
import { chargeWallet, payWithWallet } from './wallet.service.js';
import {
  createGPayToken,
  getLoyaltyHistory,
  getUserLoyaltyConversion,
  getOrderHistory,
  getPaymentHistory,
  getWalletHistory,
  makeCardPayment,
  makeGPayPayment,
  saveIosPayment,
  updateDispensedProducts
} from './payments.service.js';
export const handleCreateCard = async (req, res) => {
  const payload = cardCreateSchema.parse(req.body);
  const response = await createCard(req.user.id, payload);
  return res.json(response);
};
export const handleListCards = async (req, res) => {
  const response = await listCards(req.user.id);
  return res.json(response);
};
export const handleDeleteCard = async (req, res) => {
  const response = await deleteCard(req.user.id, req.params.cardId);
  return res.json(response);
};
export const handleChargeWallet = async (req, res) => {
  const payload = walletChargeSchema.parse(req.body);
  const response = await chargeWallet(req.user.id, {
    amount: payload.amount,
    machineId: payload.machineId,
    tapCustomerId: payload.customerId,
    tapCardId: payload.cardId,
    products: payload.productIds?.map((p) => ({ productId: p.productId, quantity: p.quantity }))
  });
  return res.json(response);
};
export const handleWalletPayment = async (req, res) => {
  const payload = walletPaymentSchema.parse(req.body);
  const response = await payWithWallet(req.user.id, {
    amount: payload.amount,
    machineId: payload.machineId,
    products: payload.products,
    pointsToRedeem: payload.pointsToRedeem
  });
  return res.json(response);
};
export const handleCardPayment = async (req, res) => {
  const payload = cardPaymentSchema.parse(req.body);
  const response = await makeCardPayment(req.user.id, payload);
  return res.json(response);
};
export const handleIosPayment = async (req, res) => {
  const payload = iosPaymentSchema.parse(req.body);
  const response = await saveIosPayment(req.user.id, {
    amount: payload.amount,
    chargeId: payload.chargeId,
    customerId: payload.customerId,
    machineId: payload.machineId,
    products: payload.products,
    pointsToRedeem: payload.pointsToRedeem
  });
  return res.json(response);
};
export const handleGPayToken = async (req, res) => {
  const payload = gpayTokenSchema.parse(req.body);
  const response = await createGPayToken({
    tokenData: payload.tokenData,
    paymentMethodType: payload.paymentMethodType
  });
  return res.json(response);
};
export const handleGPayPayment = async (req, res) => {
  const payload = gpayPaymentSchema.parse(req.body);
  const response = await makeGPayPayment(req.user.id, {
    tokenId: payload.tokenId,
    amount: payload.amount,
    machineId: payload.machineId,
    products: payload.products,
    pointsToRedeem: payload.pointsToRedeem
  });
  return res.json(response);
};
export const handleDispenseUpdate = async (req, res) => {
  const payload = dispenseSchema.parse(req.body);
  const response = await updateDispensedProducts(req.user.id, {
    paymentId: payload.paymentId,
    machineId: payload.machineId,
    vendorPartNumbers: payload.vendorPartNumbers
  });
  return res.json(response);
};
export const handlePaymentHistory = async (req, res) =>
  res.json(await getPaymentHistory(req.user.id));
export const handleWalletHistory = async (req, res) =>
  res.json(await getWalletHistory(req.user.id));
export const handleOrderHistory = async (req, res) => res.json(await getOrderHistory(req.user.id));
export const handleLoyaltyHistory = async (req, res) =>
  res.json(await getLoyaltyHistory(req.user.id));
export const handleLoyaltyConversion = async (req, res) => {
  const response = await getUserLoyaltyConversion(req.user.id);
  return res.json(response);
};
