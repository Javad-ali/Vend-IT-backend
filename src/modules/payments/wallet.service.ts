import { randomUUID } from 'node:crypto';
import { apiError, ok } from '../../utils/response.js';
import {
  attachPaymentProducts,
  createPayment,
  ensureWallet,
  incrementWallet,
  decrementWallet,
  recordWalletTransaction,
  updateUserTapId,
  createLoyaltyEntry,
  incrementLoyaltyBalance,
  getWalletBalance,
  setPaymentEarnedPoints
} from './payments.repository.js';
import { tapCreateCharge, tapCreateSavedCardToken } from './tap.client.js';
import { emptyCart } from '../cart/cart.service.js';
import { sendNotification } from '../notifications/notifications.service.js';
import { getMachineById } from '../machines/machines.repository.js';
import {
  calculatePurchasePoints,
  calculateRedemption,
  applyRedemption
} from './payments.service.js';
const formatAmount = (amount) => amount.toFixed(3);
const resolveMachineName = async (machineId) => {
  if (!machineId) return 'the vending machine';
  const machine = await getMachineById(machineId);
  return machine?.machine_tag ?? `machine ${machineId}`;
};
export const chargeWallet = async (userId, input) => {
  await ensureWallet(userId);
  let chargeId;
  if (input.tapCustomerId && input.tapCardId) {
    const token = await tapCreateSavedCardToken({
      cardId: input.tapCardId,
      customerId: input.tapCustomerId
    });
    const charge = await tapCreateCharge({
      amount: input.amount,
      currency: 'KWD',
      customerId: input.tapCustomerId,
      sourceId: token.id,
      orderRef: randomUUID()
    });
    chargeId = charge.id;
    await updateUserTapId(userId, input.tapCustomerId);
  }
  const wallet = await incrementWallet(userId, input.amount);
  const payment = await createPayment({
    userId,
    machineUId: input.machineId ?? null,
    transactionId: `wallet-${randomUUID()}`,
    paymentMethod: 'WALLET',
    status: 'CREDIT',
    amount: input.amount,
    chargeId: chargeId ?? undefined,
    tapCustomerId: input.tapCustomerId ?? null
  });
  if (input.products?.length) {
    await attachPaymentProducts({
      paymentId: payment.id,
      items: input.products.map((p) => ({ productUId: p.productId, quantity: p.quantity }))
    });
    await emptyCart(userId);
  }
  await recordWalletTransaction({
    userId,
    paymentId: payment.id,
    type: 'credit',
    amount: input.amount
  });
  await sendNotification({
    receiverId: userId,
    title: 'Wallet Charged',
    body: `Your wallet has been credited with KWD ${formatAmount(input.amount)}.`,
    type: 'WalletCredit',
    data: { paymentId: payment.id, amount: input.amount }
  });
  return ok({ balance: wallet?.balance ?? input.amount, payment }, 'Wallet charged successfully');
};
export const payWithWallet = async (userId, input) => {
  const redemption = await calculateRedemption(
    userId,
    input.pointsToRedeem,
    input.amount,
    input.products
  );
  const walletChargeAmount = redemption.payableAmount;
  let wallet = null;
  if (walletChargeAmount > 0) {
    wallet = await decrementWallet(userId, walletChargeAmount);
    if (!wallet || wallet.balance < 0) {
      throw new apiError(400, 'Insufficient wallet balance');
    }
  } else {
    wallet = await getWalletBalance(userId);
    if (!wallet) {
      await ensureWallet(userId);
      wallet = await getWalletBalance(userId);
    }
  }
  const payment = await createPayment({
    userId,
    machineUId: input.machineId,
    transactionId: `wallet-${randomUUID()}`,
    paymentMethod: walletChargeAmount > 0 ? 'WALLET' : 'LOYALTY',
    status: 'DEBIT',
    amount: walletChargeAmount,
    chargeId: walletChargeAmount > 0 ? `wallet-${Date.now()}` : undefined
  });
  await attachPaymentProducts({
    paymentId: payment.id,
    items: input.products.map((p) => ({ productUId: p.productId, quantity: p.quantity }))
  });
  const points = await calculatePurchasePoints(input.products, walletChargeAmount);
  if (points > 0) {
    await createLoyaltyEntry({
      userId,
      paymentId: payment.id,
      points,
      type: 'Credit',
      reason: 'purchase',
      metadata: { origin: 'purchase' }
    });
    await incrementLoyaltyBalance(userId, points);
    await setPaymentEarnedPoints(payment.id, points);
  }
  await applyRedemption(userId, payment.id, redemption);
  if (walletChargeAmount > 0) {
    await recordWalletTransaction({
      userId,
      paymentId: payment.id,
      type: 'debit',
      amount: walletChargeAmount,
      metadata:
        redemption.pointsRedeemed > 0
          ? { redeemedPoints: redemption.pointsRedeemed, redeemedAmount: redemption.redeemValue }
          : undefined
    });
  }
  await emptyCart(userId);
  const machineName = await resolveMachineName(input.machineId);
  await sendNotification({
    receiverId: userId,
    title: 'Wallet Purchase',
    body: `Wallet payment of KWD ${formatAmount(walletChargeAmount)} recorded for ${machineName}.`,
    type: 'WalletDebit',
    data: { paymentId: payment.id, amount: walletChargeAmount, machineId: input.machineId }
  });
  return ok(
    {
      balance: wallet?.balance ?? 0,
      payment,
      points,
      redeemedPoints: redemption.pointsRedeemed,
      redeemedAmount: redemption.redeemValue
    },
    'Payment done successfully'
  );
};
