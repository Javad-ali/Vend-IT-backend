import { randomUUID } from 'node:crypto';
import { apiError, ok } from '../../utils/response.js';
import { getConfig } from '../../config/env.js';
import {
  attachPaymentProducts,
  createLoyaltyEntry,
  createPayment,
  getPaymentById,
  getUser,
  getWalletBalance,
  getLoyaltyBalance,
  incrementLoyaltyBalance,
  listPaymentHistory,
  listOrderHistory,
  listLoyaltyHistory,
  listWalletHistory,
  listPaymentProductQuantities,
  setDispensedQuantity,
  updateUserTapId,
  setPaymentEarnedPoints,
  setPaymentRedemption
} from './payments.repository.js';
import {
  tapCreateCharge,
  tapCreateChargeWithToken,
  tapCreateCustomer,
  tapCreateGPayToken,
  tapCreateSavedCardToken
} from './tap.client.js';
import { sendNotification } from '../notifications/notifications.service.js';
import { emptyCart } from '../cart/cart.service.js';
import { getMachineById } from '../machines/machines.repository.js';
import { getProductsByIds } from '../products/products.repository.js';
const config = getConfig();
export const LOYALTY_RATE = config.loyaltyBaseRate ?? 10;
const HEALTHY_MULTIPLIER = config.loyaltyHealthyMultiplier ?? 1.5;
const LOW_HEALTH_MULTIPLIER = config.loyaltyLowHealthMultiplier ?? 1;
const POINT_VALUE = config.loyaltyPointValue ?? 0.001;
const roundKwd = (amount) => Math.max(Math.round(amount * 1000) / 1000, 0);
const convertPointsToAmount = (points) => roundKwd(points * POINT_VALUE);
const convertAmountToPoints = (amount) => {
  const safe = Math.max(Number(amount) || 0, 0);
  return Math.floor(safe / POINT_VALUE);
};
const computeCartAmountFromProducts = (items, productMap) => {
  return items.reduce((sum, item) => {
    const quantity = Number(item.quantity ?? 0);
    if (!quantity || quantity <= 0) return sum;
    const record = productMap.get(item.productId);
    const price = record ? Number(record.unit_price ?? 0) : 0;
    if (!price || price <= 0) return sum;
    return sum + price * quantity;
  }, 0);
};
const sumCartAmount = async (items) => {
  if (!items?.length) return 0;
  const uniqueIds = [...new Set(items.map((item) => item.productId).filter(Boolean))];
  if (!uniqueIds.length) return 0;
  const products = await getProductsByIds(uniqueIds);
  if (!products?.length) return 0;
  const productMap = new Map(products.map((product) => [product.product_u_id, product]));
  return computeCartAmountFromProducts(items, productMap);
};
export const calculateRedemption = async (userId, requestedPoints, amount, items) => {
  let safeAmount = Math.max(Number(amount) || 0, 0);
  if (safeAmount <= 0 && items?.length) {
    const cartAmount = await sumCartAmount(items);
    if (cartAmount > 0) {
      safeAmount = cartAmount;
    }
  }
  const desiredPoints = requestedPoints ? Math.max(Math.floor(requestedPoints), 0) : 0;
  if (!desiredPoints || safeAmount <= 0) {
    return {
      requestedPoints: desiredPoints,
      pointsRedeemed: 0,
      redeemValue: 0,
      payableAmount: roundKwd(safeAmount)
    };
  }
  const balance = await getLoyaltyBalance(userId);
  const numericBalance = Math.floor(Number(balance) || 0);
  if (numericBalance < desiredPoints) {
    throw new apiError(400, 'Insufficient loyalty points');
  }
  const maxPointsForAmount = convertAmountToPoints(safeAmount);
  if (maxPointsForAmount <= 0) {
    return {
      requestedPoints: desiredPoints,
      pointsRedeemed: 0,
      redeemValue: 0,
      payableAmount: roundKwd(safeAmount)
    };
  }
  const pointsRedeemed = Math.min(desiredPoints, maxPointsForAmount);
  const redeemValue = convertPointsToAmount(pointsRedeemed);
  const payableAmount = roundKwd(Math.max(safeAmount - redeemValue, 0));
  return {
    requestedPoints: desiredPoints,
    pointsRedeemed,
    redeemValue,
    payableAmount
  };
};
export const applyRedemption = async (userId, paymentId, redemption) => {
  if (!redemption.pointsRedeemed) return;
  await createLoyaltyEntry({
    userId,
    paymentId,
    points: redemption.pointsRedeemed,
    type: 'Debit',
    reason: 'redeem',
    metadata: { amount: redemption.redeemValue }
  });
  await incrementLoyaltyBalance(userId, -redemption.pointsRedeemed);
  await setPaymentRedemption(paymentId, redemption.pointsRedeemed, redemption.redeemValue);
};
const formatAmount = (amount) => amount.toFixed(3);
const resolveMachineName = async (machineId) => {
  if (!machineId) return 'the vending machine';
  const machine = await getMachineById(machineId);
  return machine?.machine_tag ?? `machine ${machineId}`;
};
const extractHealthRating = (metadata) => {
  if (!metadata || typeof metadata !== 'object') return null;
  const value = metadata['health_rating'] ?? metadata['healthRating'];
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim().length) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};
export const calculatePurchasePoints = async (items, amount) => {
  let safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const list = items?.length ? items : [];
  if (!list.length) {
    return Math.round(safeAmount * LOYALTY_RATE);
  }
  const uniqueIds = [...new Set(list.map((item) => item.productId).filter(Boolean))];
  const products = uniqueIds.length ? await getProductsByIds(uniqueIds) : [];
  const productMap = new Map(products.map((product) => [product.product_u_id, product]));
  if (safeAmount <= 0 && productMap.size) {
    const computed = computeCartAmountFromProducts(list, productMap);
    if (computed > 0) {
      safeAmount = computed;
    }
  }
  const totalQuantity = list.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  const fallbackUnit = totalQuantity > 0 ? safeAmount / totalQuantity : safeAmount;
  let totalPoints = 0;
  for (const item of list) {
    const record = productMap.get(item.productId);
    const metadata = record?.metadata ?? null;
    const healthRating = extractHealthRating(metadata);
    const multiplier =
      healthRating && healthRating >= 3
        ? HEALTHY_MULTIPLIER
        : healthRating === 1
          ? LOW_HEALTH_MULTIPLIER
          : 1;
    const unitPrice = Number(record?.unit_price) || fallbackUnit || safeAmount;
    const basePoints = unitPrice * LOYALTY_RATE * (item.quantity ?? 0);
    totalPoints += basePoints * multiplier;
  }
  if (!Number.isFinite(totalPoints) || totalPoints <= 0) {
    return Math.round(safeAmount * LOYALTY_RATE);
  }
  return Math.round(totalPoints);
};
const awardPurchasePoints = async (userId, paymentId, items, amount) => {
  const points = await calculatePurchasePoints(items, amount);
  if (!points || points <= 0) return 0;
  await createLoyaltyEntry({
    userId,
    paymentId,
    points,
    type: 'Credit',
    reason: 'purchase',
    metadata: { origin: 'purchase' }
  });
  await incrementLoyaltyBalance(userId, points);
  return points;
};
const notifyPaymentSuccess = async (params) => {
  const machineName = await resolveMachineName(params.machineId);
  const formatted = formatAmount(params.amount);
  await sendNotification({
    receiverId: params.userId,
    title: 'Payment Successful',
    body: `Your ${params.method} payment of KWD ${formatted} for ${machineName} is confirmed.`,
    type: 'PaymentSuccess',
    data: {
      paymentId: params.paymentId,
      machineId: params.machineId ?? null,
      amount: params.amount,
      method: params.method
    }
  });
};
export const makeCardPayment = async (userId, input) => {
  const user = await getUser(userId);
  if (!user) throw new apiError(404, 'User not found');
  const redemption = await calculateRedemption(
    userId,
    input.pointsToRedeem,
    input.amount,
    input.products
  );
  let tapCustomerId = input.customerId ?? user.tapCustomerId;
  let transactionId = randomUUID();
  let status = 'PAID';
  let chargeId;
  let paymentMethod = redemption.payableAmount > 0 ? 'CARD' : 'LOYALTY';
  if (redemption.payableAmount > 0) {
    if (!tapCustomerId) {
      const customer = await tapCreateCustomer({
        firstName: user.firstName ?? 'Vend',
        lastName: user.lastName ?? 'User',
        email: user.email ?? 'missing@vendit.com',
        phone: user.phoneNumber ?? '0000000',
        userId
      });
      tapCustomerId = customer.id;
      await updateUserTapId(userId, tapCustomerId);
    }
    const token = await tapCreateSavedCardToken({
      cardId: input.cardId,
      customerId: tapCustomerId
    });
    const charge = await tapCreateCharge({
      amount: redemption.payableAmount,
      currency: 'KWD',
      customerId: tapCustomerId,
      sourceId: token.id,
      orderRef: randomUUID()
    });
    transactionId = charge.transaction?.authorization_id ?? transactionId;
    status = charge.status;
    chargeId = charge.id;
  }
  const payment = await createPayment({
    userId,
    machineUId: input.machineId,
    transactionId,
    paymentMethod,
    status,
    amount: redemption.payableAmount,
    chargeId,
    tapCustomerId
  });
  await attachPaymentProducts({
    paymentId: payment.id,
    items: input.products.map((p) => ({ productUId: p.productId, quantity: p.quantity }))
  });
  const points = await awardPurchasePoints(
    userId,
    payment.id,
    input.products,
    redemption.payableAmount
  );
  if (points > 0) {
    await setPaymentEarnedPoints(payment.id, points);
  }
  await applyRedemption(userId, payment.id, redemption);
  await emptyCart(userId);
  await notifyPaymentSuccess({
    userId,
    machineId: input.machineId,
    amount: redemption.payableAmount,
    method: payment.payment_method ?? 'CARD',
    paymentId: payment.id
  });
  return ok(
    {
      payment,
      points,
      redeemedPoints: redemption.pointsRedeemed,
      redeemedAmount: redemption.redeemValue
    },
    'Payment successful'
  );
};
export const saveIosPayment = async (userId, input) => {
  const user = await getUser(userId);
  if (!user) throw new apiError(404, 'User not found');
  const redemption = await calculateRedemption(
    userId,
    input.pointsToRedeem,
    input.amount,
    input.products
  );
  const payableAmount = redemption.payableAmount;
  if (payableAmount <= 0 && (!redemption.pointsRedeemed || redemption.pointsRedeemed <= 0)) {
    throw new apiError(400, 'Invalid payment amount');
  }
  const payment = await createPayment({
    userId,
    machineUId: input.machineId,
    transactionId: randomUUID(),
    paymentMethod: 'CARD',
    status: 'CAPTURED',
    amount: payableAmount,
    chargeId: input.chargeId,
    tapCustomerId: input.customerId ?? null
  });
  await attachPaymentProducts({
    paymentId: payment.id,
    items: input.products.map((p) => ({ productUId: p.productId, quantity: p.quantity }))
  });
  const points = await awardPurchasePoints(userId, payment.id, input.products, payableAmount);
  if (points > 0) {
    await setPaymentEarnedPoints(payment.id, points);
  }
  await applyRedemption(userId, payment.id, redemption);
  if (input.customerId) {
    await updateUserTapId(userId, input.customerId);
  }
  await emptyCart(userId);
  await notifyPaymentSuccess({
    userId,
    machineId: input.machineId,
    amount: payableAmount,
    method: payment.payment_method ?? 'CARD',
    paymentId: payment.id
  });
  return ok(
    {
      payment,
      points,
      redeemedPoints: redemption.pointsRedeemed,
      redeemedAmount: redemption.redeemValue
    },
    'Payment saved'
  );
};
export const makeGPayPayment = async (userId, input) => {
  const user = await getUser(userId);
  if (!user) throw new apiError(404, 'User not found');
  const redemption = await calculateRedemption(
    userId,
    input.pointsToRedeem,
    input.amount,
    input.products
  );
  let status = 'PAID';
  let transactionId = randomUUID();
  let chargeId;
  let paymentMethod = redemption.payableAmount > 0 ? 'GPay' : 'LOYALTY';
  if (redemption.payableAmount > 0) {
    const charge = await tapCreateChargeWithToken({
      amount: redemption.payableAmount,
      currency: 'KWD',
      tokenId: input.tokenId,
      orderRef: randomUUID(),
      email: user.email ?? 'missing@vendit.com',
      firstName: user.firstName ?? 'Vend'
    });
    status = charge.status;
    transactionId = charge.transaction?.authorization_id ?? transactionId;
    chargeId = charge.id;
    paymentMethod = charge.source?.payment_method ?? 'GPay';
  }
  const payment = await createPayment({
    userId,
    machineUId: input.machineId,
    transactionId,
    paymentMethod,
    status,
    amount: redemption.payableAmount,
    chargeId
  });
  await attachPaymentProducts({
    paymentId: payment.id,
    items: input.products.map((p) => ({ productUId: p.productId, quantity: p.quantity }))
  });
  const points = await awardPurchasePoints(
    userId,
    payment.id,
    input.products,
    redemption.payableAmount
  );
  if (points > 0) {
    await setPaymentEarnedPoints(payment.id, points);
  }
  await applyRedemption(userId, payment.id, redemption);
  await emptyCart(userId);
  await notifyPaymentSuccess({
    userId,
    machineId: input.machineId,
    amount: redemption.payableAmount,
    method: payment.payment_method ?? 'GPay',
    paymentId: payment.id
  });
  return ok(
    {
      payment,
      points,
      redeemedPoints: redemption.pointsRedeemed,
      redeemedAmount: redemption.redeemValue
    },
    'Payment successful'
  );
};
export const createGPayToken = async (input) => {
  const token = await tapCreateGPayToken({
    tokenData: input.tokenData,
    paymentMethodType: input.paymentMethodType
  });
  return ok(token, 'GPay token created');
};
export const updateDispensedProducts = async (userId, input) => {
  const payment = await getPaymentById(input.paymentId);
  const counts = input.vendorPartNumbers.reduce((acc, part) => {
    acc[part] = (acc[part] ?? 0) + 1;
    return acc;
  }, {});
  let updatedCount = 0;
  for (const [vendorPart, quantity] of Object.entries(counts)) {
    await setDispensedQuantity(input.paymentId, vendorPart, quantity as number);
    updatedCount += quantity as number;
  }
  if (counts && Object.keys(counts).length === 0) {
    throw new apiError(400, 'No vendor part numbers provided');
  }
  const orderedQuantities = await listPaymentProductQuantities(input.paymentId);
  const totalOrdered = orderedQuantities.reduce((sum, qty) => sum + qty, 0);
  const partialDispense = totalOrdered > 0 && updatedCount < totalOrdered;
  const machineName = await resolveMachineName(input.machineId);
  const chargeId = payment?.charge_id ?? 'N/A';
  const title = partialDispense ? 'Payment Refund' : 'Dispense update';
  const body = partialDispense
    ? `Refund process will start soon. Charge ID: [${chargeId}], Machine Name: [${machineName}]. Please wait for further updates`
    : `Dispense completed successfully for ${machineName}`;
  const type = partialDispense ? 'Refund' : 'DispenseUpdate';
  await sendNotification({
    receiverId: userId,
    title,
    body,
    type,
    data: { paymentId: input.paymentId, machineId: input.machineId }
  });
  return ok({ updated: updatedCount }, 'Dispensed quantities updated');
};
export const getPaymentHistory = async (userId) =>
  ok(await listPaymentHistory(userId), 'Payment history');
export const getWalletHistory = async (userId) => {
  const [walletRow, loyaltyPoints, history] = await Promise.all([
    getWalletBalance(userId),
    getLoyaltyBalance(userId),
    listWalletHistory(userId)
  ]);
  const transactions = history.map((entry) => {
    const payment =
      entry.payment && Array.isArray(entry.payment) ? entry.payment[0] : entry.payment;
    return {
      type: entry.type,
      amount: payment?.amount ?? entry.amount,
      id: payment?.id ?? null,
      charge_id: payment?.charge_id ?? null,
      payment_id: payment?.id ?? null,
      user_id: payment?.user_id ?? userId,
      machine_id: payment?.machine_u_id ?? null,
      transaction_id: payment?.transaction_id ?? null,
      status: payment?.status ?? null,
      payment_method: payment?.payment_method ?? 'WALLET',
      created_at: payment?.created_at ?? entry.created_at,
      updated_at: payment?.updated_at ?? entry.created_at
    };
  });
  return ok(
    {
      transaction: transactions,
      balance: walletRow?.balance ?? 0,
      loyalty_point: loyaltyPoints,
      id: walletRow?.id ?? null,
      user_id: userId,
      charge_id: null,
      payment_id: null,
      machine_id: null,
      transaction_id: null,
      status: null,
      payment_method: 'WALLET',
      amount: walletRow?.balance ?? 0,
      created_at: walletRow?.created_at ?? null,
      updated_at: walletRow?.updated_at ?? null
    },
    'Wallet history'
  );
};
export const getOrderHistory = async (userId) => {
  const rows = await listOrderHistory(userId);
  const formatted = (rows ?? []).map((row) => {
    const machine = Array.isArray(row.machine) ? row.machine[0] : row.machine;
    const productEntries = Array.isArray(row.products) ? row.products : [];
    const products = productEntries.map((entry) => {
      const product = Array.isArray(entry.product) ? entry.product[0] : entry.product;
      return {
        product_id: product?.product_u_id ?? null,
        name: product?.brand_name ?? product?.description ?? null,
        description: product?.description ?? null,
        image_url: product?.product_image_url ?? null,
        quantity: entry?.quantity ?? 0
      };
    });
    return {
      id: row.id,
      user_id: row.user_id ?? userId,
      machine_id: row.machine_u_id ?? machine?.u_id ?? null,
      transaction_id: row.transaction_id,
      status: row.status,
      payment_method: row.payment_method,
      amount: row.amount,
      points: row.earned_points ?? null,
      redeemed_points: row.redeemed_points ?? null,
      redeemed_amount: row.redeemed_amount ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at ?? row.created_at,
      machine_name: machine?.machine_tag ?? null,
      machine_image_url: machine?.machine_image_url ?? null,
      products
    };
  });
  return ok(formatted, 'Order history');
};
export const getLoyaltyHistory = async (userId) =>
  ok(await listLoyaltyHistory(userId), 'Loyalty history');
export const getLoyaltyConversionQuote = async (points) => {
  const safePoints = points < 0 ? 0 : points;
  const amount = Number((safePoints * POINT_VALUE).toFixed(3));
  return ok(
    {
      points: safePoints,
      rate: POINT_VALUE,
      amount
    },
    'Loyalty conversion'
  );
};
export const getUserLoyaltyConversion = async (userId) => {
  const balance = await getLoyaltyBalance(userId);
  const amount = Number((balance * POINT_VALUE).toFixed(3));
  return ok(
    {
      points: balance,
      rate: POINT_VALUE,
      amount
    },
    'Loyalty conversion'
  );
};
